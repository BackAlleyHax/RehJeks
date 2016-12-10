angular.module('rehjeks.solve', [
  'ngAnimate'
])
.controller('SolveController', function($scope, $interval, Server, $sce, $timeout) {

  ////////////////////////
  // Internal variables
  // & functions
  ////////////////////////

  var validation = /\/((?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/((?:g(?:im?|mi?)?|i(?:gm?|mg?)?|m(?:gi?|ig?)?)?)/;
  var regexBody = /[^\/].*(?=\/[gim]{0,3}$)/;
  var regexFlags = /[gim]{0,3}$/;
  var challStartTime = new Date();


  var updateTimer = function(startTime) {
    var now = new Date();
    var secondsElapsed = Math.floor( (now - startTime) / 1000 );
    $scope.seconds = secondsElapsed % 60;
    $scope.minutes = Math.floor(secondsElapsed / 60);
    if (!$scope.minutes) {
      if ($scope.seconds === 1) {
        $scope.showTypeHint = true;
      } else if ($scope.seconds >= 10) {
        $scope.showTypeHint = false;
      }
    }
  };

  ////////////////////////
  // $scope variables
  ////////////////////////

  $scope.regexValid;
  $scope.attempt;
  $scope.challengeData = {};
  $scope.seconds = 0;
  $scope.minutes = 0;
  $scope.showTypeHint = false;




  ////////////////////////
  // $scope functions
  ////////////////////////


  $scope.checkGex = function() {

    var valid = validation.test($scope.attempt);
    if (valid) {
      $scope.highlight();
    }
    $scope.regexValid = valid;


    console.log('Valid Regix = ', $scope.RegexValid);
    console.log('body is ', $scope.attempt.match(regexBody));
    console.log('flags are ', $scope.attempt.match(regexFlags));

  };

  $scope.checkSolution = function() {
    // Only check solution if user has input valid regex
    if ($scope.regexValid) {
      // Disaggregate user's input into regex components

      var attemptRegex = makeRegex();

      // Create matches for user's input
      var userAnswers = $scope.challengeData.text.match(attemptRegex);

      console.log('__you got: ', userAnswers);

      // Compare user's answers to challenge answers
      var correctSolution = solutionsMatch(userAnswers, $scope.challengeData.expected);
      console.log('answers match ', correctSolution);

      if (correctSolution) {
        // Submit solution to server
        $scope.timeToSolve = new Date() - challStartTime;

        //add challengeId to Global User's completed challenges array
        window.GlobalUser.solvedChallenges.push($scope.challengeData.id);
        console.log($scope.challengeData);


        // Trigger success fanfare box, cancel failure fanfare box
        $scope.success = true;
        $scope.failure = false;
      } else {

        // Trigger failure fanfare box and store the current matches on the scope
        $scope.failure = true;
        $scope.attemptMatch = userAnswers;
      }

    }


  };

  $scope.highlight = function() {

    let currentRegex = makeRegex();

    let highlightedText = $scope.challengeData.text.replace(currentRegex,
      '<span class="highlighted-text">$&</span>');

    $scope.highlightedText = $sce.trustAsHtml(highlightedText);
  };

  $scope.next = function() {
    Server.submitUserSolution($scope.attempt, $scope.challengeData.id, $scope.timeToSolve);
    console.log('______Called submitUserSolution factory');
    $scope.success = false;
    $scope.failure = false;
    $scope.getRandom();
  };


  $scope.getRandom = function() {
    console.log('SolveController calling getRandom');
    Server.getRandom($scope)
    .then((testString) => {
      $scope.highlightedText = $sce.trustAsHtml(testString);
      $scope.$broadcast('focusOnMe');
    });
    $scope.success = false;
    $scope.failure = false;
    $scope.attempt = '//gi';
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
    // console.log('$scope.seconds is ', $scope.seconds);``
  }, 1000);

  var makeRegex = function() {
    var attemptBody = $scope.attempt.match(regexBody);
    var attemptFlags = $scope.attempt.match(regexFlags);

    // Create new regex object
    return new RegExp(attemptBody, attemptFlags);
  };


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
