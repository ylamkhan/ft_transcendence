var userSocket;
var user;
var rpingpongsocket;
var matchmaking;
var tsocket;
var ticsocket;
var rocksocket;
var playerIsActive;
var localsocket;
var dkhaltntchecki = false;

function UserSocket() {
    const value = localStorage.getItem('authTokens');
    const authTokens = JSON.parse(value);
    if (!authTokens)
        return;
    user = authTokens.user.pk;
    userSocket = new WebSocket('wss://' + window.location.host + '/ws/user/' + user + '/');
    const container = document.querySelector(".users");
    
    userSocket.onopen = function () {
        notiflisteners();
        fetchOnlineFriends();
        fetchNotifications();
    };

    userSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.action === 'notification')
        {
            if (data.is_treated)
            {
                const container = document.querySelector(".list-notification");
                const div = document.querySelectorAll('.notification-user-card');
                div.forEach(element => {
                    if (element.classList.contains(`notification_${data.notification_id}`))
                        element.remove();
                });
                checkNotificationList(container);
            }
            if (!data.is_read)
            {
                if (data.type === 'friend_request')
                    displayFReqNotification(data);
                if (data.type === 'match_invitation')
                    displayGReqNotification(data);
                if (data.type === 'message')
                    displayMNotification(data);
                if (data.type === 'tournament_invitation')
                    displayTReqNotification(data);
            }
        }
        else if (data.action === 'status' || data.action === 'connect')
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
        else if (data.action === 'block' || data.action === 'disconnect')
        {
            let userElement = document.querySelector(`.user-${data.id}`);
        
            if (userElement) {
                container.removeChild(userElement);
            }
        }
        else if (data.action === 'decline_match')
        {
            loadContentInDiv('#home');
        }
    };

    userSocket.onclose = function () {
    }; 
}

function displayTReqNotification(notification) {
    const notificationspan = document.querySelector(".notification li span");
    const test = document.querySelectorAll(".notification-user-card");
    const container = document.querySelector(".list-notification");

    notificationspan.style.backgroundColor = "#E51284";
    
    if (test.length === 0) {
        container.innerHTML = '';
    }

    const notificationElement = document.querySelector(`.notification-${notification.game_id}`);
    if (notification.is_treated && notificationElement) {
        container.removeChild(notificationElement);
        checkNotificationList(container);
    } else if (!notification.is_treated) {
        container.prepend(creatNotifReqTourn(notification));
    }
}

function creatNotifReqTourn(data) {
    const container = document.querySelector(".list-notification");
    const div = document.createElement("div");
    div.classList.add("notification-user-card", "notifReqGame", `notification_${data.notification_id}`);
    div.setAttribute('data-notif-id', data.notification_id);
    if (data.is_read)
        div.classList.add('read');
    div.innerHTML = `
        <div class="notification-user-img">
            <img class="avatar" src=${data.sender_avatar}>
        </div>
        <div class="notification-user-content">
            <h5>${data.sender}</h5>
            <p>Tournament request</p>
        </div>
        <div class="notification-choices">
            <button class="notification-btn badge d-flex align-items-center accept-match">
                Accept
                <img src="chat/icons/checkOk.svg" alt="OK">
            </button>
            <button class="notification-btn badge d-flex align-items-center decline-match">
                Decline
                <img src="chat/icons/checkNo.svg" alt="NO">
            </button>
        </div>
    `;
    function handler(entries, observer) {
        for (entry of entries) {
                    
            if (entry.isIntersecting) {
                div.classList.add('read');
                const notifId = div.getAttribute('data-notif-id');
                markNotificationAsRead(notifId);
            }
        }
    }
      
    let observer = new IntersectionObserver(handler);
      
    if (!div.classList.contains('read'))
        observer.observe(div);
    
    div.querySelector(".accept-match").addEventListener('click', function() {
        const notifId = div.getAttribute('data-notif-id');
        markNotificationAsTreated(notifId, true);
        const hash = "#pingpong_tournoi";
        const state = "pingpong_tournoi";
        history.pushState({ section: state }, '', hash);
        loadContentInDiv(hash);
        invited = true;
        invitedId = data.tournament_name;
        div.remove();
        checkNotificationList(container);
    });
    div.querySelector(".decline-match").addEventListener('click', function() {
        const notifId = div.getAttribute('data-notif-id');
        markNotificationAsTreated(notifId, false);
        div.remove();
        checkNotificationList(container);
    });
    return div;
}

