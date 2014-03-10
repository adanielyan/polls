// Controller for the poll list
function PollListCtrl($scope, Poll) {
	$scope.polls = Poll.query();
}

// Controller for the form list
function FormListCtrl($scope, TechlabForm) {
	$scope.forms = TechlabForm.query();
}

// Controller for an individual poll
function PollItemCtrl($scope, $routeParams, socket, Poll) {	
	$scope.poll = Poll.get({pollId: $routeParams.pollId});
	
	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll = data;
		}
	});
	
	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll.choices = data.choices;
			$scope.poll.totalVotes = data.totalVotes;
		}		
	});
	
	$scope.vote = function() {
		var pollId = $scope.poll._id,
			choiceId = $scope.poll.userVote;
		
		if(choiceId) {
			var voteObj = { poll_id: pollId, choice: choiceId };
			socket.emit('send:vote', voteObj);
		} else {
			alert('You must select an option to vote for');
		}
	};
}

// Controller for an individual form
function FormItemCtrl($scope, $routeParams, $timeout, socket, TechlabForm, TechlabFormResults) {	
	TechlabForm.get({formId: $routeParams.formId}, function(form) {
		$scope.message = {type: "info", text: ""};
		$scope.showAlert = false;
		
		var hideAlert = function() {
			$scope.showAlert = false;
		}

		$scope.init = function(form) {
			$scope.form = form;
			$scope.results = TechlabFormResults.init.get({formId: $routeParams.formId});
		} 

		$scope.init(form);

		socket.on('mysubmit', function(data) {
			$scope.init(form);
		});
		
		socket.on('submit', function(data) {
			$scope.init(form);		
		});
		
		$scope.submit = function() {
			var	results = $scope.results;
			
			for(i=0; i<results.results.length; i++) {
				results.results[i].values = results.results[i].values.filter(function(n){return n; });
			}
			
			var result = jQuery.parseJSON(angular.toJson(results));
			socket.emit('send:submit', result);
			$scope.message = {type: "success", text: "Form has been submitted!"};
			$scope.showAlert = true;
			$timeout(hideAlert, 5000);
			$scope.init(form);
		};
	});
}

// Controller for an form results
function FormResultsCtrl($scope, $routeParams, socket, TechlabFormResults) {

	TechlabFormResults.results.query({form: $routeParams.formId}, function(data) {
		console.log(data);
		$scope.showResults = false;
		$scope.rawResults = data;

		if(data.length > 0) $scope.showResults = true;

		// //pagination
		// $scope.totalItems = data.length;
		// $scope.itemsPerPage = 10;
		// $scope.currentPage = 1;
		// $scope.maxSize = 5;

		// $scope.$watch('currentPage', function() {
		// 	var begin = (($scope.currentPage - 1) * $scope.itemsPerPage),
		// 	end = begin + $scope.itemsPerPage;

		// 	$scope.filteredResults = $scope.rawResults.slice(begin, end);
		// }); //end of pagination
		options = {
			"title": "",
			"isStacked": "true",
			"fill": 20,
			"displayExactValues": true,
			"vAxis": {
				"title": "Drinks",
				"gridlines": {
					"count": 6
				}
			},
			"hAxis": {
				"title": "Gender"
			}
		};

		$scope.chart1 = {title: "Drinks per Gender", body: buildChart("BarChart", options)};
	});

	function buildChart(type, options) {

			var chart = {
			  "type": type,
			  "cssStyle": "height:500px; width:100%;",
			  "data": {
			    "cols": [
			      {
			        "id": "gender",
			        "label": "Gender",
			        "type": "string",
			        "p": {}
			      },
			      {
			        "id": "beer",
			        "label": "Beer",
			        "type": "number",
			        "p": {}
			      },
			      {
			        "id": "wine",
			        "label": "Wine",
			        "type": "number",
			        "p": {}
			      },
			      {
			        "id": "soft-drink",
			        "label": "Soft Drink",
			        "type": "number",
			        "p": {}
			      }
			    ],
			    "rows": []
			  },
			  "options": options,
			  "formatters": {},
			  "displayed": true
			};

			chart.data.rows = $scope.rawResults;

			return chart;
		}
	
	socket.on('mysubmit', function(data) {
		$scope.showResults = true;
		//$scope.rawResults.push(data);
	});
	
	socket.on('submit', function(data) {
		//console.dir(data);
		$scope.showResults = true;
		//$scope.rawResults.push(data);		
	});

		// [{
		//         "c": [
		//           {
		//             "v": "Male"
		//           },
		//           {
		//             "v": 2,
		//           },
		//           {
		//             "v": 1,
		//           },
		//           {
		//             "v": 1,
		//           },
		//         ]
		//       },
		//       {
		//         "c": [
		//           {
		//             "v": "Female"
		//           },
		//           {
		//             "v": 0
		//           },
		//           {
		//             "v": 1,
		//           },
		//           {
		//             "v": 2
		//           },
		//         ]
		//       }];
}	

// Controller for creating a new poll
function PollNewCtrl($scope, $location, Poll) {
	// Define an empty poll model object
	$scope.poll = {
		question: '',
		choices: [ { text: '' }, { text: '' }, { text: '' }]
	};
	
	// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.poll.choices.push({ text: '' });
	};
	
	// Validate and save the new poll to the database
	$scope.createPoll = function() {
		var poll = $scope.poll;
		
		// Check that a question was provided
		if(poll.question.length > 0) {
			var choiceCount = 0;
			
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = poll.choices.length; i < ln; i++) {
				var choice = poll.choices[i];
				
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
		
			if(choiceCount > 1) {
				// Create a new poll from the model
				var newPoll = new Poll(poll);
				
				// Call API to save poll to the database
				newPoll.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						$location.path('polls');
					} else {
						alert('Could not create poll');
					}
				});
			} else {
				alert('You must enter at least two choices');
			}
		} else {
			alert('You must enter a question');
		}
	};
}

// Controller for creating a new form
function FormNewCtrl($scope, $location, TechlabForm) {
	// Define an empty form model object
	var i = 0;

	var Field = function() {
		this.field_id = 'f' + parseInt(i),
		this.label = '',
		this.type = 'text',
		this.multi = false,
		this.values = []
	};

	$scope.form = {
		_id : '',
		title: '',
		fields : [new Field()]
	};
	
	// Method to add an additional field
	$scope.addField = function() {
		var field = new Field();
		field.field_id = 'f' + parseInt(++i);
		$scope.form.fields.push(new Field());
	};
	
	// Validate and save the new form to the database
	$scope.createForm = function() {
		var form = $scope.form;
		
		// Check that form's id was provided
		if(form._id.length > 0) {
			var fieldCount = 0;
			
			// Loop through the fields, make sure at least one was provided
			for(var i = 0, ln = form.fields.length; i < ln; i++) {
				var field = form.fields[i];
				
				if(field.label.length > 0) {
					fieldCount++
				}
			}
		
			if(fieldCount > 1) {
				// Create a new form from the model
				var newForm = new TechlabForm(form);
				
				// Call API to save form to the database
				newForm.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						$location.path('forms');
					} else {
						alert('Could not create form');
					}
				});
			} else {
				alert('You must create at least one field');
			}
		} else {
			alert('You must enter a form id');
		}
	};
}