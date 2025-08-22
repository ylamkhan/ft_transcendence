let OnlineSocket;

function onlineSocket() {
    OnlineSocket = new WebSocket('wss://' + window.location.host + '/ws/onlinefriends/');
    const container = document.querySelector(".users");
    
    OnlineSocket.onopen = () => {
        updateStatus(true);
        fetchOnlineFriends();
    };

    OnlineSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === "update")
        {
            const userId = data.id;
            const status = data.status;
            container.classList.remove('d-none');
        
            let userElement = document.querySelector(`.user-${userId}`);
        
            if (status) {
                if (!userElement) {
                    userElement = createOnlineUser(data);
                    container.appendChild(userElement);
                }
            } else {
                if (userElement) {
                    container.removeChild(userElement);
                }
            }
        }
        else
        {
            let userElement = document.querySelector(`.user-${data.id}`);
            if (userElement) {
                container.removeChild(userElement);
            }
        }
    };

    OnlineSocket.onclose = () => {
        updateStatus(false);
    };

    OnlineSocket.onerror = (error) => {
    };

    window.addEventListener('beforeunload', () => {
        updateStatus(false);
    });    
}

function createOnlineUser(data) {
    const li = document.createElement("li");
    li.className = `user-${data.id}`;
    li.innerHTML = `
        <a>
            <i><img src="${data.avatar}" alt="${data.username}"></i>
            <span>${data.username}</span>
        </a>
    `;
    return li;
}

function updateStatus(isOnline) {
    if (userSocket)
        userSocket.send(JSON.stringify({ status: isOnline, action: "updateStatus" }));
}

function fetchOnlineFriends() {
    const access_token = getCookie('my-token');
    
    fetch('/api/get-online-friends/', {
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
        const container = document.querySelector(".users");
        container.innerHTML = '';
        container.classList.remove('d-none');
        if (data.friends.length != 0) {
            data.friends.forEach(user => {
                let userElement = document.querySelector(`.user-${user.id}`);
    
                if (!userElement) {
                    userElement = createOnlineUser(user);
                    container.appendChild(userElement);
                }
            });
        }
    })
    .catch(error => {
    });
}