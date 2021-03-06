angular.module('rehjeks.profile', [
  'ngCookies'
])

.controller('UserprofileController', function($scope, Server, $cookies, $location, $moment) {

  $scope.user = {
    username: $cookies.get('username'),
    difficulties: { // Number of challenges solved at each difficulty (populated later)
      easy: 0,
      medium: 0,
      hard: 0
    },
    challenges: [], // Where to store the challenge/solution object tuples when we fetch them
    points: 0,
    show: false
  };

  $scope.formatTime = function(timeStr) {
    return $moment(timeStr).fromNow();
  };

  // Watch the cookies and send us away if we log out while on the page
  $scope.$watch(function() {return $cookies.get('username'); }, function(newValue) {
    if (!newValue) {
      $location.path('/solve');
    }
  });

  // Get the challenges the user has solved

  $scope.getUserChallenges = function() {
  	return Server.getUserChallenges($scope);
  };

  $scope.show = function() {
    return $scope.user.show === !$scope.user.show;
  };

  // Format time to solve (mm:ss)
  $scope.showTime = function(timeStr) {
    return new Date(Number(timeStr)).toUTCString().slice(20,25);
  }

  // Initialize by populating the challenges and calculating the status
  $scope.getUserChallenges()
  .then(function(challenges) {
    $scope.user.challenges.forEach(function(challenge){
      if(challenge.challenge.difficulty === 'easy'){
        $scope.user.difficulties.easy++;
      }
      else if(challenge.challenge.difficulty === 'medium'){
        $scope.user.difficulties.medium++;
      }
      else if(challenge.challenge.difficulty === 'hard'){
        $scope.user.difficulties.hard++;
      }
    })

    // Assign point value!
    let {user: {difficulties: {easy, medium, hard}}} = $scope;
    $scope.user.points = (
      hard * 3
      + medium * 2
      + easy * 1
    );

  });

});
