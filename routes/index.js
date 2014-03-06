// Connect to MongoDB using Mongoose
var mongoose = require('mongoose');
var db;
if (process.env.VCAP_SERVICES) {
   var env = JSON.parse(process.env.VCAP_SERVICES);
   db = mongoose.createConnection(env['mongodb-2.2'][0].credentials.url);
} else {
   db = mongoose.createConnection('localhost', 'techlabforms');
}

// Get Poll schema and model
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);

// Get Form and Results schema and model
var FormSchema = require('../models/Form.js').FormSchema;
var ResultsSchema = require('../models/Form.js').ResultsSchema;
var TechlabForm = db.model('forms', FormSchema);
var TechlabFormResults = db.model('formresults', ResultsSchema);

// Main application view
exports.index = function(req, res) {
	res.render('index');
};

// JSON API for list of polls
exports.list = function(req, res) {
	// Query Mongo for polls, just get back the question text
	Poll.find({}, 'question', function(error, polls) {
		res.json(polls);
	});
};

// JSON API for list of forms
exports.listForms = function(req, res) {
	// Query Mongo for forms, just get back the form title
	TechlabForm.find({}, 'title', function(error, forms) {
		res.json(forms);
	});
};

// JSON API for getting a single poll
exports.poll = function(req, res) {
	// Poll ID comes in the URL
	var pollId = req.params.id;
	
	// Find the poll by its ID, use lean as we won't be changing it
	Poll.findById(pollId, '', { lean: true }, function(err, poll) {
		if(poll) {
			var userVoted = false,
					userChoice,
					totalVotes = 0;

			// Loop through poll choices to determine if user has voted
			// on this poll, and if so, what they selected
			for(c in poll.choices) {
				var choice = poll.choices[c]; 

				for(v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes++;

					if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
						userVoted = true;
						userChoice = { _id: choice._id, text: choice.text };
					}
				}
			}

			// Attach info about user's past voting on this poll
			poll.userVoted = userVoted;
			poll.userChoice = userChoice;

			poll.totalVotes = totalVotes;
		
			res.json(poll);
		} else {
			res.json({error:true});
		}
	});
};

// JSON API for getting a single form
exports.form = function(req, res) {
	// Form ID comes in the URL
	var formId = req.params.id;
	
	// Find the form by its ID, use lean as we won't be changing it
	TechlabForm.findById(formId, '', function(err, form) {
		if(form) {
			res.json(form);
		} else {
			res.json({error:true});
		}
	});
};

// JSON API for getting a single form results
exports.results = function(req, res) {
	// Form ID comes in the URL
	var formId = req.params.id;
	
	// Find the form by its ID, use lean as we won't be changing it
	TechlabFormResults.find({"form_id": formId}, function(err, results) {
		if(results) {
			res.json(results);
		} else {
			res.json({error:true});
		}
	});
};

// JSON API for initializing form results
exports.initResults = function(req, res) {
	// Form ID comes in the URL
	var formId = req.params.id;
	var results = new TechlabFormResults();
	results.form_id = formId;
	
	// Find the form by its ID, use lean as we won't be changing it
	TechlabForm.findById(formId, '', function(err, form) {
		if(form) {
			for(i=0; i<form.fields.length; i++) {
				results.results.push({field_id: form.fields[i].field_id, label: form.fields[i].label, values: []});
			}
			res.json(results);
		} else {
			res.json({error:true});
		}
	});
};


// JSON API for creating a new poll
exports.create = function(req, res) {
	var reqBody = req.body,
			// Filter out choices with empty text
			choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
			// Build up poll object to save
			pollObj = {question: reqBody.question, choices: choices};
				
	// Create poll model from built up poll object
	var poll = new Poll(pollObj);
	
	// Save poll to DB
	poll.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}
	});
};

// JSON API for creating a new form
exports.createForm = function(req, res) {
	var reqBody = req.body,
		// Filter out choices with empty text
		fields = reqBody.fields.filter(function(v) { return v.text != ''; }),
		// Build up form object to save
		formObj = {
			_id: reqBody._id,
			title: reqBody.title,
			fields: fields
		};
				
	// Create form model from built up poll object
	var form = new TechlabForm(formObj);
	
	// Save form to DB
	form.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}
	});
};

exports.vote = function(socket) {
	//Poll submission processing
	socket.on('send:vote', function(data) {
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
		
		Poll.findById(data.poll_id, function(err, poll) {
			var choice = poll.choices.id(data.choice);
			choice.votes.push({ ip: ip });
			
			poll.save(function(err, doc) {
				var theDoc = { 
					question: doc.question, _id: doc._id, choices: doc.choices, 
					userVoted: false, totalVotes: 0 
				};

				// Loop through poll choices to determine if user has voted
				// on this poll, and if so, what they selected
				for(var i = 0, ln = doc.choices.length; i < ln; i++) {
					var choice = doc.choices[i]; 

					for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
						var vote = choice.votes[j];
						theDoc.totalVotes++;
						theDoc.ip = ip;

						if(vote.ip === ip) {
							theDoc.userVoted = true;
							theDoc.userChoice = { _id: choice._id, text: choice.text };
						}
					}
				}
				
				socket.emit('myvote', theDoc);
				socket.broadcast.emit('vote', theDoc);
			});			
		});
	});

	//Form submission processing
	socket.on('send:submit', function(data) {
		//var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
		var result = data;
		console.log(result);

		var formResults = new TechlabFormResults(result);
		
		formResults.save(function(err, doc) {
			if(err || !doc) {
				console.log(err);
				throw 'Error: ' + err.message;
			} else {
				socket.emit('mysubmit', doc);
				socket.broadcast.emit('submit', doc);
			}
		});
	});
};