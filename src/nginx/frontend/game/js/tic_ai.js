function initialize() {
    var buttonBox = document.querySelector('.btns'),
        btns = document.querySelectorAll('.btns .btn'),
        x_turn = document.querySelector('.x_turn'),
        o_turn = document.querySelector('.o_turn'),
        showChange = document.querySelector('.showChange'),
        choose = document.querySelectorAll('.choose'),
        startingPage = document.querySelector('.starting_page'),
        mainPage = document.querySelector('.main_page'),
        winnerName = document.querySelector('.winnerName'),
        winnerPage = document.querySelector('.winner_page'),
        playAgainBtn = document.querySelector('.playAgainBtn'),
        timerAnimation = document.querySelector('.timer');

    let changeTurn = false;
    let hasWinner = false;
    let turnTimer;
    var aiChoice = 'X';
    var humchoice;
    let isx;

    function startTimer() {
        clearTimeout(turnTimer);
        resetAnimation(); // Reset the CSS animation
        turnTimer = setTimeout(() => {
            changeTurn = !changeTurn; // Switch turn if time runs out
            updateTurnIndicator();
            startTimer(); // Restart timer for the next turn
        }, 4000); // 4 seconds timer
    }

    function resetAnimation() {
        timerAnimation.style.animation = 'none';
        timerAnimation.offsetHeight; // Trigger reflow to reset animation
        timerAnimation.style.animation = 'animate 4s linear forwards';
    }

    function updateTurnIndicator() {
        if (changeTurn) {
            buttonBox.classList.remove('x');
            buttonBox.classList.add('o');
            timerAnimation.style.background = '#5623D8';
            showChange.style.left = '50%';
            showChange.style.background = '#5623D8';
            o_turn.style.color = '#fff';
            x_turn.style.color = '#000';
        } else {
            buttonBox.classList.add('x');
            buttonBox.classList.remove('o');
            timerAnimation.style.background = '#ABADC7';
            showChange.style.left = '0';
            showChange.style.background = '#ABADC7';
            o_turn.style.color = '#000';
            x_turn.style.color = '#fff';
        }
    }

    choose.forEach(chooseNow => {
        chooseNow.addEventListener('click', () => {
            if (chooseNow.id == 'playerX') {
                aiChoice = 'O';
                humchoice = 'X';
                changeTurn = false;
                isx = false;
                updateTurnIndicator();
            } else {
                aiChoice = 'X';
                humchoice = 'O';
                isx = true;
                changeTurn = true;
                updateTurnIndicator();
            }
            startingPage.style.display = "none";
            mainPage.style.display = "block";
            startTimer(); // Start timer when game starts
        });
    });

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.innerHTML === "" && !hasWinner) {
                if (!changeTurn) {
                    btn.innerHTML = 'X';
                    btn.style.background = '#ABADC7';
                    btn.id = "X";
                    btn.style.pointerEvents = "none";
                    changeTurn = true;
                    updateTurnIndicator();
                    if (isx === false) {
                        disablePlayerInput(); // Disable player input while AI is making a move
                        setTimeout(aiMove, 500); // Delay AI move slightly for a smoother experience
                    }
                } else {
                    btn.innerHTML = 'O';
                    btn.style.background = '#5623D8';
                    btn.id = "O";
                    btn.style.pointerEvents = "none";
                    changeTurn = false;
                    updateTurnIndicator();
                    if (isx === true) {
                        disablePlayerInput(); // Disable player input while AI is making a move
                        setTimeout(aiMove, 500); // Delay AI move slightly for a smoother experience
                    }
                }
                startTimer();
                winningFunc();
                if (!hasWinner) {
                    drawFunc();
                }
            }
        });
    });

    let winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    function winningFunc() {
        for (let a = 0; a <= 7; a++) {
            let b = winningCombinations[a];

            if (btns[b[0]].id == "" || btns[b[1]].id == "" || btns[b[2]].id == "") {
                continue;
            } else if (btns[b[0]].id == "X" && btns[b[1]].id == "X" && btns[b[2]].id == "X") {
                winnerName.innerHTML = `Player <span class="winnerText">X</span> Won The Game!`;

                let winnerText = document.querySelector('.winnerText');
                winnerText.style.color = '#ABADC7';
                playAgainBtn.style.backgroundColor = '#ABADC7';
                hasWinner = true;

                incrementWinCount("X");

                setTimeout(() => {
                    mainPage.style.display = 'none';
                    winnerPage.style.display = 'block';
                }, 300);
                clearTimeout(turnTimer); // Stop timer when game ends
                break;
            } else if (btns[b[0]].id == "O" && btns[b[1]].id == "O" && btns[b[2]].id == "O") {
                winnerName.innerHTML = `Player <span class="winnerText">O</span> Won The Game!`;

                let winnerText = document.querySelector('.winnerText');
                winnerText.style.color = '#5623D8';
                playAgainBtn.style.backgroundColor = '#5623D8';
                hasWinner = true;

                incrementWinCount("O");

                setTimeout(() => {
                    mainPage.style.display = 'none';
                    winnerPage.style.display = 'block';
                }, 300);
                clearTimeout(turnTimer); // Stop timer when game ends
                break;
            }
        }
    }

    function drawFunc() {
        if (!hasWinner && Array.from(btns).every(box => box.id != "")) {
            winnerName.innerHTML = 'Match has been Drawn!';
            setTimeout(() => {
                mainPage.style.display = 'none';
                winnerPage.style.display = 'block';
            }, 300);
            clearTimeout(turnTimer); // Stop timer when game ends
        }
    }

    function incrementWinCount(player) {
        if (player === "X") {
            let xWins = document.getElementById('x_wins_count');
            xWins.innerHTML = parseInt(xWins.innerHTML) + 1;
        } else if (player == "O") {
            let oWins = document.getElementById('o_wins_count');
            oWins.innerHTML = parseInt(oWins.innerHTML) + 1;
        }
    }

    function resetGame() {
        changeTurn = false; // Reset the changeTurn flag
        hasWinner = false; // Reset the hasWinner flag

        winnerName.innerHTML = "";
        btns.forEach(btn => {
            btn.innerHTML = "";
            btn.id = "";
            btn.style.background = "";
            btn.style.pointerEvents = "auto";
        });

        startingPage.style.display = "block";
        mainPage.style.display = "none";
        winnerPage.style.display = "none";
    }

    playAgainBtn.addEventListener('click', () => {
        resetGame();
    });

    document.getElementById('leaveGameButton').addEventListener('click', function() {
        loadContentInDiv('#gaming');
    });

    function aiMove() {
        setTimeout(() => {
            const allButtonsFilled = Array.from(btns).every(btn => btn.innerHTML !== '');
            if (allButtonsFilled) {
                return;
            }
    
            let bestMove = findBestMove();
            let bestBtn = btns[bestMove];
    
            if (bestBtn.innerHTML !== '') {
                return;
            }
    
            bestBtn.innerHTML = aiChoice;
            bestBtn.style.background = aiChoice === 'X' ? '#ABADC7' : '#5623D8';
            bestBtn.id = aiChoice;
            bestBtn.style.pointerEvents = "none";
    
            changeTurn = !changeTurn;
            updateTurnIndicator();
            winningFunc();
    
            if (!hasWinner) {
                drawFunc();
                startTimer();
            }
    
            enablePlayerInput();
        }, 1000);
    }    

    function findBestMove() {
        let bestValue = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < btns.length; i++) {
            if (btns[i].id === "") {
                btns[i].id = aiChoice;
                let moveValue = minimax(0, false);
                btns[i].id = "";
                if (moveValue > bestValue) {
                    bestMove = i;
                    bestValue = moveValue;
                }
            }
        }
        return bestMove;
    }

    function minimax(depth, isMaximizing) {
        let score = evaluateBoard();
        if (score === 10) return score - depth;
        if (score === -10) return score + depth;
        if (Array.from(btns).every(btn => btn.id !== "")) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < btns.length; i++) {
                if (btns[i].id === "") {
                    btns[i].id = aiChoice;
                    best = Math.max(best, minimax(depth + 1, !isMaximizing));
                    btns[i].id = "";
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < btns.length; i++) {
                if (btns[i].id === "") {
                    btns[i].id = humchoice;
                    best = Math.min(best, minimax(depth + 1, !isMaximizing));
                    btns[i].id = "";
                }
            }
            return best;
        }
    }

    function evaluateBoard() {
        for (let i = 0; i < winningCombinations.length; i++) {
            let [a, b, c] = winningCombinations[i];
            if (btns[a].id === btns[b].id && btns[b].id === btns[c].id) {
                if (btns[a].id === aiChoice) return 10;
                if (btns[a].id === humchoice) return -10;
            }
        }
        return 0;
    }

    function disablePlayerInput() {
        btns.forEach(btn => {
            btn.style.pointerEvents = "none";
        });
    }

    function enablePlayerInput() {
        btns.forEach(btn => {
            if (btn.id === "") {
                btn.style.pointerEvents = "auto";
            }
        });
    }
}
