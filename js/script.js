'use strict'

// Constants
const MINE = '💣'
const FLAG = '🚩'
const LIFE = '💖'
const HAPPY_FACE = '🧐'
const BLOWN_FACE = '🤯'
const SAD_FACE = '😭'
const EMPTY = ''
const HINT_SOUND = new Audio('sounds/hint.mp3')
const MINE_SOUND = new Audio('sounds/mine.mp3')
const MARK_SOUND = new Audio('sounds/mark.mp3')
const UNMARK_SOUND = new Audio('sounds/unmark.mp3')
const WIN_SOUND = new Audio('sounds/win.mp3')
const LOSE_SOUND = new Audio('sounds/lose.mp3')

// Model
var gBoard
var gGame
var gTimerInterval
var gLevel = {
  SIZE: 4,
  MINES: 2,
}
var gElHint
var gAudio

function onInit() {
  // Initialize game parameters
  var elRestartBtn = document.querySelector('.restart-btn')
  elRestartBtn.innerHTML = HAPPY_FACE
  gGame = {
    isOn: false,
    lockBoard: false,
    isHint: false,
    isDarkMode: false,
    shownCount: 0,
    mineShownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    livesCount: 3,
  }
  closeModal()
  resetTimer()
  renderLives()
  renderAllBestScores()

  // Build and render the game board
  gBoard = buildEmptyBoard(gLevel)
  renderBoard()
  console.log(gBoard) // Debugging
}

// A function that builds and returns a board with randomly placed mines
function buildBoard(level, cellI, cellJ) {
  // Create empty board and a mine counter
  var board = []
  var mineCounter = 0

  // Fill board with objs (some are mines)
  for (var i = 0; i < level.SIZE; i++) {
    board.push([])
    for (var j = 0; j < level.SIZE; j++) {
      // Random chance for cell to be a mine, if max mines is not reached
      var isMine = false
      if (
        !(i === cellI && j === cellJ) &&
        mineCounter < level.MINES &&
        Math.random() >= 0.72
      ) {
        isMine = true
        mineCounter++
      }
      // Insert cell obj in this location
      board[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: isMine,
        isMarked: false,
      }
    }
  }

  //  Update minesAroundCount if cell is not a mine
  for (var i = 0; i < level.SIZE; i++) {
    for (var j = 0; j < level.SIZE; j++) {
      var currCell = board[i][j]
      if (!currCell.isMine) {
        currCell.minesAroundCount = getMinesNegsCount(board, i, j)
      }
    }
  }

  return board
}

// A function which builds an empty board
function buildEmptyBoard(level) {
  var board = []
  for (var i = 0; i < level.SIZE; i++) {
    board[i] = []
    for (var j = 0; j < level.SIZE; j++) {
      board[i][j] = EMPTY
    }
  }
  return board
}

// A function which renders the board
function renderBoard() {
  // Create html string to represnt the board
  var strHTML = '<table><tbody>'
  for (var i = 0; i < gBoard.length; i++) {
    strHTML += '<tr>'
    for (var j = 0; j < gBoard[0].length; j++) {
      // Initially, all cells are hidden
      if (gGame.isDarkMode) {
        strHTML += `<td onmousedown="onMouseClicked(event,this,${i},${j})" class="hidden-cell cell-${i}-${j} hidden-cell-dark" oncontextmenu="return false;"></td>`
      } else {
        strHTML += `<td onmousedown="onMouseClicked(event,this,${i},${j})" class="hidden-cell cell-${i}-${j}" oncontextmenu="return false;"></td>`
      }
    }
    strHTML += '</tr>'
  }
  strHTML += '</tbody></table>'

  // Inject html string into board container
  var elBoardContainer = document.querySelector('.board-container')
  elBoardContainer.innerHTML = strHTML
}

// A function which counts cell neighbors (mines)
function getMinesNegsCount(board, cellI, cellJ) {
  var minesNegsCount = 0
  // looping through all surrounding cells of current cell
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    // Won't count beyond border
    if (i < 0 || i >= board.length) continue
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      // Won't count current cell
      if (i === cellI && j === cellJ) continue
      if (j < 0 || j >= board[i].length) continue
      if (board[i][j].isMine === true) minesNegsCount++
    }
  }
  return minesNegsCount
}

// A function that handles either right or left mouse click
function onMouseClicked(event, elCell, i, j) {
  // If board is locked (user either won or lost)
  if (gGame.lockBoard) return

  // Check if right click
  var isRightClick = false
  if (event.button === 2) {
    isRightClick = true
  }

  onCellClicked(isRightClick, elCell, i, j)
}