function displayGReqNotification(notification) {
    const notificationspan = document.querySelector(".notification li span");
    const test = document.querySelectorAll(".notification-user-card");
    const container = document.querySelector(".list-notification");

    notificationspan.style.backgroundColor = "#E51284";
    
    if (test.length === 0) {
        container.innerHTML = '';
    }

    const notificationElement = document.querySelector(`.notification-${notification.game_id}`);
    if (notification.is_treated && notificationElement) {
        container.removeChild(notificationElement);
        checkNotificationList(container);
    } else if (!notification.is_treated) {
        container.prepend(creatNotifReqGame(notification));
    }
}

function creatNotifReqGame(data) {
    const container = document.querySelector(".list-notification");
    const div = document.createElement("div");
    div.classList.add("notification-user-card", "notifReqGame", `notification_${data.notification_id}`);
    div.setAttribute('data-notif-id', data.notification_id);
    if (data.is_read)
        div.classList.add('read');
    div.innerHTML = `
        <div class="notification-user-img">
            <img class="avatar" src=${data.sender_avatar}>
        </div>
        <div class="notification-user-content">
            <h5>${data.sender}</h5>
            <p>Game request</p>
        </div>
        <div class="notification-choices">
            <button class="notification-btn badge d-flex align-items-center accept-match">
                Accept
                <img src="chat/icons/checkOk.svg" alt="OK">
            </button>
            <button class="notification-btn badge d-flex align-items-center decline-match">
                Decline
                <img src="chat/icons/checkNo.svg" alt="NO">
            </button>
        </div>
    `;
    function handler(entries, observer) {
        for (entry of entries) {
                    
            if (entry.isIntersecting) {
                div.classList.add('read');
                const notifId = div.getAttribute('data-notif-id');
                markNotificationAsRead(notifId);
            }
        }
    }
      
    let observer = new IntersectionObserver(handler);
      
    if (!div.classList.contains('read'))
        observer.observe(div);
    
    div.querySelector(".accept-match").addEventListener('click', function() {
        const notifId = div.getAttribute('data-notif-id');
        markNotificationAsTreated(notifId, true);
        const hash = "#pingpong_remote";
        const state = "pingpong_remote";
        history.pushState({ section: state }, '', hash);
        loadContentInDiv(hash);
        invited = true;
        invitedId = data.game_id;
        div.remove();
        checkNotificationList(container);
    });
    div.querySelector(".decline-match").addEventListener('click', function() {
        const notifId = div.getAttribute('data-notif-id');
        markNotificationAsTreated(notifId, false);
        div.remove();
        checkNotificationList(container);
    });
    return div;
}

function displayMNotification(notification) {
    const notificationspan = document.querySelector(".notification li span");
    const test = document.querySelectorAll(".notification-user-card");
    const container = document.querySelector(".list-notification");

    notificationspan.style.backgroundColor = "#E51284";
    
    if (test.length === 0) {
        container.innerHTML = '';
    }

    const notificationElement = document.querySelector(`.notification-${notification.message_id}`);
    if (notification.is_treated && notificationElement) {
        container.removeChild(notificationElement);
        checkNotificationList(container);
    } else if (!notification.is_treated) {
        container.prepend(creatNotifMessage(notification));
    }

    // container.prepend(creatNotifReqFriend(notification.message));
}

function displayFReqNotification(notification) {
    const notificationspan = document.querySelector(".notification li span");
    const test = document.querySelectorAll(".notification-user-card");
    const container = document.querySelector(".list-notification");

    notificationspan.style.backgroundColor = "#E51284";
    
    if (test.length === 0) {
        container.innerHTML = '';
    }

    const notificationElement = document.querySelector(`.notification-${notification.request_id}`);
    if (notification.is_treated && notificationElement) {
        container.removeChild(notificationElement);
        checkNotificationList(container);
    } else if (!notification.is_treated) {
        container.prepend(creatNotifReqFriend(notification));
    }
    
}

