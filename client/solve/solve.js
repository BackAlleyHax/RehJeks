angular.module('rehjeks.solve', [
  'ngAnimate'
])
.controller('SolveController', function($scope, $interval, Server, $sce, $timeout, $cookies, RegexParser) {

  ////////////////////////
  // Internal variables
  // & functions
  ////////////////////////


  var challStartTime = new Date();


  var updateTimer = function(startTime) {
    var now = new Date();
    var secondsElapsed = Math.floor( (now - startTime) / 1000 );
    $scope.seconds = secondsElapsed % 60;
    $scope.minutes = Math.floor(secondsElapsed / 60);
    if (!$scope.minutes) {
      $scope.showHint = decideToShowTypingHint();
    }
  };

  var decideToShowTypingHint = function() {
    if (window.GlobalUser.solvedChallenges.length > 1
      || $cookies.get('username')
      || $scope.attempt !== '//gi'
      || $scope.seconds >= 10) {
      return false;
    }
    else if ($scope.seconds >= 2) {
      return true;
    }
  }

  ////////////////////////
  // $scope variables
  ////////////////////////

  $scope.regexValid;
  $scope.attempt;
  $scope.challengeData = {};
  $scope.seconds = 0;
  $scope.minutes = 0;
  $scope.showTypeHint = false;
  $scope.correctAttempt;




  ////////////////////////
  // $scope functions
  ////////////////////////


  $scope.checkRegex = function() {
    valid = RegexParser($scope.attempt);
    if (valid) {
      $scope.highlight();
    }
    $scope.regexValid = true;

  };

  $scope.checkSolution = function() {
    // Only check solution if user has input valid regex
    if ($scope.regexValid) {

      var attemptRegex = RegexParser($scope.attempt);

      // Create matches for user's input
      var userAnswers = $scope.challengeData.text.match(attemptRegex);

      // Compare user's answers to challenge answers
      var correctSolution = solutionsMatch(userAnswers, $scope.challengeData.expected);

      if (correctSolution) {
        $scope.correctAttempt = $scope.attempt;
        return true;
      } else {
        // Put the actual matches on the scope to regurgitate to the user in the failure fanfare box
        $scope.attemptMatch = userAnswers;
        return false;
      }

    }


  };

  $scope.highlight = function() {

    let currentRegex = RegexParser($scope.attempt);

    let highlightedText = $scope.challengeData.text.replace(currentRegex,
      '<span class="highlighted-text">$&</span>');

    $scope.highlightedText = $sce.trustAsHtml(highlightedText);

    if ($scope.checkSolution()) {
      $scope.timeToSolve = new Date() - challStartTime;
      $scope.success = true;
      $scope.failure = false;
    } else {
      $scope.failure = false;
    };

  };

  $scope.submit = function() {
    if ($scope.success) {
      Server.submitUserSolution($scope.correctAttempt, $scope.challengeData.id, $scope.timeToSolve);
      window.GlobalUser.solvedChallenges.push($scope.challengeData.id);
      $scope.success = false;
      $scope.failure = false;
      $scope.getRandom();
    } else {
      $scope.failure = true;
    }
  };


  $scope.getRandom = function() {
    Server.getRandom($scope)
    .then((testString) => {
      $scope.highlightedText = $sce.trustAsHtml(testString);
      $scope.success = false;
      $scope.failure = false;
      $scope.$broadcast('focusOnMe');
    });
    $scope.attempt = '//gi';
    $scope.attemptMatch = undefined;
    challStartTime = new Date();
  };


  ////////////////////////
  // Run scripts!!
  ////////////////////////

  // Load Challenge
  if (Server.currentChallenge.data !== undefined) {
    $scope.challengeData = Server.currentChallenge.data;
    $scope.highlightedText = $sce.trustAsHtml(Server.currentChallenge.data.text);
    $scope.attempt = '//gi';

    // Timeout to wait until the page has fully loaded first.
    $timeout(function() {
      $scope.$broadcast('focusOnMe');
    }, 0);

  } else {
    $scope.getRandom();
  }

  // Start Timer
  var solutionClock = $interval(function() {
    updateTimer(challStartTime);
  }, 1000);



})
// Custom Directive to trigger focus on the regex prompt in the correct cursor position
// Just broadcast a "focusOnMe" event in the scope to trigger this action.
.directive('focusOnMe', function() {
  return function (scope, element) {
    scope.$on('focusOnMe', function() {
      element[0].focus();
      element[0].setSelectionRange(1,1);
    });
  };
});

var solutionsMatch = function(arr1, arr2) {
    if (!arr2 || !arr1) {
      return false;
    }
    var i;
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  };