// A function which handels the affect of a cell being clicked
function onCellClicked(isRightClick, elCell, i, j) {
  // Game starts on first cell click
  if (!gGame.isOn) {
    gGame.isOn = true
    gBoard = buildBoard(gLevel, i, j)
    renderBoard()
    elCell = document.querySelector('.cell-' + i + '-' + j)
    startTimer()
  }

  var currCell = gBoard[i][j]
  if (gGame.isHint) {
    revealHint(elCell, currCell, i, j)
  } else if (isRightClick && !currCell.isShown) {
    onCellMarked(elCell, currCell)
  } else {
    // Left click
    onCellRevealed(elCell, currCell, i, j)
  }
  checkGameOver()
}

// A function which reveals the hint
function revealHint(elCell, currCell, cellI, cellJ) {
  if (currCell.isMine) {
    renderCell(elCell, currCell, 'mine-cell', MINE)
  } else {
    renderNumCell(elCell, currCell)
  }
  expandShown(cellI, cellJ)
  setTimeout(hideHint, 1000, elCell, currCell, cellI, cellJ)
}

// A function which hides the hint
function hideHint(elCell, currCell, cellI, cellJ) {
  hideCell(elCell, currCell)
  hideSurroundingCells(cellI, cellJ)
  gGame.isHint = false
  gElHint.style.display = 'none'
}

// A function which hides the cell
function hideCell(elCell, currCell) {
  if (currCell.isMine) {
    elCell.classList.remove('mine-cell')
  } else {
    elCell.classList.remove('num-cell')
  }
  elCell.innerHTML = EMPTY
  currCell.isShown = false
}

// A function which marks or unmarks current cell as a flag
function onCellMarked(elCell, currCell) {
  if (!elCell.classList.contains('flag-cell')) {
    currCell.isMarked = true
    renderCell(elCell, currCell, 'flag-cell', FLAG)
    if (currCell.isMine) gGame.markedCount++
    MARK_SOUND.play()
  } else {
    currCell.isMarked = false
    elCell.classList.remove('flag-cell')
    elCell.innerHTML = EMPTY
    if (currCell.isMine) gGame.markedCount--
    UNMARK_SOUND.play()
  }
}

// A function which reveals current cell as either a mine or number
function onCellRevealed(elCell, currCell, i, j) {
  if (currCell.isMarked) return
  if (currCell.isShown) return

  // Handle mine or num cell
  if (currCell.isMine) {
    reduceLives()
    renderCell(elCell, currCell, 'mine-cell', MINE)
    currCell.isShown = true
    gGame.mineShownCount++
    MINE_SOUND.play()
  } else {
    if (currCell.minesAroundCount === 0) {
      expandShown(i, j)
    }
    renderNumCell(elCell, currCell)
  }
}

// A function which reveals all surrounding cells of a givel cell
function expandShown(cellI, cellJ) {
  // looping through all surrounding cells of current cell
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    // Won't count beyond border
    if (i < 0 || i >= gBoard.length) continue
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      // Won't count current cell
      var currCell = gBoard[i][j]
      if (i === cellI && j === cellJ) continue
      if (j < 0 || j >= gBoard[i].length) continue

      // Recursion exit condition
      if (currCell.isShown) continue

      var elCell = document.querySelector('.cell-' + i + '-' + j)
      if (!currCell.isMarked || gGame.isHint) {
        if (currCell.isMine) {
          renderCell(elCell, currCell, 'mine-cell', MINE)
        } else {
          renderNumCell(elCell, currCell)

          // Recusively expand (only if hint mode not activated)
          if (!gGame.isHint && currCell.minesAroundCount === 0) {
            expandShown(i, j)
          }
        }
      }
    }
  }
}

// A function which hides all surrounding cells of a givel cell
function hideSurroundingCells(cellI, cellJ) {
  // looping through all surrounding cells of current cell
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    // Won't count beyond border
    if (i < 0 || i >= gBoard.length) continue
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      // Won't count current cell
      if (i === cellI && j === cellJ) continue
      if (j < 0 || j >= gBoard[i].length) continue
      var currCell = gBoard[i][j]
      var elCell = document.querySelector('.cell-' + i + '-' + j)
      hideCell(elCell, currCell)
    }
  }
}

// A function which renders a number cell if needed
function renderNumCell(elCell, currCell) {
  if (!currCell.isShown) {
    if (currCell.minesAroundCount === 0) {
      renderCell(elCell, currCell, 'num-cell', EMPTY)
    } else {
      renderCell(elCell, currCell, 'num-cell', currCell.minesAroundCount)
    }
    gGame.shownCount++
  }
}