function checkNotificationList(container) {
    const listnotification = document.querySelector(".show-notification");
    const test = document.querySelectorAll(".notification-user-card");
    
    if (test.length == 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <h5>No Notifications Yet</h5>
            </div>
        `;
        const notificationspan = document.querySelector(".notification li span");
        notificationspan.style.backgroundColor = "#ABADC7";  
        setTimeout(() => {
            listnotification.classList.add('d-none');
        }, 500);
        return 0;
    }
    return 1;
}

function creatNotifMessage(data){
    const div = document.createElement("div");
    div.classList.add("notification-user-card", "notifMessage", `notification-${data.message_id}`, `notification_${data.notification_id}`);
    div.setAttribute('data-notif-id', data.notification_id);
    if (data.is_read)
        div.classList.add('read');

    div.innerHTML = `
        <div class="notification-user-img">
            <img class="avatar" src="${data.sender_avatar}">
        </div>
        <div class="notification-user-content">
            <h5>${data.sender}</h5>
            <p>${data.message}</p>
        </div>
        <div class="notification-choices join">
            <button class="message-notification-btn badge d-flex align-items-center" data-message-id="${data.message_id}">
                Respond
                <img src="chat/icons/goToconvIcon.svg" alt="respond">
            </button>
        </div>
    `;
    function handler(entries, observer) {
        for (entry of entries) {
                    
            if (entry.isIntersecting) {
                div.classList.add('read');
                const notifId = div.getAttribute('data-notif-id');
                markNotificationAsRead(notifId);
            }
        }
    }
      
    let observer = new IntersectionObserver(handler);
      
    if (!div.classList.contains('read'))
        observer.observe(div);
    div.querySelector(".join").addEventListener('click', function() {
        const messageId = div.querySelector(".message-notification-btn").getAttribute('data-user-id');
        loadContentInDiv("#chat");
        document.querySelectorAll(".chat").forEach(element => {
            setActive(element);
        });
        div.remove();
        checkNotificationList(container);
        setTimeout(function () {
            joinChat(data.sender_id);
        }, 100);
    });
    return div;
}

function creatNotifReqFriend(request) {
    const container = document.querySelector(".list-notification");
    const div = document.createElement("div");
    div.classList.add("notification-user-card", "notifReqFriend", `notification-${request.request_id}`, `notification_${request.notification_id}`);
    div.setAttribute('data-notif-id', request.notification_id);
    if (request.is_read)
        div.classList.add('read');
    div.innerHTML = `
        <div class="notification-user-img">
            <img class="avatar" src="${request.sender_avatar}">
        </div>
        <div class="notification-user-content">
            <h5>${request.sender}</h5>
            <p>Friend request</p>
        </div>
        <div class="notification-choices">
            <button class="notification-btn notification-btn-confirm badge d-flex align-items-center" data-user-id="${request.request_id}">
                Accept
                <img src="chat/icons/checkOk.svg" alt="OK">
            </button>
            <button class="notification-btn notification-btn-delete badge d-flex align-items-center" data-user-id="${request.request_id}">
                Reject
                <img src="chat/icons/checkNo.svg" alt="NO">
            </button>
        </div>
    `;

    function handler(entries, observer) {
        for (entry of entries) {
                    
            if (entry.isIntersecting) {
                div.classList.add('read');
                const notifId = div.getAttribute('data-notif-id');
                markNotificationAsRead(notifId);
            }
        }
    }
      
    let observer = new IntersectionObserver(handler);
      
    if (!div.classList.contains('read'))
        observer.observe(div);

    div.querySelector(".notification-btn-confirm").addEventListener('click', (e) => {
        const reqId = div.querySelector(".notification-btn-confirm").getAttribute('data-user-id');
        div.remove();
        acceptFriendRequest(reqId);
        checkNotificationList(container);
    });
    div.querySelector(".notification-btn-delete").addEventListener('click', (e) => {
        const reqId = div.querySelector(".notification-btn-delete").getAttribute('data-user-id');
        div.remove();
        rejectFriendRequest(reqId);
        checkNotificationList(container);
    });
    return div;
}

function notiflisteners() {
    const notificationButton = document.querySelector(".notification li");
    const listnotification = document.querySelector(".show-notification");
    
    notificationButton.addEventListener('click', (event) => {
        // fetchNotifications();
        listnotification.classList.toggle("d-none");
        const notificationspan = document.querySelector(".notification li span");
        notificationspan.style.backgroundColor = "#ABADC7";
        checkNotificationList(listnotification);
    });
}

async function sendNotification(receiverId, type, message, request_id) {
    userSocket.send(
        JSON.stringify({
            action: "send_notification",
            receiver_id: receiverId,
            type: type,
            message: message,
            request_id: request_id,
        })
    );
}

function fetchNotifications() {
    const access_token = getCookie('my-token');
    
    fetch('/api/get-notifications/', {
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
        if (data.notifications.length != 0) {
            data.notifications.forEach(notification => {
                if (notification.type === 'friend_request')
                    displayFReqNotification(notification);
                if (notification.type === 'match_invitation')
                    displayGReqNotification(notification);
                if (notification.type === 'message')
                    displayMNotification(notification);
            });
            if (data.all_read)
                document.querySelector(".notification li span").style.backgroundColor = "#ABADC7";
        } 
    })
    .catch(error => {
    });
}

function markNotificationAsTreated(notification_id, accept) {
      const access_token = getCookie('my-token');
      fetch('/api/mark-notification-treated/', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notification_id: notification_id, accept: accept }),
      })
      .then(response => {
        if (!response.ok) {
            if(response.status === 401)
                logoutUser();
        }
        return response.json();
    })
      .then(data => {
    
      })
      .catch(error => {
    });
}

function markNotificationAsRead(notification_id) {
    const access_token = getCookie('my-token');
    fetch('/api/mark-notification-read/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_id: notification_id }),
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