function PhandleTournamentlocal() {
    const inputBox = document.getElementById("input-box");
    const listContainer = document.getElementById("list-container");
    const addBtn = document.getElementById("add-btn");
    const addListDiv = document.querySelector('.add-list');
    const createLocal = document.getElementById('create-tournament-section');
    const tournamentNameInput = createLocal.querySelector("#tournament-name");
    var i = 0;
    var r = 1;
    
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
    let chronoInterval;
    let stopInterval;
    var animationFrameId;

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
    
    function setup1() {
        playerIsActive = true;
        score1 = 0;
        score2 = 0;
        ballSpeed = 2; 
        ballDirX = 1;  
        ballDirY = 1;
        paddleSpeed = 3;  
        difficulty = 0.2;
        paddle1DirY = 0;
        paddle2DirY = 0;
        maxScore = 7;
        difficulty = 0.2;
        maxTime = 4;
    
        startNewGame();
    
        startChrono1();
    
        draw1();
    
        stopInterval = setTimeout(function () {
            if (playerIsActive)
                stopGame();
        }, 10000); 
    }
    
    function stopGame() {
        resetGameState();
        cancelAnimationFrame(animationFrameId);
        stopChrono();
        ballSpeed = 0;
        ballDirX = 0;
        ballDirY = 0;
        paddleSpeed = 0;
        document.getElementById('chrono').textContent = "Game Over!";
        
        let score1 = parseInt(document.getElementById('scores1').textContent.split(' ')[1]); // Get score of opponent1
        let score2 = parseInt(document.getElementById('scores2').textContent.split(' ')[1]); // Get score of opponent2

        document.getElementById('finalResultOverlay').style.display = 'flex'; // Display the result overlay

        if (score1 > score2) {
            document.getElementById('resultText').textContent = `${document.getElementById('opn1').textContent} Wins!`;
        } else if (score1 < score2) {
            document.getElementById('resultText').textContent = `${document.getElementById('opn2').textContent} Wins!`;
        } else {
            document.getElementById('resultText').textContent = "It's a Draw!";
        }
        document.getElementById('leaveGameButton').classList.add('d-none');
    }
    
    
    function resetBall1(loser) {
        ball.position.x = 0;
        ball.position.y = 0;
    
        ballSpeed = 2; 
        if (loser == 1) {
            ballDirX = -1; 
        } else {
            ballDirX = 1;   
        }
    
        ballDirY = 1;  
    }

    function checkSize() {
        window.addEventListener('resize', function() {
            let WIDTH = window.innerWidth - 160;
            let HEIGHT = WIDTH * 720 / 1750;
            
            renderer.setSize(WIDTH, HEIGHT);
        });
    }

    function draw1() {
        if (!playerIsActive)
        {
            cancelAnimationFrame(draw1);
            stopChrono();
            return;
        }
        checkSize();
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(draw1);

        ballPhysics1();
        paddlePhysics1();
        cameraPhysics1();
        playerPaddleMovement1();
        playerPaddleMovement12();
    }
    
    function startChrono1() {
        if (chronoInterval) {
            clearInterval(chronoInterval);
        }
    
        let timer = document.getElementById('chrono');
        let seconds = 0;
    
        timer.textContent = "00:00";
    
        chronoInterval = setInterval(() => {
            seconds++;
            let minutes = Math.floor(seconds / 60);
            let displaySeconds = seconds % 60;
            if (displaySeconds < 10) displaySeconds = '0' + displaySeconds;
            timer.textContent = `${minutes}:${displaySeconds}`;
        }, 1000);
    }
    
    function stopChrono() {
        if (chronoInterval) {
            clearInterval(chronoInterval);
        }
        if (stopInterval)
            clearTimeout(stopInterval);
    }
    
    function ballPhysics1() {
        // Check if the ball has hit the left or right wall (goals)
        if (ball.position.x <= -fieldWidth / 2) {
            score2++;
            document.getElementById("scores2").innerHTML = "Score: " + score2;
            resetBall1(2);
            matchScoreCheck1();
        }
        
        if (ball.position.x >= fieldWidth / 2) {
            score1++;
            document.getElementById("scores1").innerHTML = "Score: " + score1;
            resetBall1(1);
            matchScoreCheck1();
        }
    
        if (ball.position.y <= -fieldHeight / 2 || ball.position.y >= fieldHeight / 2) {
            ballDirY = -ballDirY;  // Reverse direction
        }
    
        ball.position.x += ballDirX * ballSpeed;
        ball.position.y += ballDirY * ballSpeed;
    
        if (Math.abs(ballDirY) > ballSpeed * 2) {
            ballDirY = (ballDirY > 0 ? 1 : -1) * ballSpeed * 2;
        }
    }
    
    function playerPaddleMovement1()
    {
        
        if (Key.isDown(Key.A))		
        {
            
            if (paddle1.position.y < fieldHeight * 0.45)
            {
                paddle1DirY = paddleSpeed * 0.5;
            }
            else
            {
                paddle1DirY = 0;
                paddle1.scale.z += (10 - paddle1.scale.z) * 0.2;
            }
        }	
        else if (Key.isDown(Key.Q))
        {
            if (paddle1.position.y > -fieldHeight * 0.45)
            {
                paddle1DirY = -paddleSpeed * 0.5;
            }
            else
            {
                paddle1DirY = 0;
                paddle1.scale.z += (10 - paddle1.scale.z) * 0.2;
            }
        }
        else
        {
            paddle1DirY = 0;
        }
        
        paddle1.scale.y += (1 - paddle1.scale.y) * 0.2;	
        paddle1.scale.z += (1 - paddle1.scale.z) * 0.2;	
        paddle1.position.y += paddle1DirY;
    }
    
    
    function playerPaddleMovement12()
    {
        
        if (Key.isDown(Key.UP))		
        {
            if (paddle2.position.y < fieldHeight * 0.45)
            {
                paddle2DirY = paddleSpeed * 0.5;
            }
            else
            {
                paddle2DirY = 0;
                paddle2.scale.z += (10 - paddle2.scale.z) * 0.2;
            }
        }
        else if (Key.isDown(Key.DOWN))
        {
            if (paddle2.position.y > -fieldHeight * 0.45)
            {
                paddle2DirY = -paddleSpeed * 0.5;
            }
            else
            {
                paddle2DirY = 0;
                paddle2.scale.z += (10 - paddle2.scale.z) * 0.2;
            }
        }
        else
        {
            paddle2DirY = 0;
        }
        
        paddle2.scale.y += (1 - paddle2.scale.y) * 0.2;	
        paddle2.scale.z += (1 - paddle2.scale.z) * 0.2;	
        paddle2.position.y += paddle2DirY;
    }
    
    function cameraPhysics1()
    {
        camera.position.x = -243;
        camera.position.y =0;
        camera.position.z = 107;
        camera.rotation.x = -0.008377580409572781;
        camera.rotation.y = -1.0471975511965976;
        camera.rotation.z = -1.5707963267948966;
    }
    
    function paddlePhysics1()
    {
        if (ball.position.x <= paddle1.position.x + paddleWidth
        &&  ball.position.x >= paddle1.position.x)
        {
            if (ball.position.y <= paddle1.position.y + paddleHeight/2
            &&  ball.position.y >= paddle1.position.y - paddleHeight/2)
            {
                if (ballDirX < 0)
                {
                    paddle1.scale.y = 15;
                    ballDirX = -ballDirX;
                    ballDirY -= paddle1DirY * 0.7;
                }
            }
        }
        
        if (ball.position.x <= paddle2.position.x + paddleWidth
        &&  ball.position.x >= paddle2.position.x)
        {
            if (ball.position.y <= paddle2.position.y + paddleHeight/2
            &&  ball.position.y >= paddle2.position.y - paddleHeight/2)
            {
                if (ballDirX > 0)
                {
                    paddle2.scale.y = 15;	
                    ballDirX = -ballDirX;
                    ballDirY -= paddle2DirY * 0.7;
                }
            }
        }
    }
    
    var bounceTime = 0;
    
    function matchScoreCheck1()
    {
        if (score1 >= maxScore)
        {
            ballSpeed = 0;
            bounceTime++;
            paddle1.position.z = Math.sin(bounceTime * 0.1) * 10;
            paddle1.scale.z = 2 + Math.abs(Math.sin(bounceTime * 0.1)) * 10;
            paddle1.scale.y = 2 + Math.abs(Math.sin(bounceTime * 0.05)) * 10;
        }
        else if (score2 >= maxScore)
        {
            ballSpeed = 0;
            // document.getElementById()
            bounceTime++;
            paddle2.position.z = Math.sin(bounceTime * 0.1) * 10;
            paddle2.scale.z = 2 + Math.abs(Math.sin(bounceTime * 0.1)) * 10;
            paddle2.scale.y = 2 + Math.abs(Math.sin(bounceTime * 0.05)) * 10;
        }
    }

    if (!addListDiv) {
        return;
    }

    const submitButton = document.createElement("button"); 
    submitButton.textContent = "Submit Final List";
    submitButton.style.display = "none"; 
    submitButton.classList.add("submit-btn"); 

    addListDiv.appendChild(submitButton);

    const errorMessage = document.createElement("div");
    errorMessage.classList.add("error-message");
    errorMessage.style.color = "red";
    errorMessage.style.display = "none";
    errorMessage.textContent = "You must enter a username!";
    
    addListDiv.insertBefore(errorMessage, listContainer);

    function checkSelectedParticipants() {
        const checkedItems = listContainer.querySelectorAll("li.checked").length;
        if (checkedItems === 4) {
            submitButton.style.display = "block";
            submitButton.style.margin = "20px auto";
        } else {
            submitButton.style.display = "none";
        }
    }

    function addParticipant() {
        if (inputBox && listContainer) {
            if (inputBox.value === '') {
                errorMessage.style.display = "block";
            } else {
                errorMessage.style.display = "none";
                let li = document.createElement("li");
                li.innerHTML = sanitizeMessage(inputBox.value);
                listContainer.appendChild(li);

                let span = document.createElement("span");
                span.innerHTML = "\u00d7";
                li.appendChild(span);
            }
            inputBox.value = "";
        }
    }

    listContainer.addEventListener("click", function (e) {
        if (e.target.tagName === "LI") {
            e.target.classList.toggle("checked");
            checkSelectedParticipants();
        } else if (e.target.tagName === "SPAN") {
            e.target.parentElement.remove();
            checkSelectedParticipants();
        }
    }, false);

    addBtn.addEventListener("click", addParticipant);

    inputBox.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addParticipant();
        }
    });

    tournamentNameInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            submitTournamentName();
        }
    });

    createLocal.querySelector("#start-tournament-btn").addEventListener("click", function(event) {
        event.preventDefault();
        submitTournamentName();
    });

    function submitTournamentName() {
        const tournamentName = sanitizeMessage(tournamentNameInput.value);
        let errorMessage = document.querySelector(".tournament-error-message");
    
        if (!errorMessage) {
            errorMessage = document.createElement("div");
            errorMessage.classList.add("tournament-error-message");
            errorMessage.style.color = "red";
            errorMessage.style.marginTop = "10px";
            document.getElementById('create-tournament-section').appendChild(errorMessage);
        }
    
        if (!tournamentName) {
            errorMessage.textContent = "Please enter a tournament name.";
            errorMessage.style.display = "block";
            return;
        }
    
        const accessToken = getCookie('my-token');
    
        if (!accessToken) {
            errorMessage.textContent = "You are not authenticated.";
            errorMessage.style.display = "block";
            return;
        }
    
        fetch(`api/check-tournament-name/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ name: tournamentName })
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
            if (data.exists) {
                errorMessage.textContent = "Tournament name already exists.";
                errorMessage.style.display = "block";
            } else {
                errorMessage.style.display = "none";
                document.getElementById('create-tournament-section').style.display = "none";
                document.getElementById("participants-section").style.display = "block";
            }
        })
        .catch(error => {
            errorMessage.textContent = "An error occurred. Please try again.";
            errorMessage.style.display = "block";
        });
    }    

    function handleTournament() {
        const tournamentName = sanitizeMessage(tournamentNameInput.value);
        var participants = [];
        document.querySelectorAll("#list-container li.checked").forEach(li => {
            participants.push(li.textContent.replace("×", "").trim());
        });
    
        var tournamentData = {
            action: "create_tournament",
            tournament_name: tournamentName,
            participants: participants
        };
    
        localsocket = new WebSocket(
            'wss://' + window.location.host + '/ws/pingpong/tournament/' + tournamentName + '/'
        );
    
        localsocket.onopen = function(e) {
            localsocket.send(JSON.stringify(tournamentData));
        };


    
        localsocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
    
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
                const winnerContent = document.querySelector('.winner-content');
            
                setTimeout(function() {
                    shema.style.display = 'none';
                    if (winnerContent) {
                        document.getElementById('award').textContent = `${winner}`;
                        winnerContent.style.display = 'block';
                    }
                    startConfetti('main-content');
                }, 5000);

                setTimeout(function() {
                    const resultDiv = document.getElementById('finalResultOverlay');
                    const resultMessage = document.getElementById('resultText');
                    const buttondiv = document.getElementById('leaveGameButton');
                    resultDiv.style.display = 'flex';
                    resultMessage.textContent = 'Tournament Is Ended';
                    buttondiv.textContent = 'Leave Tournament';
                    buttondiv.classList.remove('d-none');
                    buttondiv.addEventListener('click', function() {
                        loadContentInDiv('#gaming');
                    });
                }, 10000);
            }
    
            if (data.status === 'first_round') {
                const shema = document.querySelector('.parent-container');
                addListDiv.style.display = 'none';
                document.getElementById('finalResultOverlay').style.display = 'none';
                shema.style.display = 'flex';
                participants = data['participants'];
    
                updateFirstRound(participants[0], participants[1], participants[2], participants[3]);
    
                setTimeout(function() {
                    shema.style.display = 'none';
                    tournamentData = {
                        action: "play_match",
                        tournament_name: tournamentName,
                        round: r,
                        match: i,
                        winner: "",
                    };
                    localsocket.send(JSON.stringify(tournamentData));
                }, 5000);
            }
    
            if (data.status === 'second_round') {
                r++;
                i = 0;
                const shema = document.querySelector('.parent-container');
                document.getElementById('finalResultOverlay').style.display = 'none';
                shema.style.display = 'flex';
                participants = data['participants'];
    
                updateFinalists(participants[0], participants[1]);
    
                setTimeout(function() {
                    shema.style.display = 'none';
                    tournamentData = {
                        action: "play_match",
                        tournament_name: tournamentName,
                        round: r,
                        match: i,
                        winner: "",
                    };
                    localsocket.send(JSON.stringify(tournamentData));
                }, 5000);
            }
    
            if (data.status === 'final') {
                const winner = data.winner;
                const shema = document.querySelector('.parent-container');
                document.getElementById('finalResultOverlay').style.display = 'none';
                shema.style.display = 'flex';
                updateFinalWinner(winner);
            }
    
            if (data.status === 'play') {
                const matchDiv = document.querySelector('.match');
                const matchContent = `
                    <div class="match-container">
                        <p class="match-text">${data.participant1} <span class="vs">vs</span> ${data.participant2}</p>
                        <button id="play-btn" class="play-button">Play</button>
                    </div>
                `;
    
                matchDiv.innerHTML = matchContent;
                document.getElementById('finalResultOverlay').style.display = 'none';
                matchDiv.style.display = 'block';
    
                const playBtn = document.getElementById('play-btn');
                playBtn.addEventListener('click', function () {
    
                    document.getElementById('opn1').textContent = data.participant1;
                    document.getElementById('opn2').textContent = data.participant2;
    
                    const scoreboard = document.getElementById('scoreboard1');
                    const gameCanvas = document.querySelector('.gameCanvas2');
    
                    matchDiv.style.display = 'none';
                    scoreboard.style.display = 'flex';
                    gameCanvas.style.display = 'flex';
                    setup1();

                    setTimeout(function () {
                        let score1Text = document.getElementById('scores1').textContent;
                        let score2Text = document.getElementById('scores2').textContent;

                        let score1 = parseInt(score1Text.split(': ')[1], 10);
                        let score2 = parseInt(score2Text.split(': ')[1], 10);
                        let winner;
                        if (score1 > score2) {
                            winner = document.getElementById('opn1').textContent;
                        } else if (score2 > score1) {
                            winner = document.getElementById('opn2').textContent;
                        } else {
                            winner = "Draw";
                        }
                        document.getElementById('chrono').textContent = "00:00";
                        document.getElementById('scores1').textContent = "Score: 0";
                        document.getElementById('scores2').textContent = "Score: 0";
                        scoreboard.style.display = 'none';
                        gameCanvas.style.display = 'none';
                        if (winner != "Draw")
                            i += 2;
                        tournamentData = {
                            action: "play_match",
                            tournament_name: tournamentName,
                            round: r,
                            match: i,
                            winner: winner,
                        };
                        playerIsActive = false;
                        localsocket.send(JSON.stringify(tournamentData));
                    }, 15000);

                });
            }
        };
    
        localsocket.onclose = function(e) {
        };
    }

    document.querySelector(".submit-btn").addEventListener("click", function (event) {
        event.preventDefault();
    
        const tournamentData = {
            action: "submit",
        };
    
        const socket = new WebSocket('wss://' + window.location.host + '/ws/pingpong/tournament/');
    
        socket.onopen = function () {
            socket.send(JSON.stringify(tournamentData));
        };
    
        socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if (data.status == "handle") {
                handleTournament();
            }
        };
    
        socket.onclose = function () {
        };
    
        socket.onerror = function (error) {
        };
    });
}