function PhandleTournamentremote() {
    var renderer, scene, camera, pointLight, spotLight;
    var fieldWidth = 300, fieldHeight = 150;
    var paddleWidth, paddleHeight, paddleDepth, paddleQuality;
    var paddle1DirY = 0, paddle2DirY = 0, paddleSpeed = 3;
    var ball, paddle1, paddle2;
    var ballDirX = 1, ballDirY = 1, ballSpeed = 2;
    var score1 = 0, score2 = 0;
    var maxScore = 7;
    var difficulty = 0.2;
    var maxTime = 4;

    let csocket;
    var remoteParticipants;
    var match_id;
    let player_id;
    let opponent_id;
    let round;
    var confetti;
    let is_created = false;

    const createRemote = document.getElementById('create-tournament-section-remote');
    const tournamentNameInputRemote = createRemote.querySelector('#tournament-name');
    const tournamentList = document.querySelector('.existing-tournaments-list');

    document.getElementById('createTournamentBtn').addEventListener('click', function () {
        document.getElementById('remote-tournament-options').style.display = 'none';
        createRemote.style.display = 'block';
    });
    
    document.getElementById('joinTournamentBtn').addEventListener('click', function () {
        document.getElementById('remote-tournament-options').style.display = 'none';
        tournamentList.style.display = 'block';
    });

    document.querySelector('#tournament-list').addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const tournamentName = e.target.textContent;
            joinTournamentWebSocket(tournamentName);
        }
    });
    
    tournamentNameInputRemote.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            submitTournamentNameRemote();
        }
    });
    
    createRemote.querySelector("#start-tournament-btn").addEventListener("click", function(event) {
        event.preventDefault();
        submitTournamentNameRemote();
    });

    function RemoteSocket() {
        csocket = new WebSocket('wss://' + window.location.host + '/ws/remotetournament/');
    
        csocket.onopen = function (e) {
        };
    
        csocket.onmessage = function (e) {
            const data = JSON.parse(e.data);
    
            if (data.type === 'tournament_list') {
                updateTournamentList(data.tournaments);
            } else if (data.type === 'duplicate') {
                document.getElementById('create-tournament-section-remote').style.display = 'block';
                document.querySelector('.existing-tournaments-list').style.display = 'none';
                displayErrorMessage('Tournament name already exists. Please choose a different name.');
            }
        };
    
        csocket.onclose = function (e) {
        };
    }
    RemoteSocket();
    
    function updateTournamentList(tournaments) {
        const tournamentList = document.querySelector('.existing-tournaments-list ol');
        tournamentList.innerHTML = '';
    
        tournaments.forEach(tournament => {
            addTournamentToList(tournament);
        });
    
        if (is_created)
        {
            is_created = false;
            document.getElementById('create-tournament-section-remote').style.display = 'none';
            document.querySelector('.existing-tournaments-list').style.display = 'block';
        }
    }
    
    function addTournamentToList(tournamentName) {
        const tournamentList = document.querySelector('.existing-tournaments-list ol');
        const li = document.createElement('li');
        li.textContent = tournamentName;
        // li.addEventListener('click', () => joinTournament(tournamentName));
        tournamentList.prepend(li);
    }

    function cameraPhysics1() {
        camera.position.x = -243;
        camera.position.y = 0;
        camera.position.z = 107;
        camera.rotation.x = -0.008377580409572781;
        camera.rotation.y = -1.0471975511965976;
        camera.rotation.z = -1.5707963267948966;
    }

    function renderGame(gameState, playerSide) {
        // Update ball position
        ball.position.x = playerSide === 'right' ? -gameState.ball.x : gameState.ball.x;
        ball.position.y = gameState.ball.y;
    
        // Update paddle positions
        if (playerSide === 'left') {
            paddle1.position.y = gameState.paddles.left.y;
            paddle2.position.y = gameState.paddles.right.y;
        } else {
            paddle1.position.y = gameState.paddles.right.y;
            paddle2.position.y = gameState.paddles.left.y;
        }
    
        // Update scores
        document.getElementById("scores1").innerText = "Score: " + gameState.score.left;
        document.getElementById("scores2").innerText = "Score: " + gameState.score.right;
        document.getElementById('chrono').textContent = gameState.chrono_display;
    
        // Render the scene
        renderer.render(scene, camera);
        cameraPhysics1();
    }
    
    function startGameRemote(data, tournamentName) {
        let socket;
        const roomName = data.room_name;
        const playerSide = data.player_side;
    
        socket = new WebSocket(
            'wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/' + match_id + '/' + roomName + '/'
        );
    
        socket.onopen = function(e) {
            socket.send(JSON.stringify({ 'message': 'start' }));
        };
    
        socket.onmessage = function(e) {
            const gameState = JSON.parse(e.data);
            if (gameState.type === 'game_over') {
                const winner = determineWinner(gameState.final_scores);
                sendWinnerToServer(tsocket, winner, data.room_name);
            } else {
                renderGame(gameState, playerSide);
            }
        };
    
        socket.onclose = function(e) {
        };
    
        document.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowUp' || event.key === 'w') {
                socket.send(JSON.stringify({ 'paddle_move': 'up' }));
            } else if (event.key === 'ArrowDown' || event.key === 's') {
                socket.send(JSON.stringify({ 'paddle_move': 'down' }));
            }
        });
    
        document.addEventListener('keyup', function(event) {
            if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'ArrowDown' || event.key === 's') {
                socket.send(JSON.stringify({ 'paddle_move': 'stop' }));
            }
        });
    }
    
    function determineWinner(finalScores) {
        let winner = [];
        const w1 = document.getElementById('opn1').getAttribute('username');
        const w2 = document.getElementById('opn2').getAttribute('username');
        if (finalScores.left > finalScores.right) {
            winner = [
                w1,
                w2
            ];
        } else if (finalScores.left < finalScores.right) {
            winner = [
                w2,
                w1
            ];
        } else {
            winner = ["Draw", "Draw"];
        }
        return winner;
    }
    
    function sendWinnerToServer(socket, winner, room_name) {
        let winnerData = {
            action: 'match_finished',
            winner: winner[0],
            loser: winner[1],
            room_name: room_name,
            round: round
        };
    
        if (round === 2) {
            winnerData = {
                action: 'final',
                winner: winner[0],
                loser: winner[1],
                room_name: room_name,
                round: round
            }; 
        }
    
        socket.send(JSON.stringify(winnerData));
    }    
    
    function endGame(finalScores) {
        const endGameDiv = document.createElement('div');
        endGameDiv.classList.add('end-game-message');
        
        const winnerMessage = finalScores.left > finalScores.right ? 
            `Player 1 wins! Final scores - Player 1: ${finalScores.left}, Player 2: ${finalScores.right}` :
            `Player 2 wins! Final scores - Player 1: ${finalScores.left}, Player 2: ${finalScores.right}`;
        
        endGameDiv.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winnerMessage}</p>
            <button id="close-end-game">Close</button>
        `;
        
        document.body.appendChild(endGameDiv);
        
        document.getElementById('close-end-game').addEventListener('click', function() {
            document.body.removeChild(endGameDiv);
            document.getElementById('scoreboard1').style.display = 'none';
            document.querySelector('.gameCanvas2').style.display = 'none';
        });
    }

    function clearScene() {
        if (scene) {
            while (scene.children.length > 0) {
                let object = scene.children[0];
                scene.remove(object);
    
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((mat) => {
                            if (mat.map) mat.map.dispose();
                            mat.dispose();
                        });
                    } else {
                        if (object.material.map) object.material.map.dispose();
                        object.material.dispose();
                    }
                }
            }
            scene = null;
        }
    
        if (renderer) {
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
    
            const gl = renderer.getContext();
            if (gl) {
                const loseContext = gl.getExtension('WEBGL_lose_context');
                if (loseContext) {
                    loseContext.loseContext();
                }
            }
    
            renderer = null;
        }
    }
    
    function resetGameState() {
        score1 = 0;
        score2 = 0;
    
        if (ball) {
            ball.position.x = 0;
            ball.position.y = 0;
            ball.position.z = 4;
            ballDirX = 1;
            ballDirY = 1;
            ballSpeed = 2;
        }
    
        if (paddle1 && paddle2) {
            paddle1.position.set(-fieldWidth / 2 + paddleWidth, 0, paddleDepth);
            paddle2.position.set(fieldWidth / 2 - paddleWidth, 0, paddleDepth);
        }
    }
    
    function setupRendering1() {
        clearScene();
    
        var WIDTH = 1760,
            HEIGHT = 720;
        var VIEW_ANGLE = 50,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1,
            FAR = 10000;
    
        var c = document.getElementById("gameCanvas");
        renderer = new THREE.WebGLRenderer();
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    
        scene = new THREE.Scene();
        scene.add(camera);
        camera.position.z = 320;
        renderer.setSize(WIDTH, HEIGHT);
        c.appendChild(renderer.domElement);
    
        var planeWidth = fieldWidth,
            planeHeight = fieldHeight,
            planeQuality = 10;
    
        var paddle1Material = new THREE.MeshLambertMaterial({ color: '#303030' });
        var paddle2Material = new THREE.MeshLambertMaterial({ color: '#303030' });
        var planeMaterial = new THREE.MeshLambertMaterial({ color: '#3a0aab' });
        var tableMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: '#3a0aab' });
        var groundMaterial = new THREE.MeshLambertMaterial({ color: '#303030' });
    
        var plane = new THREE.Mesh(
            new THREE.PlaneGeometry(planeWidth * 0.95, planeHeight, planeQuality, planeQuality),
            planeMaterial
        );
    
        scene.add(plane);
        plane.receiveShadow = true;
    
        var table = new THREE.Mesh(
            new THREE.CubeGeometry(planeWidth * 1.05, planeHeight * 1.03, 100, planeQuality, planeQuality, 1),
            tableMaterial
        );
        table.position.z = -51;
        scene.add(table);
        table.receiveShadow = true;
    
        var radius = 4,
            segments = 5,
            rings = 5;
    
        var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x534d0d });
    
        ball = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, rings),
            sphereMaterial
        );
    
        scene.add(ball);
    
        ball.position.x = 0;
        ball.position.y = 0;
        ball.position.z = radius;
        ball.receiveShadow = true;
        ball.castShadow = true;
    
        paddleWidth = 7;
        paddleHeight = 20;
        paddleDepth = 10;
        paddleQuality = 1;
    
        paddle1 = new THREE.Mesh(
            new THREE.CubeGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
            paddle1Material
        );
    
        scene.add(paddle1);
        paddle1.receiveShadow = true;
        paddle1.castShadow = true;
    
        paddle2 = new THREE.Mesh(
            new THREE.CubeGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
            paddle2Material
        );
    
        scene.add(paddle2);
        paddle2.receiveShadow = true;
        paddle2.castShadow = true;
    
        paddle1.position.x = -fieldWidth / 2 + paddleWidth;
        paddle2.position.x = fieldWidth / 2 - paddleWidth;
    
        paddle1.position.z = paddleDepth;
        paddle2.position.z = paddleDepth;
    
        for (var i = 0; i < 5; i++) {
            var backdrop = new THREE.Mesh(
                new THREE.CubeGeometry(30, 30, 300, 1, 1, 1),
                pillarMaterial
            );
    
            backdrop.position.x = -50 + i * 100;
            backdrop.position.y = 230;
            backdrop.position.z = -30;
            backdrop.castShadow = true;
            backdrop.receiveShadow = true;
            scene.add(backdrop);
        }
        for (var i = 0; i < 5; i++) {
            var backdrop = new THREE.Mesh(
                new THREE.CubeGeometry(30, 30, 300, 1, 1, 1),
                pillarMaterial
            );
    
            backdrop.position.x = -50 + i * 100;
            backdrop.position.y = -230;
            backdrop.position.z = -30;
            backdrop.castShadow = true;
            backdrop.receiveShadow = true;
            scene.add(backdrop);
        }
    
        var ground = new THREE.Mesh(
            new THREE.CubeGeometry(1000, 1000, 3, 1, 1, 1),
            groundMaterial
        );
        ground.position.z = -132;
        ground.receiveShadow = true;
        scene.add(ground);
    
        pointLight = new THREE.PointLight(0xF8D898);
    
        pointLight.position.x = -1000;
        pointLight.position.y = 0;
        pointLight.position.z = 1000;
        pointLight.intensity = 2.9;
        pointLight.distance = 10000;
        scene.add(pointLight);
    
        spotLight = new THREE.SpotLight(0xF8D898);
        spotLight.position.set(0, 0, 460);
        spotLight.intensity = 1.5;
        spotLight.castShadow = true;
        scene.add(spotLight);
    
        renderer.shadowMapEnabled = true;
    }
    
    function startNewGame() {
        clearScene();
        resetGameState();
        setupRendering1();
    }

    function startTimer() {
        setTimeout(function() {
        }, 3000);
    }

    function sendTournamentInviteWebSocket(invitedId, tournamentName) {
        const message = {
            action: 'invite_tournament',
            type: 'tournament_invitation',
            senderId: user.id,
            receiver_id: invitedId,
            tournament_name: tournamentName,
            message: `You've been invited to join the ${tournamentName}!`
        };
    
        userSocket.send(JSON.stringify(message));
    }
    

    function fetchInviteUsersTournament(tournamentName) {
        const access_token = getCookie('my-token');
        
        fetch('/api/get-friends/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(response => {
            dkhaltntchecki = false;
            if (!response.ok) {
                if(response.status === 401)
                {
                    dkhaltntchecki = true;
                    logoutUserToken();
                    return;
                }
            }
            return response.json();
        })
        .then(data => {
            if (dkhaltntchecki)
                return;
            const friendsList = document.getElementById('friend-invite-list');
            friendsList.innerHTML = '';
            
            if (data.friends.length === 0) {
                friendsList.innerHTML = `
                    <div class="no-friends-message">
                        <p>You have no friends yet.</p>
                        <button id="add-friends-btn" class="btn btn-primary">Add Friends</button>
                    </div>
                `;
    
                document.getElementById('add-friends-btn').onclick = function() {                
                    fetchAndDisplayUsers();
                };
            } else {
                data.friends.forEach(user => {
                    const userRow = document.createElement('div');
                    userRow.className = 'user-row';
            
                    userRow.innerHTML = `
                        <div class="user-info">
                            <img src="${user.avatar || 'https://via.placeholder.com/150'}" alt="user-image">
                            <span>${user.username}</span>
                        </div>
                        <button class="action-connect invite-btn" data-user-id="${user.id}">invite</button>
                    `;
        
                    userRow.querySelector(".invite-btn").onclick = function() {
                        sendTournamentInviteWebSocket(user.id, tournamentName);
                    };
            
                    friendsList.appendChild(userRow);
                });
            }
        })

        .catch(error => {
			// console.error('Error loading user profile:', error);
		});

       
    }

    if (invited === true)
    {
        invited = false;
        function hideTournamentDivs() {
            const divsToHide = [
                '.tournament-mode',
                '#remote-tournament-options',
                '.existing-tournaments-list',
                '#create-tournament-section-remote',
                '#create-tournament-section',
                '#participants-section'
            ];

            divsToHide.forEach(div => {
                const element = document.querySelector(div);
                if (element) {
                    element.style.display = 'none';
                }
            });
        }

        hideTournamentDivs();

        let tournamentName = invitedId;
        tsocket = new WebSocket('wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/');
    
        document.querySelector('.existing-tournaments-list').style.display = 'none';
        document.getElementById('waiting-section').style.display = 'block';

        document.getElementById('invite-button').addEventListener('click', function() {
            fetchInviteUsersTournament(tournamentName);
            const overlay = document.getElementById('friend-invite-overlay');
            overlay.style.display = 'flex';
            overlay.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        });        
    
        tsocket.onopen = function() {
            const joinMessage = JSON.stringify({
                'action': 'joined'
            });
            tsocket.send(joinMessage);
        };
    
        tsocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            function updateFirstRound(participant1, participant2, participant3, participant4) {
                const caseLeft1 = document.querySelector(".row11 .case-left");
                const caseRight1 = document.querySelector(".row11 .case-right");
                const caseLeft2 = document.querySelector(".row12 .case-left");
                const caseRight2 = document.querySelector(".row12 .case-right");
    
                if (caseLeft1 && caseRight1 && caseLeft2 && caseRight2) {
                    caseLeft1.textContent = participant1;
                    caseRight1.textContent = participant3;
                    caseLeft2.textContent = participant2;
                    caseRight2.textContent = participant4;
                }
            }
    
            function updateFinalists(participant1, participant2) {
                const finalistLeft = document.querySelector(".finalist-left");
                const finalistRight = document.querySelector(".finalist-right");
                if (finalistLeft && finalistRight) {
                    finalistLeft.textContent = participant1;
                    finalistRight.textContent = participant2;
                }
            }
    
            function updateFinalWinner(winner) {
                const trophy = document.querySelector(".winner-name span");
                if (trophy) {
                    trophy.textContent = `The Winner is ${winner}`;
                }
            
                const shema = document.querySelector('.parent-container');
                if (shema)
                    shema.style.display = 'flex';
                document.querySelector('.scoreboard').style.display = 'none';
                document.querySelector('.gameCanvas2').style.display = 'none';
            
            } 
            
            function showMatchResult(winner, loser, leave, message) {
                const resultDiv = document.getElementById('finalResultOverlay');
                const resultMessage = document.getElementById('resultText');
                const buttondiv = document.getElementById('leaveGameButton');
                const matchDiv = document.querySelector('.match');
                matchDiv.style.display = 'none';
                if (message != 'complete')
                    resultDiv.style.display = 'flex';
                if (message == 'draw')
                {
                    resultMessage.textContent = `The match is drawn`;
                    buttondiv.style.display = 'none';
                    return;
                }
                resultMessage.textContent = `${winner} won the match!`;
                if (leave) {
                    buttondiv.textContent = 'Leave Game';
                    buttondiv.addEventListener('click', function() {
                        loadContentInDiv('#gaming');
                    });
                } else {
                    if (message != 'complete')
                    {
                        buttondiv.textContent = 'Wait for Opponent';
                        buttondiv.addEventListener('click', function() {
                            const shema = document.querySelector('.parent-container');
                            const scoreboard = document.getElementById('scoreboard1');
                            const gameCanvas = document.querySelector('.gameCanvas2');
            
                            scoreboard.style.display = 'none';
                            gameCanvas.style.display = 'none';
                            resultDiv.style.display = 'none';
                            shema.style.display = 'flex';
                            updateFinalists(winner, 'unknown');
                        });
                    }
                }
            
            }
            
            function updateJoinedPlayersList(players) {
                const playerList = document.getElementById('waiting-players');
                playerList.innerHTML = '';
            
                players.forEach(player => {
                    const playerDiv = document.createElement('div');
                    playerDiv.classList.add('player-profile');
                    playerDiv.innerHTML = `
                        <img src="${player.profile_picture_url}" alt="${player.player_name}" class="profile-pic">
                        <span class="d-none">${player.player_name}</span>
                        <span>${player.player_nickname}</span>
                    `;
                    playerList.appendChild(playerDiv);
                });

                const addButton = document.getElementById('invite-button');
                if (players.length === 4)
                    addButton.style.display = 'none';
            }

            if (data.type === 'show_shema') {
                const scoreboard = document.getElementById('scoreboard1');
                const gameCanvas = document.querySelector('.gameCanvas2');

                scoreboard.style.display = 'none';
                gameCanvas.style.display = 'none';
                document.getElementById('waiting-section').style.display = 'none';
                const shema = document.querySelector('.parent-container');
                remoteParticipants = data.players;
                shema.style.display = 'flex';
                if (data.round === 'one')
                    updateFirstRound(remoteParticipants[0].nickname, remoteParticipants[1].nickname, remoteParticipants[2].nickname, remoteParticipants[3].nickname);
                else
                {
                    document.getElementById('finalResultOverlay').style.display = 'none';
                    updateFinalists(data.nicknames[0], data.nicknames[1]);
                }
            } 
    
            if (data.type === 'player_list_update' || data.type === 'player_joined') {
                updateJoinedPlayersList(data.players);
            }            
    
            if(data.type === 'matches_created')
            {
                const resultDiv = document.getElementById('finalResultOverlay');
                resultDiv.style.display = 'none';
                round = data.round;
                player_id = data.match['player_id'];
                opponent_id = data.match['opponent_id'];
                const shema = document.querySelector('.parent-container');
                const scoreboard = document.getElementById('scoreboard1');
                const gameCanvas = document.querySelector('.gameCanvas2');
                if (data.message === 'show matchdiv') {
                    scoreboard.style.display = 'none';
                    gameCanvas.style.display = 'none';
                    shema.style.display = 'none';
                    const matchDiv = document.querySelector('.match');
                    const matchContent = `
                        <div class="match-container">
                            <p class="match-text">${data.match['player_nickname']} <span class="vs">vs</span> ${data.match['opponent_nickname']}</p>
                            <button id="play-btn" class="play-button">Play</button>
                        </div>
                    `;
        
                    matchDiv.innerHTML = matchContent;
                    matchDiv.style.display = 'block';
        
                    const playBtn = document.getElementById('play-btn');
                    playBtn.addEventListener('click', function () {
                        const displayWait = document.querySelector(".wait");
                        displayWait.classList.add('dispaly');
                        matchDiv.style.display = 'none';
                        match_id = data.match['match_id'];
    
                        matchmaking = new WebSocket(
                            'wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/' + data.match['match_id'] + '/'
                        );
                        matchmaking.onopen = function() {
                            matchmaking.send(JSON.stringify({ 'message': 'Enter Queue' }));
                        };
                        matchmaking.onmessage = function(e) {
                            const data = JSON.parse(e.data);
                            if (data.status == 'waiting') {
                                if (!data.player_avatar)
                                    return;
                                const namePlayer = document.getElementById("player1");
                                const op = document.getElementById("waiting_status");
                                namePlayer.innerHTML = `
                                    <img class="" src="${data.player_avatar}" />
                                `;
                                op.innerHTML = `
                                    <div class="spinner"></div>
                                `;
                            } else if (data.status == 'match_found') {
                                if (!data.player_avatar || !data.opponent_avatar)
                                    return;
                                const namePlayer = document.getElementById("player1");
                                const op = document.getElementById("waiting_status");
                                namePlayer.innerHTML = 
                                `   <img class="" src="${data.player_avatar}" />
                                `;
                                op.innerHTML = `
                                <img class="" src="${data.opponent_avatar}" />
                                `;
                                if (data.time == "stop") {
                                    setTimeout(function() {
                                        startTimer();
                                    }, 2000);
                                }
                                if (data.game == "start") {
                                    p = document.getElementById('opn1');
                                    o = document.getElementById('opn2');
                                    pprofile = document.getElementById('opn1p');
                                    oprofile = document.getElementById('opn2p')
                                    if (data.player_side === 'right')
                                    {
                                        p.textContent = data.player_nickname;
                                        o.textContent = data.opponent_nickname;
                                        pprofile.src = data.player_avatar;
                                        oprofile.src = data.opponent_avatar;
                                        p.setAttribute('username', data.player_username);
                                        o.setAttribute('username', data.opponent_username);
                                    }
                                    else
                                    {
                                        o.textContent = data.player_nickname;
                                        p.textContent = data.opponent_nickname;
                                        pprofile.src = data.opponent_avatar;
                                        oprofile.src = data.player_avatar;
                                        o.setAttribute('username', data.player_username);
                                        p.setAttribute('username', data.opponent_username);
                                    }
                        
                                    const scoreboard = document.getElementById('scoreboard1');
                                    const gameCanvas = document.querySelector('.gameCanvas2');
                    
                                    displayWait.classList.remove('dispaly');
                                    scoreboard.style.display = 'flex';
                                    gameCanvas.style.display = 'flex';
                                    startNewGame();
                                    startGameRemote(data, tournamentName);
                                }
                            }
                        };
                        matchmaking.onclose = function(e) {
                        }
                    }); 
                };
            }

            if (data.type === 'player_left')
            {
                const joinMessage = JSON.stringify({
                    'action': 'player_left',
                    'player': data.player,
                    'round': round
                });
                tsocket.send(joinMessage);
            }
    
            if (data.type === 'new_match')
            {
                round = data.round;
                const shema = document.querySelector('.parent-container');
                shema.style.display = 'none';
                const matchDiv = document.querySelector('.match');
                const matchContent = `
                    <div class="match-container">
                        <p class="match-text">${data.player_nickname} <span class="vs">vs</span> ${data.opponent_nickname}</p>
                        <button id="play-btn" class="play-button">Play</button>
                    </div>
                `;
    
                matchDiv.innerHTML = matchContent;
                matchDiv.style.display = 'block';
    
                const playBtn = document.getElementById('play-btn');
                playBtn.addEventListener('click', function () {
                    const displayWait = document.querySelector(".wait");
                    displayWait.classList.add('dispaly');
                    matchDiv.style.display = 'none';
                    match_id = data.match_id;

                    matchmaking = new WebSocket(
                        'wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/' + data.match_id + '/'
                    );
                    matchmaking.onopen = function() {
                        matchmaking.send(JSON.stringify({ 'message': 'Enter Queue' }));
                    };
                    matchmaking.onmessage = function(e) {
                        const data = JSON.parse(e.data);
                        if (data.status == 'waiting') {
                            if (!data.player_avatar)
                                return;
                            const namePlayer = document.getElementById("player1");
                            const op = document.getElementById("waiting_status");
                            namePlayer.innerHTML = `
                                <img class="" src="${data.player_avatar}" />
                            `;
                            op.innerHTML = `
                                <div class="spinner"></div>
                            `;
                        } else if (data.status == 'match_found') {
                            if (!data.player_avatar || !data.opponent_avatar)
                                return;
                            const namePlayer = document.getElementById("player1");
                            const op = document.getElementById("waiting_status");
                            namePlayer.innerHTML = 
                            `   <img class="" src="${data.player_avatar}" />
                            `;
                            op.innerHTML = `
                            <img class="" src="${data.opponent_avatar}" />
                            `;
                            if (data.time == "stop") {
                                setTimeout(function() {
                                    startTimer();
                                }, 2000);
                            }
                            if (data.game == "start") {
                                p = document.getElementById('opn1');
                                o = document.getElementById('opn2');
                                pprofile = document.getElementById('opn1p');
                                oprofile = document.getElementById('opn2p')
                                if (data.player_side === 'right')
                                {
                                    p.textContent = data.player_nickname;
                                    o.textContent = data.opponent_nickname;
                                    pprofile.src = data.player_avatar;
                                    oprofile.src = data.opponent_avatar;
                                    p.setAttribute('username', data.player_username);
                                    o.setAttribute('username', data.opponent_username);
                                }
                                else
                                {
                                    o.textContent = data.player_nickname;
                                    p.textContent = data.opponent_nickname;
                                    pprofile.src = data.opponent_avatar;
                                    oprofile.src = data.player_avatar;
                                    o.setAttribute('username', data.player_username);
                                    p.setAttribute('username', data.opponent_username);
                                }
                    
                                const scoreboard = document.getElementById('scoreboard1');
                                const gameCanvas = document.querySelector('.gameCanvas2');
                
                                displayWait.classList.remove('dispaly');
                                scoreboard.style.display = 'flex';
                                gameCanvas.style.display = 'flex';
                                startNewGame();
                                startGameRemote(data, tournamentName);
                            }
                        }
                    };
                    matchmaking.onclose = function(e) {
                    }
    
                }); 
            }
    
            if (data.type === 'final_winner') {
                const winner = data.winner_nickname;
                const matchDiv = document.querySelector('.match');
                matchDiv.style.display = 'none';
                updateFinalWinner(winner);
            }

            if (data.type === 'show_trophy') {
                const shema = document.querySelector('.parent-container');
                const winnerContent = document.querySelector('.winner-content');
                const winner = data.winner_nickname;
            
                shema.style.display = 'none';
                if (winnerContent) {
                    document.getElementById('award').textContent = `${winner}`;
                    winnerContent.style.display = 'block';
                }
            }

            if (data.type === 'leave_tournament') {
                const winnerContent = document.querySelector('.winner-content');
            
                const resultDiv = document.getElementById('finalResultOverlay');
                const resultMessage = document.getElementById('resultText');
                const buttondiv = document.getElementById('leaveGameButton');
                resultDiv.style.display = 'flex';
                resultMessage.textContent = data.message;
                buttondiv.textContent = 'Leave Tournament';
                buttondiv.addEventListener('click', function() {
                    loadContentInDiv('#gaming');
                });
            }
    
            if (data.type === 'match_result') {
                const winner = data.winner_nickname;
                const loser = data.loser_nickname;
                const leave = data.leave;
                const message = data.message;
        
                showMatchResult(winner, loser, leave, message);
            }          
        };
    
        tsocket.onerror = function(error) {
        };
    
        tsocket.onclose = function(event) {
        };
    }
    
    function joinTournamentWebSocket(tournamentName) {
        tsocket = new WebSocket('wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/');
    
        document.querySelector('.existing-tournaments-list').style.display = 'none';
        document.getElementById('waiting-section').style.display = 'block';

        document.getElementById('invite-button').addEventListener('click', function() {
            fetchInviteUsersTournament(tournamentName);
            const overlay = document.getElementById('friend-invite-overlay');
            overlay.style.display = 'flex';
            overlay.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        });        
    
        tsocket.onopen = function() {
            const joinMessage = JSON.stringify({
                'action': 'joined'
            });
            tsocket.send(joinMessage);
        };
    
        tsocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            function updateFirstRound(participant1, participant2, participant3, participant4) {
                const caseLeft1 = document.querySelector(".row11 .case-left");
                const caseRight1 = document.querySelector(".row11 .case-right");
                const caseLeft2 = document.querySelector(".row12 .case-left");
                const caseRight2 = document.querySelector(".row12 .case-right");
    
                if (caseLeft1 && caseRight1 && caseLeft2 && caseRight2) {
                    caseLeft1.textContent = participant1;
                    caseRight1.textContent = participant3;
                    caseLeft2.textContent = participant2;
                    caseRight2.textContent = participant4;
                }
            }
    
            function updateFinalists(participant1, participant2) {
                const finalistLeft = document.querySelector(".finalist-left");
                const finalistRight = document.querySelector(".finalist-right");
                if (finalistLeft && finalistRight) {
                    finalistLeft.textContent = participant1;
                    finalistRight.textContent = participant2;
                }
            }
    
            function updateFinalWinner(winner) {
                const trophy = document.querySelector(".winner-name span");
                if (trophy) {
                    trophy.textContent = `The Winner is ${winner}`;
                }
            
                const shema = document.querySelector('.parent-container');
                if (shema)
                    shema.style.display = 'flex';
                document.querySelector('.scoreboard').style.display = 'none';
                document.querySelector('.gameCanvas2').style.display = 'none';
            
            } 
            
            function showMatchResult(winner, loser, leave, message) {
                const resultDiv = document.getElementById('finalResultOverlay');
                const resultMessage = document.getElementById('resultText');
                const buttondiv = document.getElementById('leaveGameButton');
                const matchDiv = document.querySelector('.match');
                matchDiv.style.display = 'none';
                if (message != 'complete')
                    resultDiv.style.display = 'flex';
                if (message == 'draw')
                {
                    resultMessage.textContent = `The match is drawn`;
                    buttondiv.style.display = 'none';
                    return;
                }
                resultMessage.textContent = `${winner} won the match!`;
                if (leave) {
                    buttondiv.textContent = 'Leave Game';
                    buttondiv.addEventListener('click', function() {
                        loadContentInDiv('#gaming');
                    });
                } else {
                    if (message != 'complete')
                    {
                        buttondiv.textContent = 'Wait for Opponent';
                        buttondiv.addEventListener('click', function() {
                            const shema = document.querySelector('.parent-container');
                            const scoreboard = document.getElementById('scoreboard1');
                            const gameCanvas = document.querySelector('.gameCanvas2');
            
                            scoreboard.style.display = 'none';
                            gameCanvas.style.display = 'none';
                            resultDiv.style.display = 'none';
                            shema.style.display = 'flex';
                            updateFinalists(winner, 'unknown');
                        });
                    }
                }
            
            }
            
            function updateJoinedPlayersList(players) {
                const playerList = document.getElementById('waiting-players');
                playerList.innerHTML = '';
            
                players.forEach(player => {
                    const playerDiv = document.createElement('div');
                    playerDiv.classList.add('player-profile');
                    playerDiv.innerHTML = `
                        <img src="${player.profile_picture_url}" alt="${player.player_name}" class="profile-pic">
                        <span class="d-none">${player.player_name}</span>
                        <span>${player.player_nickname}</span>
                    `;
                    playerList.appendChild(playerDiv);
                });

                const addButton = document.getElementById('invite-button');
                if (players.length === 4)
                    addButton.style.display = 'none';
            }

            if (data.type === 'show_shema') {
                const scoreboard = document.getElementById('scoreboard1');
                const gameCanvas = document.querySelector('.gameCanvas2');

                scoreboard.style.display = 'none';
                gameCanvas.style.display = 'none';
                document.getElementById('waiting-section').style.display = 'none';
                const shema = document.querySelector('.parent-container');
                remoteParticipants = data.players;
                shema.style.display = 'flex';
                if (data.round === 'one')
                    updateFirstRound(remoteParticipants[0].nickname, remoteParticipants[1].nickname, remoteParticipants[2].nickname, remoteParticipants[3].nickname);
                else
                {
                    document.getElementById('finalResultOverlay').style.display = 'none';
                    updateFinalists(data.nicknames[0], data.nicknames[1]);
                }
            } 
    
            if (data.type === 'player_list_update' || data.type === 'player_joined') {
                updateJoinedPlayersList(data.players);
            }            
    
            if(data.type === 'matches_created')
            {
                const resultDiv = document.getElementById('finalResultOverlay');
                resultDiv.style.display = 'none';
                round = data.round;
                player_id = data.match['player_id'];
                opponent_id = data.match['opponent_id'];
                const shema = document.querySelector('.parent-container');
                const scoreboard = document.getElementById('scoreboard1');
                const gameCanvas = document.querySelector('.gameCanvas2');
                if (data.message === 'show matchdiv') {
                    scoreboard.style.display = 'none';
                    gameCanvas.style.display = 'none';
                    shema.style.display = 'none';
                    const matchDiv = document.querySelector('.match');
                    const matchContent = `
                        <div class="match-container">
                            <p class="match-text">${data.match['player_nickname']} <span class="vs">vs</span> ${data.match['opponent_nickname']}</p>
                            <button id="play-btn" class="play-button">Play</button>
                        </div>
                    `;
        
                    matchDiv.innerHTML = matchContent;
                    matchDiv.style.display = 'block';
        
                    const playBtn = document.getElementById('play-btn');
                    playBtn.addEventListener('click', function () {
                        const displayWait = document.querySelector(".wait");
                        displayWait.classList.add('dispaly');
                        matchDiv.style.display = 'none';
                        match_id = data.match['match_id'];
    
                        matchmaking = new WebSocket(
                            'wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/' + data.match['match_id'] + '/'
                        );
                        matchmaking.onopen = function() {
                            matchmaking.send(JSON.stringify({ 'message': 'Enter Queue' }));
                        };
                        matchmaking.onmessage = function(e) {
                            const data = JSON.parse(e.data);
                            if (data.status == 'waiting') {
                                if (!data.player_avatar)
                                    return;
                                const namePlayer = document.getElementById("player1");
                                const op = document.getElementById("waiting_status");
                                namePlayer.innerHTML = `
                                    <img class="" src="${data.player_avatar}" />
                                `;
                                op.innerHTML = `
                                    <div class="spinner"></div>
                                `;
                            } else if (data.status == 'match_found') {
                                if (!data.player_avatar || !data.opponent_avatar)
                                    return;
                                const namePlayer = document.getElementById("player1");
                                const op = document.getElementById("waiting_status");
                                namePlayer.innerHTML = 
                                `   <img class="" src="${data.player_avatar}" />
                                `;
                                op.innerHTML = `
                                <img class="" src="${data.opponent_avatar}" />
                                `;
                                if (data.time == "stop") {
                                    setTimeout(function() {
                                        startTimer();
                                    }, 2000);
                                }
                                if (data.game == "start") {
                                    p = document.getElementById('opn1');
                                    o = document.getElementById('opn2');
                                    pprofile = document.getElementById('opn1p');
                                    oprofile = document.getElementById('opn2p')
                                    if (data.player_side === 'right')
                                    {
                                        p.textContent = data.player_nickname;
                                        o.textContent = data.opponent_nickname;
                                        pprofile.src = data.player_avatar;
                                        oprofile.src = data.opponent_avatar;
                                        p.setAttribute('username', data.player_username);
                                        o.setAttribute('username', data.opponent_username);
                                    }
                                    else
                                    {
                                        o.textContent = data.player_nickname;
                                        p.textContent = data.opponent_nickname;
                                        pprofile.src = data.opponent_avatar;
                                        oprofile.src = data.player_avatar;
                                        o.setAttribute('username', data.player_username);
                                        p.setAttribute('username', data.opponent_username);
                                    }
                        
                                    const scoreboard = document.getElementById('scoreboard1');
                                    const gameCanvas = document.querySelector('.gameCanvas2');
                    
                                    displayWait.classList.remove('dispaly');
                                    scoreboard.style.display = 'flex';
                                    gameCanvas.style.display = 'flex';
                                    startNewGame();
                                    startGameRemote(data, tournamentName);
                                }
                            }
                        };
                        matchmaking.onclose = function(e) {
                        }
                    }); 
                };
            }

            if (data.type === 'player_left')
            {
                const joinMessage = JSON.stringify({
                    'action': 'player_left',
                    'player': data.player,
                    'round': round
                });
                tsocket.send(joinMessage);
            }
    
            if (data.type === 'new_match')
            {
                round = data.round;
                const shema = document.querySelector('.parent-container');
                shema.style.display = 'none';
                const matchDiv = document.querySelector('.match');
                const matchContent = `
                    <div class="match-container">
                        <p class="match-text">${data.player_nickname} <span class="vs">vs</span> ${data.opponent_nickname}</p>
                        <button id="play-btn" class="play-button">Play</button>
                    </div>
                `;
    
                matchDiv.innerHTML = matchContent;
                matchDiv.style.display = 'block';
    
                const playBtn = document.getElementById('play-btn');
                playBtn.addEventListener('click', function () {
                    const displayWait = document.querySelector(".wait");
                    displayWait.classList.add('dispaly');
                    matchDiv.style.display = 'none';
                    match_id = data.match_id;

                    matchmaking = new WebSocket(
                        'wss://' + window.location.host + '/ws/tournament/' + tournamentName + '/' + data.match_id + '/'
                    );
                    matchmaking.onopen = function() {
                        matchmaking.send(JSON.stringify({ 'message': 'Enter Queue' }));
                    };
                    matchmaking.onmessage = function(e) {
                        const data = JSON.parse(e.data);
                        if (data.status == 'waiting') {
                            if (!data.player_avatar)
                                return;
                            const namePlayer = document.getElementById("player1");
                            const op = document.getElementById("waiting_status");
                            namePlayer.innerHTML = `
                                <img class="" src="${data.player_avatar}" />
                            `;
                            op.innerHTML = `
                                <div class="spinner"></div>
                            `;
                        } else if (data.status == 'match_found') {
                            if (!data.player_avatar || !data.opponent_avatar)
                                return;
                            const namePlayer = document.getElementById("player1");
                            const op = document.getElementById("waiting_status");
                            namePlayer.innerHTML = 
                            `   <img class="" src="${data.player_avatar}" />
                            `;
                            op.innerHTML = `
                            <img class="" src="${data.opponent_avatar}" />
                            `;
                            if (data.time == "stop") {
                                setTimeout(function() {
                                    startTimer();
                                }, 2000);
                            }
                            if (data.game == "start") {
                                p = document.getElementById('opn1');
                                o = document.getElementById('opn2');
                                pprofile = document.getElementById('opn1p');
                                oprofile = document.getElementById('opn2p')
                                if (data.player_side === 'right')
                                {
                                    p.textContent = data.player_nickname;
                                    o.textContent = data.opponent_nickname;
                                    pprofile.src = data.player_avatar;
                                    oprofile.src = data.opponent_avatar;
                                    p.setAttribute('username', data.player_username);
                                    o.setAttribute('username', data.opponent_username);
                                }
                                else
                                {
                                    o.textContent = data.player_nickname;
                                    p.textContent = data.opponent_nickname;
                                    pprofile.src = data.opponent_avatar;
                                    oprofile.src = data.player_avatar;
                                    o.setAttribute('username', data.player_username);
                                    p.setAttribute('username', data.opponent_username);
                                }
                    
                                const scoreboard = document.getElementById('scoreboard1');
                                const gameCanvas = document.querySelector('.gameCanvas2');
                
                                displayWait.classList.remove('dispaly');
                                scoreboard.style.display = 'flex';
                                gameCanvas.style.display = 'flex';
                                startNewGame();
                                startGameRemote(data, tournamentName);
                            }
                        }
                    };
                    matchmaking.onclose = function(e) {
                    }
    
                }); 
            }
    
            if (data.type === 'final_winner') {
                const winner = data.winner_nickname;
                const matchDiv = document.querySelector('.match');
                matchDiv.style.display = 'none';
                updateFinalWinner(winner);
            }

            if (data.type === 'show_trophy') {
                const shema = document.querySelector('.parent-container');
                const winnerContent = document.querySelector('.winner-content');
                const winner = data.winner_nickname;
            
                shema.style.display = 'none';
                if (winnerContent) {
                    document.getElementById('award').textContent = `${winner}`;
                    winnerContent.style.display = 'block';
                }
            }

            if (data.type === 'leave_tournament') {
                const winnerContent = document.querySelector('.winner-content');
            
                const resultDiv = document.getElementById('finalResultOverlay');
                const resultMessage = document.getElementById('resultText');
                const buttondiv = document.getElementById('leaveGameButton');
                resultDiv.style.display = 'flex';
                resultMessage.textContent = data.message;
                buttondiv.textContent = 'Leave Tournament';
                buttondiv.addEventListener('click', function() {
                    loadContentInDiv('#gaming');
                });
            }
    
            if (data.type === 'match_result') {
                const winner = data.winner_nickname;
                const loser = data.loser_nickname;
                const leave = data.leave;
                const message = data.message;
        
                showMatchResult(winner, loser, leave, message);
            }          
        };
    
        tsocket.onerror = function(error) {
        };
    
        tsocket.onclose = function(event) {
        };
    }
    
    function submitTournamentNameRemote() {
        const tournamentNameInputRemote = document.getElementById('tournament-name');
        const tournamentName = sanitizeMessage(tournamentNameInputRemote.value.trim());
        
        hideErrorMessage();
    
        
        if (tournamentName) {
            is_created = true;
            csocket.send(JSON.stringify({
                type: 'create_tournament',
                tournamentName: tournamentName
            }));
    
            tournamentNameInputRemote.value = "";
        } else {
            displayErrorMessage("Please enter a tournament name.");
        }
    }
    
    function displayErrorMessage(message) {
        let errorMessage = document.querySelector(".tournament-error-message");
    
        if (!errorMessage) {
            errorMessage = document.createElement("div");
            errorMessage.classList.add("tournament-error-message");
            errorMessage.style.color = "red";
            errorMessage.style.marginTop = "10px";
            document.querySelector('.createTourn').appendChild(errorMessage);
        }
    
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    
    }
    
    function hideErrorMessage() {
        const errorMessage = document.querySelector(".tournament-error-message");
        if (errorMessage) {
            errorMessage.style.display = "none";
        }
    } 
}
