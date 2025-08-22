function initializeLocal() {
    const buttonBox = document.querySelector('.btns');
    const btns = document.querySelectorAll('.btns .btn');
    const x_turn = document.querySelector('.x_turn');
    const o_turn = document.querySelector('.o_turn');
    const showChange = document.querySelector('.showChange');
    const choose = document.querySelectorAll('.choose');
    const startingPage = document.querySelector('.starting_page');
    const mainPage = document.querySelector('.main_page');
    const winnerName = document.querySelector('.winnerName');
    const winnerPage = document.querySelector('.winner_page');
    const playAgainBtn = document.querySelector('.playAgainBtn');
    const timerAnimation = document.querySelector('.timer');

    let changeTurn = false;
    let hasWinner = false;
    let turnTimer;

    function startTimer() {
        clearTimeout(turnTimer);
        resetAnimation();
        turnTimer = setTimeout(() => {
            changeTurn = !changeTurn;
            updateTurnIndicator();
            startTimer();
        }, 4000);
    }

    function resetAnimation() {
        timerAnimation.style.animation = 'none';
        timerAnimation.offsetHeight;
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
                changeTurn = false;
            } else {
                changeTurn = true;
            }
            updateTurnIndicator();
            startingPage.style.display = "none";
            mainPage.style.display = "block";
            startTimer();
        });
    });

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.innerHTML === "") {
                if (!changeTurn) {
                    btn.innerHTML = 'X';
                    btn.style.background = '#ABADC7';
                    btn.id = "X";
                } else {
                    btn.innerHTML = 'O';
                    btn.style.background = '#5623D8';
                    btn.id = "O";
                }
                btn.style.pointerEvents = "none";
                changeTurn = !changeTurn;
                updateTurnIndicator();
                startTimer();

                winningFunc();
                if (!hasWinner) {
                    drawFunc();
                }
            }
        });
    });

    const winningCombinations = [
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

            if (btns[b[0]].id === "" || btns[b[1]].id === "" || btns[b[2]].id === "") {
                continue;
            }

            if (btns[b[0]].id === "X" && btns[b[1]].id === "X" && btns[b[2]].id === "X") {
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
                clearTimeout(turnTimer);
                break;
            } else if (btns[b[0]].id === "O" && btns[b[1]].id === "O" && btns[b[2]].id === "O") {
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
                clearTimeout(turnTimer);
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
            clearTimeout(turnTimer);
        }
    }

    function incrementWinCount(player) {
        if (player === "X") {
            let xWins = document.getElementById('x_wins_count');
            xWins.innerHTML = parseInt(xWins.innerHTML) + 1;
        } else if (player === "O") {
            let oWins = document.getElementById('o_wins_count');
            oWins.innerHTML = parseInt(oWins.innerHTML) + 1;
        }
    }

    function resetGame() {
        changeTurn = false;
        hasWinner = false;

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
}