// A function which reduce the lives count
function reduceLives() {
  gGame.livesCount--
  renderLives()
  // Change restart btn face only on first mine click (code won't repeat)
  if (gGame.livesCount === 2) {
    var elRestartBtn = document.querySelector('.restart-btn')
    elRestartBtn.innerHTML = BLOWN_FACE
  }
}

// A function which renders the lives
function renderLives() {
  var livesStr = ''
  for (let i = 0; i < gGame.livesCount; i++) {
    livesStr += LIFE
  }
  var elSpan = document.querySelector('.lives')
  elSpan.innerText = livesStr
}

// A function which handles the level (aka difficulty) selection
function onLevelSelect(level) {
  switch (level) {
    case 1:
      gLevel.SIZE = 4
      gLevel.MINES = 2
      break
    case 2:
      gLevel.SIZE = 8
      gLevel.MINES = 14
      break
    case 3:
      gLevel.SIZE = 12
      gLevel.MINES = 32
      break
  }
  onInit()
}

// A function to check if game is over (WIN or LOSE)
function checkGameOver() {
  // LOSE condition
  if (gGame.livesCount === 0) {
    LOSE_SOUND.play()
    stopTimer()
    revealAllMines()
    gGame.lockBoard = true
    var elRestartBtn = document.querySelector('.restart-btn')
    elRestartBtn.innerHTML = SAD_FACE
    openModal('You lost 🥴 GAME OVER')
    return
  }

  // WIN condition
  if (
    gGame.shownCount ===
    gLevel.SIZE * gLevel.SIZE - gGame.markedCount - gGame.mineShownCount
  ) {
    WIN_SOUND.play()
    stopTimer()
    gGame.lockBoard = true
    saveBestScore(gLevel.SIZE, gGame.secsPassed)
    openModal('And we have a WINNER!💰🏃‍♂️')
    return
  }
}

// A function which reveals all mines
function revealAllMines() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var currCell = gBoard[i][j]
      if (currCell.isMine) {
        var elCell = document.querySelector('.cell-' + i + '-' + j)
        renderCell(elCell, currCell, 'mine-cell', MINE)
      }
    }
  }
}

// A function which renders a cell (Mine,Num,Flag)
function renderCell(elCell, currCell, cellClass, cellContent) {
  elCell.classList.add(cellClass)
  elCell.innerHTML = cellContent
  if (!currCell.isMarked) currCell.isShown = true
}

// A function which opens the modal
function openModal(msg) {
  const elModal = document.querySelector('.modal')
  const elSpan = elModal.querySelector('.modal-msg')
  elSpan.innerText = msg
  elModal.style.display = 'block'
}

// A function which closes the modal
function closeModal() {
  const elModal = document.querySelector('.modal')
  elModal.style.display = 'none'
}

// A function which activate the hint
function activateHint(hint) {
  gElHint = document.querySelector('.hint-' + hint)
  gElHint.style.backgroundColor = '#e0a800'
  gGame.isHint = true
  HINT_SOUND.play()
}

// A function which allow to toggle between dark and light modes
function toggleDarkMode() {
  var elDarkBtn = document.querySelector('.dark-mode-btn')
  if (gGame.isDarkMode) {
    gGame.isDarkMode = false
    elDarkBtn.innerText = 'Dark Mode'
  } else {
    gGame.isDarkMode = true
    elDarkBtn.innerText = 'Light Mode'
  }
  var elHtml = document.querySelector('html')
  elHtml.classList.toggle('body-dark')
  var elBody = document.querySelector('body')
  elBody.classList.toggle('body-dark')
  var elFooter = document.querySelector('footer')
  elFooter.classList.toggle('footer-dark')

  applyDarkModeToElement('title-container', false)
  applyDarkModeToElement('diff-title', false)
  applyDarkModeToElement('diff-btn-container', false)
  applyDarkModeToElement('diff-btn', true)
  applyDarkModeToElement('best-score-container', false)
  applyDarkModeToElement('game-elements-container', false)
  applyDarkModeToElement('hint-btn', true)
  applyDarkModeToElement('timer', false)
  applyDarkModeToElement('dark-mode-btn', false)
  applyDarkModeToElement('lives', false)
  applyDarkModeToElement('hidden-cell', true)
}

// A function which apply dark mode to the element or elements
function applyDarkModeToElement(className, isMultiple) {
  if (!isMultiple) {
    var element = document.querySelector('.' + className)
    element.classList.toggle(className + '-dark')
  } else {
    var elements = document.querySelectorAll('.' + className)
    elements.forEach((element) => {
      element.classList.toggle(className + '-dark')
    })
  }
}
