function initializeRemotePing() {
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
    
    function cameraPhysics1() {
        camera.position.x = -243;
        camera.position.y = 0;
        camera.position.z = 107;
        camera.rotation.x = -0.008377580409572781;
        camera.rotation.y = -1.0471975511965976;
        camera.rotation.z = -1.5707963267948966;
    }
    
    function startTimer() {
        setTimeout(function() {
        }, 3000);
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
    
    function setupRendering() {
        clearScene();
    
        var WIDTH = 1760,
            HEIGHT = 720;
        var VIEW_ANGLE = 50,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1,
            FAR = 10000;
    
        var c = document.getElementById("gameCanvas1");
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
    
    function renderGame(gameState, playerSide) {
        ball.position.x = playerSide === 'right' ? -gameState.ball.x : gameState.ball.x;
        ball.position.y = gameState.ball.y;
    
        if (playerSide === 'left') {
            paddle1.position.y = gameState.paddles.left.y;
            paddle2.position.y = gameState.paddles.right.y;
        } else {
            paddle1.position.y = gameState.paddles.right.y;
            paddle2.position.y = gameState.paddles.left.y;
        }
    
        document.getElementById("scores1").innerText = "Score: " + gameState.score.left;
        document.getElementById("scores2").innerText = "Score: " + gameState.score.right;
        document.getElementById('chrono').textContent = gameState.chrono_display;
    
        renderer.render(scene, camera);
        cameraPhysics1();
    }
    
    function setup2() {
        setupRendering();
    
        const playremote1 = document.querySelectorAll('.playremote1');
        const playremote2 = document.querySelectorAll('.playremotefriend');
        const startingPage = document.querySelector('.starting_page');
        const scoreboard = document.getElementById('scoreboard1');
        const canvas = document.getElementById('gameCanvas1');
        const pingStart = document.querySelector('.ping-start');
    
        function startGame(data) {
            const roomName = data.room_name;
            const playerSide = data.player_side;
    
            rpingpongsocket = new WebSocket(
                'wss://' + window.location.host + '/ws/pingpong/room/' + roomName + '/'
            );
    
            rpingpongsocket.onopen = function(e) {
                if (rpingpongsocket.readyState === WebSocket.OPEN) {
                    rpingpongsocket.send(JSON.stringify({ 'message': 'start' }));
                }
            };
    
            rpingpongsocket.onmessage = function(e) {
                const gameState = JSON.parse(e.data);
                if (gameState.type === 'game_interupted')
                {
                    stopGame(rpingpongsocket, false);
                }
                else if (gameState.type === 'game_over') {
                    stopGame(rpingpongsocket, true);
                } else {
                    renderGame(gameState, playerSide);
                }
            };
    
            rpingpongsocket.onclose = function(e) {
                stopGame(rpingpongsocket, false);
            };
    
            document.addEventListener('keydown', function(event) {
                if (event.key === 'ArrowUp' || event.key === 'w') {
                    rpingpongsocket.send(JSON.stringify({ 'paddle_move': 'up' }));
                } else if (event.key === 'ArrowDown' || event.key === 's') {
                    rpingpongsocket.send(JSON.stringify({ 'paddle_move': 'down' }));
                }
            });
    
            document.addEventListener('keyup', function(event) {
                if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'ArrowDown' || event.key === 's') {
                    rpingpongsocket.send(JSON.stringify({ 'paddle_move': 'stop' }));
                }
            });
        }

        function stopGame(socket, send) {
            ballSpeed = 0;
            paddleSpeed = 0;
        
            document.getElementById('chrono').textContent = "Game Over!";
        
            let score1 = parseInt(document.getElementById('scores1').textContent.split(' ')[1]);
            let score2 = parseInt(document.getElementById('scores2').textContent.split(' ')[1]);
        
            document.getElementById('finalResultOverlay').style.display = 'flex';
        
            let resultText = '';
            let winner = '';
            let loser = '';
        
            if (score1 > score2) {
                resultText = `${document.getElementById('opn1').textContent} Wins!`;
                winner = document.getElementById('opn1').textContent;
                loser = document.getElementById('opn2').textContent;
            } else if (score1 < score2) {
                resultText = `${document.getElementById('opn2').textContent} Wins!`;
                winner = document.getElementById('opn2').textContent;
                loser = document.getElementById('opn1').textContent;
            } else {
                resultText = "It's a Draw!";
            }
        
            document.getElementById('resultText').textContent = resultText;
        
            if (send)
            {
                const gameResultData = {
                    type: 'game_result',
                    winner: winner,
                    loser: loser,
                    score1: score1,
                    score2: score2
                };
                if (socket)
                    socket.send(JSON.stringify(gameResultData));
            }
        
            document.getElementById('leaveGameButton').addEventListener('click', function() {
                loadContentInDiv("#levels");
            });
        }    
    
        playremote1.forEach(chooseNow => {
            chooseNow.addEventListener('click', () => {
                const displayWait = document.querySelector(".wait");
                displayWait.classList.add('dispaly');
                startingPage.style.display = "none";
    
                matchmaking = new WebSocket(
                    'wss://' + window.location.host + '/ws/pingpong/wait_for_opponent2/'
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
                                p.textContent = data.player_username;
                                o.textContent = data.opponent_username;
                                pprofile.src = data.player_avatar;
                                oprofile.src = data.opponent_avatar;
                            }
                            else
                            {
                                o.textContent = data.player_username;
                                p.textContent = data.opponent_username;
                                pprofile.src = data.opponent_avatar;
                                oprofile.src = data.player_avatar;
                            }
                            startingPage.style.display = "none";
                            displayWait.classList.remove('dispaly');
                            pingStart.style.display = "none";
                            scoreboard.style.display = 'flex';
                            canvas.style.display = 'block';
                            startGame(data);
                        }
                    }
                };
                matchmaking.onclose = function(e) {
                }
            });
        });

        if (invited === true)
        {
            invited = false;
            const displayWait = document.querySelector(".wait");
            displayWait.classList.add('dispaly');
            startingPage.style.display = "none";
            
            let maxId = Math.max(user, parseInt(invitedId));
            let minId = Math.min(user, parseInt(invitedId));
            
            matchmaking = new WebSocket(
                'wss://' + window.location.host + '/ws/pingpong/' + maxId + '/' + minId + '/'
            );
            matchmaking.onopen = function() {
                matchmaking.send(JSON.stringify({ 'message': 'Enter Queue' }));
            };
            matchmaking.onmessage = function(e) {
                const data = JSON.parse(e.data);
                if (data.status == 'decline_match')
                {
                    loadContentInDiv('#home');
                }
                else if (data.status == 'waiting') {
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
                            p.textContent = data.player_username;
                            o.textContent = data.opponent_username;
                            pprofile.src = data.player_avatar;
                            oprofile.src = data.opponent_avatar;
                        }
                        else
                        {
                            o.textContent = data.player_username;
                            p.textContent = data.opponent_username;
                            pprofile.src = data.opponent_avatar;
                            oprofile.src = data.player_avatar;
                        }
                        startingPage.style.display = "none";
                        displayWait.classList.remove('dispaly');
                        pingStart.style.display = "none";
                        scoreboard.style.display = 'flex';
                        canvas.style.display = 'block';
                        startGame(data);
                    }
                }
            };
            matchmaking.onclose = function(e) {
            }
        }
    }
    document.getElementById('playremotefriend').addEventListener('click', () => {
        fetchInviteUsers();
        const overlay = document.getElementById('friend-invite-overlay');
        overlay.style.display = 'flex';
        overlay.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    });

    setup2();
}

