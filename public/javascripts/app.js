// Angular module, defining routes for polls
angular.module('polls', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'pollServices', 'formServices', 'googlechart']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/polls', { templateUrl: 'partials/list.html', controller: PollListCtrl }).
			when('/poll/:pollId', { templateUrl: 'partials/item.html', controller: PollItemCtrl }).
			when('/new', { templateUrl: 'partials/new.html', controller: PollNewCtrl }).
			when('/forms', { templateUrl: 'partials/formlist.html', controller: FormListCtrl }).
			when('/form/:formId', { templateUrl: 'partials/formitem.html' }).
			when('/newform', { templateUrl: 'partials/newform.html', controller: FormNewCtrl }).
			when('/results/:formId/:query?', { templateUrl: 'partials/results.html', controller: FormResultsCtrl }).
			// If invalid route, just redirect to the main list view
			otherwise({ redirectTo: '/polls' });
	}]);