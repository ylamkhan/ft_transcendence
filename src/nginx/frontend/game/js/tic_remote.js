function initializeRemote() {
    const buttonBox = document.querySelector('.btns');
    const btns = document.querySelectorAll('.btns .btn');
    const x_turn = document.querySelector('.x_turn');
    const o_turn = document.querySelector('.o_turn');
    const showChange = document.querySelector('.showChange');
    const playremote = document.querySelectorAll('.playremote');
    const startingPage = document.querySelector('.starting_page');
    const mainPage = document.querySelector('.main_page');
    const winnerName = document.querySelector('.winnerName');
    const winnerPage = document.querySelector('.winner_page');
    const playAgainBtn = document.querySelector('.playAgainBtn');
    const timerAnimation = document.querySelector('.timer');

    let changeTurn = false;
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

    function startGame(data) {

        let player;
        const keysPressed = {};
        const roomName = data.room_name;
        player = data.player_side;
        ticsocket = new WebSocket(
            'wss://' + window.location.host + '/ws/tictactoe/room/' + roomName + '/');

        ticsocket.onopen = function(e) {
            ticsocket.send(JSON.stringify({ 'message': 'start' }));
        };

        ticsocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            changeTurn = data.turnChange;
            if (data.status == 'game_interupted')
            {
                winnerName.innerHTML = `${data.message}`;

                setTimeout(() => {
                    mainPage.style.display = 'none';
                    winnerPage.style.display = 'block';
                }, 300);
                clearTimeout(turnTimer);
            }
            else if (data.status == 'initialize')
            {
                updateTurnIndicator();
                startTimer();
            }
            else {
                let currectbtn = document.getElementById(data.col.toString());
                currectbtn.innerHTML = (changeTurn == true) ? 'O' : 'X';
                currectbtn.style.background = (changeTurn == true) ? '#5623D8' : '#ABADC7';
                currectbtn.style.pointerEvents = "none";
                changeTurn = !changeTurn;
                updateTurnIndicator();
                startTimer();
                let result = data.result;
                if (result != '')
                    winningFunc(result);
                if (result == 'd')
                    drawFunc();
            }
        };

        ticsocket.onclose = function(e) {
        };

        window.func = function(box_id) {
            let box_content = document.getElementById(box_id.toString()).textContent;
            let row;
            
            if (box_content === '') {
                if (box_id <= 3) {
                    row = 0;
                } else if (box_id <= 6) {
                    row = 1;
                } else {
                    row = 2;
                }
                
                ticsocket.send(JSON.stringify({
                    'row': row,
                    'col': box_id,
                    'changeTurn': changeTurn,
                }));
            }
        }
        
    }

    playremote.forEach(chooseNow => {
        chooseNow.addEventListener('click', () => {
            const displayWait = document.querySelector(".wait");
            displayWait.classList.add('dispaly');
            startingPage.style.display = "none";

            matchmaking = new WebSocket(
                'wss://' + window.location.host + '/ws/tictactoe/wait_for_opponent/'
            );
            matchmaking.onopen = function () {
                matchmaking.send(JSON.stringify({'message':'Enter Queue'}));
            };
            matchmaking.onmessage = function (e) {
                const data = JSON.parse(e.data);
                if (data.status == 'waiting') {
                    if (!data.player_avatar)
                        return;
                    const namePlayer = document.getElementById("player");
                    const op = document.getElementById("waiting_status");
                    namePlayer.innerHTML = `
                        <img  class="" src="${data.player_avatar}" />
                    `;
                    op.innerHTML = `
                        <div class="spinner"></div>
                    `;
                }
                else if (data.status == 'match_found') {
                    if (!data.player_avatar || !data.opponent_avatar)
                        return;
                    const namePlayer = document.getElementById("player");
                    const op = document.getElementById("waiting_status");
                    namePlayer.innerHTML = 
                    `   <img  class="" src="${data.player_avatar}" />
                    `;
                    op.innerHTML = `
                    <img  class="" src="${data.opponent_avatar}" />
                    `;
                    if (data.time == "stop") {
                        setTimeout(function() {
                            startTimer();
                        }, 2000);
                    }
                    if (data.game == "start") {
                        startingPage.style.display = "none";
                        displayWait.classList.remove('dispaly');
                        mainPage.style.display = "block";
                        startGame(data);
                    }
                }
            };
            matchmaking.onclose = function (e) {
                // 'wss://' + window.location.host + '/ws/tictactoe/wait_for_opponent/'
            }
        });
    });

    function winningFunc(result) {

        if (result == 'X') {
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
        } else if (result == 'O'){
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
        }
    }

    function drawFunc() {
        winnerName.innerHTML = 'Match has been Drawn!';
        setTimeout(() => {
            mainPage.style.display = 'none';
            winnerPage.style.display = 'block';
        }, 300);
        clearTimeout(turnTimer);
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

        winnerName.innerHTML = "";
        btns.forEach(btn => {
            btn.innerHTML = "";
            btn.style.background = "";
            btn.style.pointerEvents = "auto";
        });
        const op = document.getElementById("waiting_status");
        op.innerHTML = `
            <div class="spinner"></div>
        `;
        startingPage.style.display = "block";
        mainPage.style.display = "none";
        winnerPage.style.display = "none";

    }
    playAgainBtn.addEventListener('click', () => {
        if (matchmaking)
            matchmaking.close();
        if (ticsocket)
            ticsocket.close();
        resetGame();
    });
    document.getElementById('leaveGameButton').addEventListener('click', function() {
        loadContentInDiv('#gaming');
    });
}

