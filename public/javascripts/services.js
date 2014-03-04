// Angular Poll service module for connecting to JSON APIs
angular.module('pollServices', ['ngResource']).
	factory('Poll', function($resource) {
		return $resource('polls/:pollId', {}, {
			// Use this method for getting a list of polls
			query: { method: 'GET', params: { pollId: 'polls' }, isArray: true }
		})
	}).
	factory('socket', function($rootScope) {
		var socket = io.connect();
		return {
			on: function (eventName, callback) {
	      socket.on(eventName, function () {  
	        var args = arguments;
	        $rootScope.$apply(function () {
	          callback.apply(socket, args);
	        });
	      });
	    },
	    emit: function (eventName, data, callback) {
	      socket.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(socket, args);
	          }
	        });
	      })
	    }
		};
	});

// Angular Form service module for connecting to JSON APIs
angular.module('formServices', ['ngResource']).
	factory('TechlabForm', function($resource) {
		return $resource('forms/:formId', {}, {
			// Use this method for getting a list of fields
			query: { method: 'GET', params: { formId: 'forms' }, isArray: true }
		})
	}).
	factory('TechlabFormResults', function($resource) {
		return $resource('results/:formId', {}, {
			// Use this method for getting a list of forms
			query: { method: 'GET', params: { formId: 'results' }, isArray: true }
		})
	}).
	factory('socket', function($rootScope) {
		var socket = io.connect();
		return {
			on: function (eventName, callback) {
		      socket.on(eventName, function () {  
		        var args = arguments;
		        $rootScope.$apply(function () {
		          callback.apply(socket, args);
		        });
		      });
		    },
		    emit: function (eventName, data, callback) {
		      socket.emit(eventName, data, function () {
		        var args = arguments;
		        $rootScope.$apply(function () {
		          if (callback) {
		            callback.apply(socket, args);
		          }
		        });
		      })
		    }
		};
	});