// Angular module, defining routes for polls
angular.module('polls', ['ngRoute', 'pollServices', 'formServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/polls', { templateUrl: 'partials/list.html', controller: PollListCtrl }).
			when('/poll/:pollId', { templateUrl: 'partials/item.html', controller: PollItemCtrl }).
			when('/new', { templateUrl: 'partials/new.html', controller: PollNewCtrl }).
			when('/forms', { templateUrl: 'partials/formlist.html', controller: FormListCtrl }).
			when('/form/:formId', { templateUrl: 'partials/formitem.html', controller: FormResultsCtrl }).
			when('/newform', { templateUrl: 'partials/newform.html', controller: FormNewCtrl }).
			// If invalid route, just redirect to the main list view
			otherwise({ redirectTo: '/polls' });
	}]);