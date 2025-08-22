function initializeAIPing() {
    playerIsActive = true;
    var renderer, scene, camera, pointLight, spotLight;
    var fieldWidth = 300, fieldHeight = 150;
    var paddleWidth, paddleHeight, paddleDepth, paddleQuality;
    var paddle1DirY = 0, paddle2DirY = 0, paddleSpeed = 3;
    var ball, paddle1, paddle2;
    var ballDirX = 1, ballDirY = 1, ballSpeed = 2;
    var score1 = 0, score2 = 0;
    var maxScore = 7;
    var difficulty = 0.2;
    var bounceTime = 0;
    var maxTime = 4;
    let chronoInterval;

    function startChrono() {
        let timer = document.getElementById('chrono');
        let seconds = 0;
        chronoInterval = setInterval(() => { // Store the interval ID here
            seconds++;
            let minutes = Math.floor(seconds / 60);
            let displaySeconds = seconds % 60;
            if (displaySeconds < 10) displaySeconds = '0' + displaySeconds;
            timer.textContent = `${minutes}:${displaySeconds}`;
        }, 1000);
    }
    
    function stopChrono() {
        if (chronoInterval) {
            clearInterval(chronoInterval); // Clear the interval here
        }
    }
    
    
    function checkSize() {
        window.addEventListener('resize', function() {
            let WIDTH = window.innerWidth - 160;
            let HEIGHT = WIDTH * 720 / 1750;
            
            renderer.setSize(WIDTH, HEIGHT);
        });
    }
    
    function setup() {
        score1 = 0;
        score2 = 0;
    
        paddle1DirY = 0;
        paddle2DirY = 0;
        paddleSpeed = 3;
    
        ballDirX = 1;
        ballDirY = 1;
        ballSpeed = 2;
    
        score1 = 0;
        score2 = 0;
        maxScore = 7;
    
        difficulty = 0.2;

        if (!scene) {
            createScene();
        }
    
        startChrono();
    
        draw();

        setTimeout(function () {
            if (playerIsActive)
                stopGame();
        }, 10000);
    }

    function stopGame() {
        cancelAnimationFrame(draw);
        stopChrono();
        ballSpeed = 0;
        paddleSpeed = 0;
    
        document.getElementById('chrono').textContent = "Game Over!";
        
        let score1 = parseInt(document.getElementById('scores1').textContent.split(' ')[1]); // Get score of opponent1
        let score2 = parseInt(document.getElementById('scores2').textContent.split(' ')[1]); // Get score of opponent2

        document.getElementById('finalResultOverlay').style.display = 'flex';

        if (score1 > score2) {
            document.getElementById('resultText').textContent = `${document.getElementById('opn1').textContent} Wins!`;
        } else if (score1 < score2) {
            document.getElementById('resultText').textContent = `${document.getElementById('opn2').textContent} Wins!`;
        } else {
            document.getElementById('resultText').textContent = "It's a Draw!";
        }
    
        document.getElementById('leaveGameButton').addEventListener('click', function() {
            loadContentInDiv('#gaming');
            // setTimeout(drawLineChart, 500);
        });
    }
    
    function createScene() {
        let WIDTH = 1750;
        let HEIGHT = 720;
     
        fieldWidth = WIDTH * 300 / 1750;
        fieldHeight = fieldWidth * 150 / 300;
    
        let VIEW_ANGLE = 50,
            ASPECT = 1760 / 720,
            NEAR = 0.1,
            FAR = 10000;
    
        let c = document.getElementById("gameCanvas");
    
        renderer = new THREE.WebGLRenderer();
        camera =
            new THREE.PerspectiveCamera(
                VIEW_ANGLE,
                ASPECT,
                NEAR,
                FAR);
    
        scene = new THREE.Scene();
    
        scene.add(camera);
    
        camera.position.z = 320;
    
        renderer.setSize(WIDTH, HEIGHT);
    
        c.appendChild(renderer.domElement);
    
        let planeWidth = fieldWidth,
            planeHeight = fieldHeight,
            planeQuality = 10;
    
        let paddle1Material =
            new THREE.MeshLambertMaterial(
                {
                    color: '#303030'
                });
        let paddle2Material =
            new THREE.MeshLambertMaterial(
                {
                    color: '#303030'
                });
        let planeMaterial =
            new THREE.MeshLambertMaterial(
                {
                    color: '#3a0aab'
                });
        let tableMaterial =
            new THREE.MeshLambertMaterial(
                {
                    color: 0x111111
                });
        let pillarMaterial =
            new THREE.MeshLambertMaterial(
                {
                    color: '#3a0aab'
                });
        let groundMaterial =
            new THREE.MeshLambertMaterial(
                {
                    color: '#303030'
                });
    
        let plane = new THREE.Mesh(
    
            new THREE.PlaneGeometry(
                planeWidth * 0.95,
                planeHeight,
                planeQuality,
                planeQuality),
    
            planeMaterial);
    
        scene.add(plane);
        plane.receiveShadow = true;
    
        let table = new THREE.Mesh(
    
            new THREE.CubeGeometry(
                planeWidth * 1.05,
                planeHeight * 1.03,
                100,
                planeQuality,
                planeQuality,
                1),
    
            tableMaterial);
        table.position.z = -51;
        scene.add(table);
        table.receiveShadow = true;
    
        let radius = 4,
            segments = 5,
            rings = 5;
    
        let sphereMaterial =
            new THREE.MeshLambertMaterial(
                {
                    color: 0x534d0d
                });
    
        ball = new THREE.Mesh(
    
            new THREE.SphereGeometry(
                radius,
                segments,
                rings),
    
            sphereMaterial);
    
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
    
            new THREE.CubeGeometry(
                paddleWidth,
                paddleHeight,
                paddleDepth,
                paddleQuality,
                paddleQuality,
                paddleQuality),
    
            paddle1Material);
    
        scene.add(paddle1);
        paddle1.receiveShadow = true;
        paddle1.castShadow = true;
    
        paddle2 = new THREE.Mesh(
    
            new THREE.CubeGeometry(
                paddleWidth,
                paddleHeight,
                paddleDepth,
                paddleQuality,
                paddleQuality,
                paddleQuality),
    
            paddle2Material);
    
        scene.add(paddle2);
        paddle2.receiveShadow = true;
        paddle2.castShadow = true;
    
        paddle1.position.x = -fieldWidth / 2 + paddleWidth;
        paddle2.position.x = fieldWidth / 2 - paddleWidth;
    
        paddle1.position.z = paddleDepth;
        paddle2.position.z = paddleDepth;
    
        for (let i = 0; i < 5; i++) {
            let backdrop = new THREE.Mesh(
    
                new THREE.CubeGeometry(
                    30,
                    30,
                    300,
                    1,
                    1,
                    1),
    
                pillarMaterial);
    
            backdrop.position.x = -50 + i * 100;
            backdrop.position.y = 230;
            backdrop.position.z = -30;
            backdrop.castShadow = true;
            backdrop.receiveShadow = true;
            scene.add(backdrop);
        }
    
        for (let i = 0; i < 5; i++) {
            let backdrop = new THREE.Mesh(
    
                new THREE.CubeGeometry(
                    30,
                    30,
                    300,
                    1,
                    1,
                    1),
    
                pillarMaterial);
    
            backdrop.position.x = -50 + i * 100;
            backdrop.position.y = -230;
            backdrop.position.z = -30;
            backdrop.castShadow = true;
            backdrop.receiveShadow = true;
            scene.add(backdrop);
        }
    
        let ground = new THREE.Mesh(
    
            new THREE.CubeGeometry(
                1000,
                1000,
                3,
                1,
                1,
                1),
    
            groundMaterial);
        ground.position.z = -132;
        ground.receiveShadow = true;
        scene.add(ground);
    
        pointLight =
            new THREE.PointLight(0xF8D898);
    
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
        WIDTH = window.innerWidth - 160;
        HEIGHT = WIDTH * 720 / 1750;
    
        renderer.setSize(WIDTH, HEIGHT);
    }
    
    function draw() {
        if (!playerIsActive)
        {
            cancelAnimationFrame(draw);
            stopChrono();
            return;
        }
        checkSize();
        renderer.render(scene, camera);
        requestAnimationFrame(draw);
    
        ballPhysics();
        paddlePhysics();
        cameraPhysics();
        playerPaddleMovement();
        opponentPaddleMovement();
    }
    
    function ballPhysics() {
        if (ball.position.x <= -fieldWidth / 2) {
            score2++;
            document.getElementById("scores2").innerHTML = "Score: " + score2;
            resetBall(2);
            matchScoreCheck();
        }
    
        if (ball.position.x >= fieldWidth / 2) {
            score1++;
            document.getElementById("scores1").innerHTML = "Score: " + score1;
            resetBall(1);
            matchScoreCheck();
        }
    
        if (ball.position.y <= -fieldHeight / 2) {
            ballDirY = -ballDirY;
        }
        if (ball.position.y >= fieldHeight / 2) {
            ballDirY = -ballDirY;
        }
    
        ball.position.x += ballDirX * ballSpeed;
        ball.position.y += ballDirY * ballSpeed;
        
        if (ballDirY > ballSpeed * 2) {
            ballDirY = ballSpeed * 2;
        } else if (ballDirY < -ballSpeed * 2) {
            ballDirY = -ballSpeed * 2;
        }
    }
    
    function resetBall(loser) {
        ball.position.x = 0;
        ball.position.y = 0;
        ballSpeed = 2;
    
        if (loser === 1) {
            ballDirX = -1;
        } else {
            ballDirX = 1;
        }
    
        ballDirY = 1;
    }
    
    function adjustBallSpeed() {
        let scaleFactor = fieldWidth / 300;
        ballSpeed = 2 * scaleFactor;
    }
    
    
    function opponentPaddleMovement() {
        paddle2DirY = (ball.position.y - paddle2.position.y) * difficulty;
    
        if (Math.abs(paddle2DirY) <= paddleSpeed) {
            paddle2.position.y += paddle2DirY;
        }
        else {
            if (paddle2DirY > paddleSpeed) {
                paddle2.position.y += paddleSpeed;
            }
            else if (paddle2DirY < -paddleSpeed) {
                paddle2.position.y -= paddleSpeed;
            }
        }
        // paddle2.scale.y += (1 - paddle2.scale.y) * 0.2;
    }
    
    function playerPaddleMovement() {
        if (Key.isDown(Key.A)) {
            if (paddle1.position.y < fieldHeight * 0.45) {
                paddle1DirY = paddleSpeed * 0.5;
            }
            else {
                paddle1DirY = 0;
                // paddle1.scale.z += (10 - paddle1.scale.z) * 0.2;
            }
        }
        else if (Key.isDown(Key.D)) {
            if (paddle1.position.y > -fieldHeight * 0.45) {
                paddle1DirY = -paddleSpeed * 0.5;
            }
            else {
                paddle1DirY = 0;
                // paddle1.scale.z += (10 - paddle1.scale.z) * 0.2;
            }
        }
        else {
            paddle1DirY = 0;
        }
    
        // paddle1.scale.y += (1 - paddle1.scale.y) * 0.2;
        // paddle1.scale.z += (1 - paddle1.scale.z) * 0.2;
        paddle1.position.y += paddle1DirY;
    }
    
    function cameraPhysics() {
        camera.position.x = -243;
        camera.position.y = 0;
        camera.position.z = 107;
        camera.rotation.x = -0.008377580409572781;
        camera.rotation.y = -1.0471975511965976;
        camera.rotation.z = -1.5707963267948966;
    }
    
    function paddlePhysics() {
        if (ball.position.x <= paddle1.position.x + paddleWidth
            && ball.position.x >= paddle1.position.x) {
            if (ball.position.y <= paddle1.position.y + paddleHeight / 2
                && ball.position.y >= paddle1.position.y - paddleHeight / 2) {
                if (ballDirX < 0) {
                    // paddle1.scale.y = 15;
                    ballDirX = -ballDirX;
                    ballDirY -= paddle1DirY * 0.7;
                }
            }
        }
    
        if (ball.position.x <= paddle2.position.x + paddleWidth
            && ball.position.x >= paddle2.position.x) {
            if (ball.position.y <= paddle2.position.y + paddleHeight / 2
                && ball.position.y >= paddle2.position.y - paddleHeight / 2) {
                if (ballDirX > 0) {
                    // paddle2.scale.y = 15;
                    ballDirX = -ballDirX;
                    ballDirY -= paddle2DirY * 0.7;
                }
            }
        }
    }
    
    // function resetBall(loser) {
    //     ball.position.x = 0;
    //     ball.position.y = 0;
    //     ballSpeed = 2;
    
    //     if (loser == 1) {
    //         ballDirX = -1;
    //     }
    //     else {
    //         ballDirX = 1;
    //     }
    
    //     ballDirY = 1;
    // }
    
    // let bounceTime = 0;
    
    function matchScoreCheck() {
        if (score1 >= maxScore) {
            ballSpeed = 0;
            // score2 = 0;
            // score1 = 0;
            bounceTime++;
            paddle1.position.z = Math.sin(bounceTime * 0.1) * 10;
            // paddle1.scale.z = 2 + Math.abs(Math.sin(bounceTime * 0.1)) * 10;
            // paddle1.scale.y = 2 + Math.abs(Math.sin(bounceTime * 0.05)) * 10;
        }
        else if (score2 >= maxScore) {
            // score2 = 0;
            // score1 = 0;
            ballSpeed = 0;
            // document.getElementById()
            bounceTime++;
            paddle2.position.z = Math.sin(bounceTime * 0.1) * 10;
            // paddle2.scale.z = 2 + Math.abs(Math.sin(bounceTime * 0.1)) * 10;
            // paddle2.scale.y = 2 + Math.abs(Math.sin(bounceTime * 0.05)) * 10;
        }
    }
    const profile1 = document.querySelector('.opponent1 img');
    const name = document.querySelector('.opponent1 #opn1');
    loadUserdata_game(profile1, name);
    setup();
}