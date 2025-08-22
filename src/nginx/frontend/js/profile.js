

function init_thre_points() {
    const threePoint = document.querySelector('.three-add-block');

    if (threePoint) {
        threePoint.addEventListener('click', function(event) {
            event.stopPropagation(); 
            const menu = document.getElementById('menu-add-block');
            if(menu.style.display === 'block')
            {
            menu.style.display = 'none';
            }
            else 
            {
                menu.style.display = 'block';
            }
        });

        document.addEventListener('click', function(event) {
            const menu = document.getElementById('menu-add-block');
            const isClickInside = threePoint.contains(event.target);

            // if (!isClickInside) {
            //     menu.style.display = 'none';
            // }
			// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
			
        });

        
    } else {
        // console.error(" menu element not found");
    }
}



async function load_profile_user() {
    
	const access_token = getCookie('my-token');
    const countries = await loadCountries();
	fetch('/api/user/', {
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
        .then(userData => {
            if (dkhaltntchecki)
                return;
            const countryCode = userData.country_select;
            const countryFullName = countries[countryCode] || countryCode; 
			document.getElementById('username').textContent = userData.username;
			document.getElementById('bio-pro').textContent = userData.about;
			document.getElementById('pr-img').src = userData.avatar;
			document.getElementById('country_select').textContent = countryFullName;
            document.getElementById('loses-rate').textContent = userData.lose + "%";
            document.getElementById('wins-rate').textContent = userData.win + "%";
            document.getElementById('draws-rate').textContent = userData.draw + "%";
            document.getElementById('win-bar').style.width = userData.win + "%";
            document.getElementById('lose-bar').style.width = userData.lose + "%";
            document.getElementById('draw-bar').style.width = userData.draw + "%";
            const canvas = document.getElementById('progressCanvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 300;
            canvas.height = 300;

            const startAngle = -Math.PI / 2;
            const fullCircle = Math.PI * 2;
            const targetPercentage = userData.level_progress;
            const circleRadius = 120;
            const lineWidth = 20;
            const levelText = "Level " + userData.level;

            function drawCircle(percentage) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, fullCircle);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = lineWidth;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(
                    canvas.width / 2,
                    canvas.height / 2,
                    circleRadius,
                    startAngle,
                    startAngle + (fullCircle * (percentage / 100))
                );
                ctx.strokeStyle = '#5623d8';
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${circleRadius / 2.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.floor(percentage)}%`, canvas.width / 2, canvas.height / 2 - 15);

                ctx.font = `bold ${circleRadius / 4}px Arial`;
                ctx.fillText(levelText, canvas.width / 2, canvas.height / 2 + 25);
            }

            function animateProgress(target) {
                let currentPercentage = 0;
                const increment = target / 100;

                function animate() {
                    if (currentPercentage < target) {
                        currentPercentage += increment;
                        drawCircle(currentPercentage);
                        requestAnimationFrame(animate);
                    } else {
                        drawCircle(target);
                    }
                }

                animate();
            }
            animateProgress(targetPercentage);
            displayMatchHistory(userData.match_history || []);
            displayTournamentHistory(userData.tournament_history || []);
            displayAchievements(userData.achievements || []);
            
            const menuBtn = document.querySelector(".menu-btn");
            const dropdownMenu = document.querySelector(".dropdown-menu");

            menuBtn.addEventListener("click", () => {
                dropdownMenu.classList.remove("hidden");
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest(".menu-icon")) {
                    dropdownMenu.classList.add("hidden");
                }
            });

            document.getElementById("show-blocked").addEventListener("click", () => {
                fetchBlockedUsers();
                const overlay = document.getElementById('blocked-overlay');
                overlay.style.display = 'flex';
                overlay.addEventListener('click', () => {
                    overlay.style.display = 'none';
                });
                dropdownMenu.classList.add("hidden");
            });

            document.getElementById("change-nickname").addEventListener("click", () => {
                const overlay = document.getElementById('nickname-overlay');
                const inputNickBox = document.getElementById('input-nick-box');
                overlay.style.display = 'flex';
                overlay.addEventListener('click', (event) => {
                    if (event.target === overlay) {
                        overlay.style.display = 'none';
                    }
                });
                dropdownMenu.classList.add("hidden");
                inputNickBox.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        const nickname = sanitizeMessage(inputNickBox.value);
                        changeNickname(nickname);
                        inputNickBox.value = '';
                    }
                });
            });
            

            document.getElementById("add-new").addEventListener("click", () => {
                fetchAndDisplayUsers();
                const overlay = document.getElementById('add-overlay');
                overlay.style.display = 'flex';
                overlay.addEventListener('click', () => {
                    overlay.style.display = 'none';
                });
                dropdownMenu.classList.add("hidden");
            });

            document.getElementById("show-requests").addEventListener("click", () => {
                getFriendRequests();
                const overlay = document.getElementById('request-overlay');
                overlay.style.display = 'flex';
                overlay.addEventListener('click', () => {
                    overlay.style.display = 'none';
                });
                dropdownMenu.classList.add("hidden");
            });

            document.getElementById("show-friends").addEventListener("click", () => {
                getFriends();
                const overlay = document.getElementById('friend-overlay');
                overlay.style.display = 'flex';
                overlay.addEventListener('click', () => {
                    overlay.style.display = 'none';
                });
                dropdownMenu.classList.add("hidden");
            });

            document.getElementById("close-modal").addEventListener("click", () => {
                document.getElementById("user-list-modal").classList.add("hidden");
            });
		})
		.catch(error => {
		});
}

async function displayTournamentHistory(TournamentHistory) {
    const tournamentList = document.querySelector(".tournamenthistory");
    tournamentList.innerHTML = "";

    if (TournamentHistory.length === 0) {
        tournamentList.innerHTML = "<li><h6>No tournaments to display</h6></li>";
        return;
    }

    TournamentHistory.forEach(tournament => {
        const listItem = document.createElement("li");
        const tournamentName = document.createElement("h6");
        tournamentName.textContent = tournament.tournament_name;
        listItem.appendChild(tournamentName);
        // listItem.style.padding = "10px 0";
        tournamentList.appendChild(listItem);
    });    
}

async function displayAchievements(achievements) {
    const tournamentList = document.querySelector(".achievements");
    tournamentList.innerHTML = "";

    if (achievements.length === 0) {
        tournamentList.innerHTML = "<li><h6>No achievements to display</h6></li>";
        return;
    }

    achievements.forEach(achievement => {
        const achievementItem = document.createElement("li");
        
        const achievementDiv = document.createElement("div");
        achievementDiv.classList.add("achiev-icons");

        const img = document.createElement("img");
        img.src = `../images/avatars/${getIconForAchievement(achievement.achievement_type)}`;
        img.alt = "Achievement Icon";
        img.classList.add("achievement-icon");
        
        const span = document.createElement("span");
        span.classList.add("achievement-title");
        span.textContent = achievement.achievement_type;

        // const descriptionSpan = document.createElement("span");
        // descriptionSpan.classList.add("achievement-description");
        // descriptionSpan.textContent = achievement.description;

        // const dateSpan = document.createElement("span");
        // dateSpan.classList.add("achievement-date");
        // dateSpan.textContent = `Awarded on: ${new Date(achievement.date_awarded).toLocaleDateString()}`;

        achievementDiv.appendChild(img);
        achievementDiv.appendChild(span);
        achievementItem.appendChild(achievementDiv);
        tournamentList.appendChild(achievementItem);
    });
}

function getIconForAchievement(achievementType) {
    switch (achievementType) {
        case "First Match Won":
            return "first.png";
        case "5 Wins!":
            return "first.png";
        case "Level Up to Level 2":
            return "xp.png";
        default:
            return "xp.png";
    }
}

async function displayMatchHistory(matchHistory) {
    const pingpongList = document.querySelector(".ponotoonehistory");
    const tictactoeList = document.querySelector(".tonotoonehistory");
    const pingTab = document.getElementById("pingpong-header");
    const ticTab = document.getElementById("tictactoe-header");

    const toggleTabs = (tabToActivate, contentToActivate, otherTab, otherContent) => {
        tabToActivate.classList.add("active");
        contentToActivate.classList.remove("d-none");
        otherTab.classList.remove("active");
        otherContent.classList.add("d-none");
    };

    pingTab.addEventListener("click", () => {
        toggleTabs(pingTab, pingpongList, ticTab, tictactoeList);
    });

    ticTab.addEventListener("click", () => {
        toggleTabs(ticTab, tictactoeList, pingTab, pingpongList);
    });

    pingpongList.innerHTML = "";
    tictactoeList.innerHTML = "";

    if (matchHistory.pingpong.length === 0 && matchHistory.tictactoe.length === 0) {
        pingpongList.innerHTML = "<li><h6>No Ping Pong matches to display</h6></li>";
        tictactoeList.innerHTML = "<li><h6>No Tic Tac Toe matches to display</h6></li>";
        return;
    }
    else if (matchHistory.pingpong.length === 0)
        pingpongList.innerHTML = "<li><h6>No Ping Pong matches to display</h6></li>";
    else if (matchHistory.tictactoe.length === 0)
        tictactoeList.innerHTML = "<li><h6>No Tic Tac Toe matches to display</h6></li>";
    
    matchHistory.pingpong.forEach(match => {
        const listItem = document.createElement("li");
        listItem.className = "match-item";

        const player1Div = document.createElement("div");
        player1Div.className = "player player1-corner";
        const player1Img = document.createElement("img");
        player1Img.src = match.player1_avatar || "../images/avatars/default.png";
        player1Img.alt = `Player 1: ${match.player1}`;
        player1Img.className = "player-img";
        player1Div.appendChild(player1Img);

        const centerDiv = document.createElement("div");
        centerDiv.className = "center-section";
        const scoreRow = document.createElement("div");
        scoreRow.className = "score-row";
        const player1Score = document.createElement("span");
        player1Score.className = "score player1-score";
        player1Score.textContent = `${match.score1}`;

        const vsSpan = document.createElement("span");
        vsSpan.className = "vs";
        vsSpan.textContent = "vs";

        const player2Score = document.createElement("span");
        player2Score.className = "score player2-score";
        player2Score.textContent = `${match.score2}`;

        scoreRow.appendChild(player1Score);
        scoreRow.appendChild(vsSpan);
        scoreRow.appendChild(player2Score);
        centerDiv.appendChild(scoreRow);

        // Player 2
        const player2Div = document.createElement("div");
        player2Div.className = "player player2-corner";
        const player2Img = document.createElement("img");
        player2Img.src = match.player2_avatar || "../images/avatars/default.png";
        player2Img.alt = `Player 2: ${match.player2}`;
        player2Img.className = "player-img";
        player2Div.appendChild(player2Img);

        listItem.appendChild(player1Div);
        listItem.appendChild(centerDiv);
        listItem.appendChild(player2Div);
        pingpongList.appendChild(listItem);
    });

    // Display Tic Tac Toe matches
    matchHistory.tictactoe.forEach(match => {
        const listItem = document.createElement("li");
        listItem.className = "match-item";

        // Player 1
        const player1Div = document.createElement("div");
        player1Div.className = "player player1-corner";
        const player1Img = document.createElement("img");
        player1Img.src = match.player1_avatar || "../images/avatars/default.png";
        player1Img.alt = `Player 1: ${match.player1}`;
        player1Img.className = "player-img";
        player1Div.appendChild(player1Img);

        // Center Section (Scores)
        const centerDiv = document.createElement("div");
        centerDiv.className = "center-section";
        const scoreRow = document.createElement("div");
        scoreRow.className = "score-row";
        const player1Score = document.createElement("span");
        player1Score.className = "score player1-score";
        player1Score.textContent = `${match.score1}`;

        const vsSpan = document.createElement("span");
        vsSpan.className = "vs";
        vsSpan.textContent = "vs";

        const player2Score = document.createElement("span");
        player2Score.className = "score player2-score";
        player2Score.textContent = `${match.score2}`;

        scoreRow.appendChild(player1Score);
        scoreRow.appendChild(vsSpan);
        scoreRow.appendChild(player2Score);
        centerDiv.appendChild(scoreRow);

        // Player 2
        const player2Div = document.createElement("div");
        player2Div.className = "player player2-corner";
        const player2Img = document.createElement("img");
        player2Img.src = match.player2_avatar || "../images/avatars/default.png";
        player2Img.alt = `Player 2: ${match.player2}`;
        player2Img.className = "player-img";
        player2Div.appendChild(player2Img);

        listItem.appendChild(player1Div);
        listItem.appendChild(centerDiv);
        listItem.appendChild(player2Div);
        tictactoeList.appendChild(listItem);
    });
}

function getFriends() {
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
        const friendsList = document.getElementById('friend-list');
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
                    <button class="action-disconnect disconnect-btn" data-user-id="${user.id}">Disconnect</button>
                `;
    
                userRow.querySelector(".disconnect-btn").onclick = function() {
                    disconnectFriend(user.username, user.id);
                };
        
                friendsList.appendChild(userRow);
            });
        }
    })
    .catch(error => {
    });
}

