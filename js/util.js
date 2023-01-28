'use strict'

// A function which starts the game timer
function startTimer() {
  var startTime = Date.now()
  gTimerInterval = setInterval(function () {
    var elapsedTime = Date.now() - startTime
    var secsPassed = (elapsedTime / 1000).toFixed(3)
    gGame.secsPassed = secsPassed
    document.querySelector('.timer').innerHTML = secsPassed
  }, 50)
}

// A function which stops the game timer
function stopTimer() {
  clearInterval(gTimerInterval)
  // findBestScore(gLevel.SIZE, gGame.secsPassed)
}

// A function which stops and resets the game timer
function resetTimer() {
  stopTimer()
  var elTimerDiv = document.querySelector('.timer')
  elTimerDiv.innerHTML = 'Timer'
}

// A function which renders all best scores
function renderAllBestScores() {
  renderBestScore(4, '.beginner')
  renderBestScore(8, '.medium')
  renderBestScore(12, '.expert')
}
//  A function which render the best score of the level
function renderBestScore(levelSize, className) {
  var elScoreBeg = document.querySelector(className)
  var bestScoreStr = 'Best Score: '
  if (loadBestScore(levelSize) === 0) bestScoreStr += 'N/A'
  else bestScoreStr += loadBestScore(levelSize)
  elScoreBeg.innerHTML = bestScoreStr
}

// A function which saves the best score
function saveBestScore(levelSize, secsPassed) {
  if (typeof Storage !== 'undefined') {
    var bestScore = getBestScoreLevel(levelSize)
    var localBestScore = localStorage.getItem(bestScore)
    if (!localBestScore || secsPassed < localBestScore) {
      localStorage.setItem(bestScore, secsPassed)
    }
  }
}
// A function which loads the best score
function loadBestScore(levelSize) {
  var bestScore = getBestScoreLevel(levelSize)
  if (localStorage.getItem(bestScore) !== null) {
    return localStorage.getItem(bestScore)
  } else {
    return 0
  }
}
// A function which returns the level for the best score
function getBestScoreLevel(levelSize) {
  var bestScoreLevel
  switch (levelSize) {
    case 4:
      bestScoreLevel = 'beginner'
      break
    case 8:
      bestScoreLevel = 'medium'
      break
    case 12:
      bestScoreLevel = 'expert'
      break
  }
  return bestScoreLevel;
}