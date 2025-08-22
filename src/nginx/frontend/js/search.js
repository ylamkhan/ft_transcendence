function function_to_search() {
    const searchBox = document.getElementById('search-input');
    const resultsDiv = document.querySelector('.search-body');
    searchBox.value = '';
    let allUsers = [];
    resultsDiv.innerHTML = '';

    searchBox.addEventListener('input', () => {
        const query = sanitizeMessage(searchBox.value.toLowerCase());

        if (query.length === 0) {
            resultsDiv.innerHTML = '';
            return;
        }

        if (allUsers.length === 0) {
            fetch(`/api/users/search`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401)
                        logoutUserToken();
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    allUsers = data;
                    filterAndDisplayUsers(query, allUsers, resultsDiv);
                } else {
                }
            })
            .catch(error => {
            });
        } else {
            filterAndDisplayUsers(query, allUsers, resultsDiv);
        }
    });
}

function filterAndDisplayUsers(query, allUsers, resultsDiv) {
    resultsDiv.innerHTML = '';
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(query)
    );

    filteredUsers.forEach(user => {
        const div = document.createElement("div");
        div.classList.add("member");
        div.dataset.userId = user.id;

        div.innerHTML = `
            <img src="${user.avatar}" class="card-img-top search-pr" id="search--pr" alt="${user.username}">
            <div class="card-body1 text-center">
                <h5 class="card-title">${user.username}</h5>
                <div class="progress-info">
                    <span class="card-text-left">LVL 8</span>
                    <span class="card-text-right">75%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 75%;" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            const hash = `#profile/${user.id}`;
            const id = user.id;
            const state = { id };
            history.pushState(state, '', hash);
            fetchUserProfile(user.id);
        });

        resultsDiv.appendChild(div);
    });
}

function fetchUserProfile(userId) {
    const access_token = getCookie('my-token');
	
    fetch(`/api/user/${userId}/profile/`, {
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
        if (data.user_id === userId)
        {
            loadContentInDiv('#profile');
            history.pushState({ section: 'profile' }, '', '#profile');
        }
        else
            displayUserProfile(data, userId);
        const overlay = document.querySelector('.overlay');
        overlay.style.display = 'none';
    })
    .catch(error => {
    });
}

async function displayUserProfile(userData, userId) {
    const sidebar = document.getElementById("sidebar");
    const search_bar_side = document.getElementById("search_bar_side");
    const sidebar2 = document.getElementById("sidebar2");

    sidebar.style.display = "flex";
    sidebar2.style.display = "flex";
    search_bar_side.style.display = "flex";
    const haash = '#profile';
    const route = routes[haash];
    const response = await fetch(route.html);
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
    const html = await response.text();
    document.getElementById('main-content').innerHTML = html;

    if (Array.isArray(route.css)) {
        route.css.forEach(css => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = css;
            link.dataset.route = `#profile/${userId}`;
            document.head.appendChild(link);
        });
    } else if (route.css) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = route.css;
        link.dataset.route = `#profile/${userId}`;
        document.head.appendChild(link);
    }

    document.querySelectorAll('script[data-src]').forEach(script => script.remove());

    if (route.html === 'views/profile.html') {
        const countryCode = userData.country_select;
        const countries = await loadCountries();
        const countryFullName = countries[countryCode] || countryCode;

        document.getElementById('username').textContent = userData.username;
        document.getElementById('bio-pro').textContent = userData.about || "No bio available.";
        document.getElementById('pr-img').src = userData.avatar || 'default-avatar.png';
        document.getElementById('country_select').textContent = countryFullName;

        if (!userData.blocked_you && !userData.is_blocked) {
            document.getElementById('loses-rate').textContent = userData.lose + "%";
            document.getElementById('wins-rate').textContent = userData.win + "%";
            document.getElementById('draws-rate').textContent = userData.draw + "%";
            document.getElementById('win-bar').style.width = userData.win + "%";
            document.getElementById('lose-bar').style.width = userData.lose + "%";
            document.getElementById('draw-bar').style.width = userData.draw + "%";

            drawProgressCircle(userData.level_progress, userData.level);
            displayMatchHistory(userData.match_history || []);
            displayTournamentHistory(userData.tournament_history || []);
            displayAchievements(userData.achievements || []);
        } else {
            document.getElementById('loses-rate').textContent = "NONE";
            document.getElementById('wins-rate').textContent = "NONE";
            document.getElementById('draws-rate').textContent = "NONE";
            document.getElementById('win-bar').style.width = "0%";
            document.getElementById('lose-bar').style.width = "0%";
            document.getElementById('draw-bar').style.width = "0%";
            document.getElementById('bio-pro').textContent = "This user's profile is restricted.";
            const matchList = document.querySelector(".onotoonehistory");
            const tournamentList = document.querySelector(".tournamenthistory");
            const achievementList = document.querySelector(".achievements");
            tournamentList.innerHTML = "<li><h6>No data to display</h6></li>";
            matchList.innerHTML = "<li><h6>No data to display</h6></li>";
            achievementList.innerHTML = "<li><h6>No data to display</h6></li>";
        }

        const buttons = document.querySelector('.prof-buttons');
        const connectbtn = buttons.querySelector(".add-friend-btn");
        const blockbtn = buttons.querySelector(".block-friend-btn");
        const menuBtn = document.querySelector(".menu-icon");
        menuBtn.classList.add('d-none');

        buttons.style.display = 'block';

        if (userData.blocked_you && !userData.is_blocked) {
            connectbtn.classList.add("d-none");
            blockbtn.textContent = "Block";
            blockbtn.addEventListener('click', () => {
                blockFriend(userData.username, userId);
            });
        } else if (userData.is_blocked) {
            connectbtn.classList.add("d-none");
            blockbtn.textContent = "Unblock";
            blockbtn.classList.add("unblock-friend-btn");
            blockbtn.addEventListener('click', () => {
                unblockFriend(userData.username, userId);
            });
        } else if (userData.is_friend) {
            connectbtn.textContent = "Disconnect";
            connectbtn.classList.add("disconnect-friend-btn");
            connectbtn.addEventListener('click', () => {
                disconnectFriend(userData.username, userId);
            });
            blockbtn.addEventListener('click', () => {
                blockFriend(userData.username, userId);
            });
        } else if (userData.invited_you) {
            connectbtn.textContent = "Accept";
            connectbtn.classList.add("accept-friend-btn");
            blockbtn.textContent = "Reject";
            blockbtn.classList.add("reject-friend-btn");
            blockbtn.addEventListener('click', () => {
                rejectFriendRequestandFetch(userData.request_id, userId);
            });
            connectbtn.addEventListener('click', () => {
                acceptFriendRequestandFetch(userData.request_id, userId);
            });
        } else if (userData.is_invited) {
            connectbtn.textContent = "Request Sent";
            connectbtn.classList.add("reqsent-friend-btn");
            connectbtn.disabled = true;
            blockbtn.textContent = "Block";
            blockbtn.classList.add("block-friend-btn");
            blockbtn.addEventListener('click', () => {
                blockFriend(userData.username, userId);
            });
        }
        else
        {
            connectbtn.addEventListener('click', () => {
                sendFriendRequest(userId, connectbtn);
            });
            blockbtn.addEventListener('click', () => {
                blockFriend(userData.username, userId);
            });
        }
    }
}

