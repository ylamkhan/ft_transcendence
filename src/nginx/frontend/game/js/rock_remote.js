function setupRockRemote() {
    const rockremote = document.querySelectorAll('.playremote');
    const gameContainer = document.querySelector(".wrapper-remote");
    const startingPage = document.querySelector('.starting_page');
    const playerCard = document.getElementById("player_card");
    const opponentCard = document.getElementById("opponent_card");
    const result = document.querySelector(".result");
    const optionImages = document.querySelectorAll(".option_image");
    const winnerName = document.querySelector('.winnerName');
    const winnerPage = document.querySelector('.winner_page');
    const playAgainBtn = document.querySelector('.playAgainBtn');

    let changeTurn = false;
    const imagesMap = {
        R: "images/rock.png",
        P: "images/paper.png",
        S: "images/scissors.png"
      };

    function endGame(winner, left) {
        if (winner && !left)
            winnerName.innerHTML = `${winner} won the match`;
        else if (winner && left)
            winnerName.innerHTML = `${winner}`;
        else
            winnerName.innerHTML = `the match is drawn`;
        setTimeout(() => {
            gameContainer.style.display = 'none';
            winnerPage.style.display = 'block';
        }, 300);
    }

    function startGame(data) {
        let player;
        const keysPressed = {};
        const roomName = data.room_name;
        player = data.player_side;
        rocksocket = new WebSocket(
            'wss://' + window.location.host + '/ws/rock/room/' + roomName + '/');

        rocksocket.onopen = function(e) {
        };

        rocksocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            if (data.type === 'send_message')
            {
                if (data.result == 'first')
                {
                    result.textContent = `${data.winner} won!`;
                    endGame(data.winner, false);
                } else if (data.result == 'second')
                {
                    result.textContent = `${data.winner} won!`;
                    endGame(data.winner, false);
                } else if (data.result == 'Draw')
                {
                    result.textContent = 'Match Drawn';
                    endGame('', false);
                } else
                {
                    result.textContent = 'wait...';
                    changeTurn = data.turnChange;
                }
            }
            else
                endGame(data.message, true);
        };

        rocksocket.onclose = function(e) {
        };

        window.func = function(box_id) {
            let image = document.getElementById(box_id.toString());
            let action;
            if (box_id == 1) {
                action = "R";
            } else if (box_id == 2) {
                action = "P";
            } else {
                action = "S";
            }
            
            rocksocket.send(JSON.stringify({
                'action': action,
                'changeTurn': changeTurn,
            }));
        }
        
    }

    rockremote.forEach(chooseNow => {
        chooseNow.addEventListener('click', () => {
            const displayWait = document.querySelector(".wait");
            displayWait.classList.add('dispaly');
            gameContainer.style.display = "none";
            
            matchmaking = new WebSocket(
                'wss://' + window.location.host + '/ws/rock/wait_for_opponent1/'
            );
            matchmaking.onopen = function () {
                matchmaking.send(JSON.stringify({'message':'Enter Queue'}));
                startingPage.style.display = "none";
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
                            // startTimer();
                        }, 2000);
                    }
                    if (data.game == "start") {
                        displayWait.classList.remove('dispaly');
                        playerCard.innerHTML = `
                            <img src="${data.player_avatar}" alt="User" />
                            <p>${data.player_username}</p>
                        `;
                        opponentCard.innerHTML = `
                            <img src="${data.opponent_avatar}" alt="User" />
                            <p>${data.opponent_username}</p>
                        `;
                        gameContainer.style.display = "block";
                        startGame(data);
                    }
                }
            };
            matchmaking.onclose = function (e) {
            }
        });
    });

    function resetGame() {
        changeTurn = false;

        winnerName.innerHTML = "";
        result.textContent = "Let's Play!!";
        document.getElementById("waiting_status").innerHTML = `<div class="spinner"></div>`;
        setTimeout(() => {
            startingPage.style.display = "block";
            winnerPage.style.display = "none";
        }, 100);
    }

    playAgainBtn.addEventListener('click', () => {
        if (matchmaking)
            matchmaking.close();
        if (rocksocket)
            rocksocket.close();
        resetGame();
    });

    document.getElementById('leaveGameButton').addEventListener('click', function() {
        loadContentInDiv('#gaming');
    });
  }
  
  