function getFriendRequests() {
    const access_token = getCookie('my-token');
    if (!access_token) {
        return;
    }

    fetch('/api/friend-requests/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(response => {
        dkhaltntchecki = false;
        if (!response.ok) {
            if (response.status === 401) {
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
        const requests = data.friend_requests || [];
        const requestsList = document.getElementById('friend-requests-list');
        requestsList.innerHTML = '';
        requests.forEach(request => {
            requestsList.prepend(creatNotifReqFriend(request));
        });
    })
    .catch(error => {
    });
}

function acceptFriendRequest(requestId) {
    if (!requestId)
        return;
    fetch(`/api/accept-friend-request/${requestId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
        if (data.message) {
        } else if (data.error) {
        }
    })
    .catch(error => {
    });
}

function changeNickname(nickname) {
    if (!nickname) return;

    const access_token = getCookie('my-token');
    const data = { nickname: nickname };

    fetch(`/api/change-nickname/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                logoutUserToken();
                return;
            }
        }
        return response.json();
    })
    .then(data => {
    })
    .catch(error => {
    });
}

function rejectFriendRequest(requestId) {
    fetch(`/api/reject-friend-request/${requestId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
    })
    .catch(error => {
    });
}

async function fetchBlockedUsers() {
    const userList = document.getElementById("blocked-list");

    try {
        const access_token = getCookie('my-token');
        const response = await fetch('/api/blocked-users/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });
        dkhaltntchecki = false;
        if (!response.ok) {
            if (response.status === 401)
            {
                dkhaltntchecki = true;
                logoutUserToken();
                return;
            }
        }
        if (dkhaltntchecki)
            return;
        const users = await response.json();
        userList.innerHTML = "";

        if (users.length === 0) {
            userList.innerHTML = "<p>No users found.</p>";
        } else {
            users.forEach(user => {
                const userRow = document.createElement('div');
                userRow.className = 'user-row';
        
                userRow.innerHTML = `
                    <div class="user-info">
                        <img src="${user.avatar || 'https://via.placeholder.com/150'}" alt="user-image">
                        <span>${user.username}</span>
                    </div>
                    <button class="action-connect unblock-btn" data-user-id="${user.id}">Unblock</button>
                `;

                userRow.querySelector(".unblock-btn").addEventListener('click', () => {
                    unblockFriend(user.username, user.id);
                })
        
                userList.appendChild(userRow);
            });
        }

    } catch (error) {
        userList.innerHTML = "<p>Error loading users. Please try again.</p>";
    }
}

async function fetchAndDisplayUsers() {
    const userList = document.getElementById("user-list");

    try {
        const access_token = getCookie('my-token');
        const response = await fetch('/api/users/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if(response.status  === 401)
                logoutUserToken();
        }

        const users = await response.json();

        userList.innerHTML = "";

        if (users.length === 0) {
            userList.innerHTML = `
                <div class="no-friends-message">
                    <p>No users found.</p>
                </div>`;
        } else {
            users.forEach(user => {
                const userRow = document.createElement('div');
                userRow.className = 'user-row';
        
                userRow.innerHTML = `
                    <div class="user-info">
                        <img src="${user.avatar || 'https://via.placeholder.com/150'}" alt="user-image">
                        <span>${user.username}</span>
                    </div>
                    <button class="action-connect connect-btn" data-user-id="${user.id}">Connect</button>
                `;

                userRow.querySelector(".connect-btn").addEventListener('click', async (e) => {
                    const receiverId = e.target.getAttribute('data-user-id');
                    try {
                        const response = await fetch('api/friend-request/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ receiver_id: receiverId }),
                        });
                        const result = await response.json();
                        if (response.ok) {
                            e.target.textContent = "Request Sent";
                            e.target.disabled = true;
                            sendNotification(receiverId, 'friend_request', 'friend_request', result.request_id);
                        } else {
                            if(response.status === 401)
                                logoutUserToken();
                        }
                    } catch (error) {
                        
                    }
                });
        
                userList.appendChild(userRow);
            });
        }
        const overlay = document.getElementById('add-overlay');
        document.getElementById('friend-overlay').style.display = 'none';
        overlay.style.display = 'flex';
        overlay.addEventListener('click', () => {
            overlay.style.display = 'none';
        });

    } catch (error) {
        userList.innerHTML = "<p>Error loading users. Please try again.</p>";
        modal.classList.remove("hidden");
    }
}

async function loadCountries() {
    const response = await fetch('js/country.json'); 
    const countries = await response.json();
    return countries;
}