function sendFriendRequest(receiverId, connectBtn) {
    fetch('api/friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiver_id: receiverId }),
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
    .then(result => {
        if (dkhaltntchecki)
            return;
        if (result.error) {
        } else {
            connectBtn.textContent = "Request Sent";
            connectBtn.disabled = true;
            sendNotification(receiverId, 'friend_request', 'friend_request', result.request_id);
        }
    })
    .catch(error => {
    });
}

function drawProgressCircle(levelProgress, level) {
    const canvas = document.getElementById('progressCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    const startAngle = -Math.PI / 2;
    const fullCircle = Math.PI * 2;
    const circleRadius = 120;
    const lineWidth = 20;
    const levelText = "Level " + level;

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

    drawCircle(levelProgress);
}

function acceptFriendRequestandFetch(requestId, userId) {
    if (!requestId || !userId)
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
            const hash = `#profile/${userId}`;
            const id = userId;
            const state = { id };
            history.pushState(state, '', hash);
            fetchUserProfile(userId);
        } else if (data.error) {
        }
    })
    .catch(error => {
    });
}

function rejectFriendRequestandFetch(requestId, userId) {
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
        if (data.message) {
            const hash = `#profile/${userId}`;
            const id = userId;
            const state = { id };
            history.pushState(state, '', hash);
            fetchUserProfile(userId);
        } else if (data.error) {
        }
    })
    .catch(error => {
    });
}

function disconnectFriend(username, userId) {
    fetch(`/api/disconnect-friend/${username}/`, {
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
        const hash = `#profile/${userId}`;
        const id = userId;
        const state = { id };
        history.pushState(state, '', hash);
        fetchUserProfile(userId);
    })
    .catch(error => {
    });
}

function blockFriend(username, userId) {
    fetch(`/api/block-friend/${username}/`, {
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
        const hash = `#profile/${userId}`;
        const id = userId;
        const state = { id };
        history.pushState(state, '', hash);
        fetchUserProfile(userId);
    })
    .catch(error => {
    });
}

function unblockFriend(username, userId) {
    fetch(`/api/unblock-friend/${username}/`, {
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
        const hash = `#profile/${userId}`;
        const id = userId;
        const state = { id };
        history.pushState(state, '', hash);
        fetchUserProfile(userId);
    })
    .catch(error => {
    });
}

