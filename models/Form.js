var mongoose = require('mongoose');

// Subdocument schema for poll choices
exports.ResultsSchema = new mongoose.Schema({
	form_id: { type: String, required: true },
	submitted: { type: Date, default: Date.now },
	results: [
		{
			field_id: String,
			label: String,
			values: [{}]
		}
	]
});

// Document schema for polls
exports.FormSchema = new mongoose.Schema({
	_id: { type: String, required: true },
	title: { type: String, required: true },
	fields: [new mongoose.Schema({
		field_id: String,
		label: String,
		type: String,
		multi: Boolean,
		values: [{id: String, value: String}]
	},
	{_id: false})]
});