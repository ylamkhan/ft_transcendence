function mychat() {
    const chatsTab = document.getElementById("chats-tab");
    const friendsTab = document.getElementById("friends-tab");
    const chatsContent = document.getElementById("chats-content");
    const friendsContent = document.getElementById("friends-content");
    const smallChats = document.querySelectorAll('.small-screen-chat');

    const toggleTabs = (tabToActivate, contentToActivate, otherTab, otherContent) => {
        tabToActivate.classList.add("active");
        contentToActivate.classList.add("active");
        otherTab.classList.remove("active");
        otherContent.classList.remove("active");
    };

    chatsTab.addEventListener("click", () => {
        toggleTabs(chatsTab, chatsContent, friendsTab, friendsContent);
    });

    friendsTab.addEventListener("click", () => {
        toggleTabs(friendsTab, friendsContent, chatsTab, chatsContent);
    });

    const messageInput = document.getElementById('messageInput');
    if (messageInput && !messageInput.disabled && messageInput.style.display !== 'none') {
        messageInput.focus();
    }

    document.getElementById('emojiButton').addEventListener('click', function () {
        var emojiList = document.getElementById('emojiList');
        emojiList.style.display = emojiList.style.display === 'block' ? 'none' : 'block';
    });

    document.querySelectorAll('.emoji').forEach(function (emoji) {
        emoji.addEventListener('click', function () {
            var emojiValue = emoji.getAttribute('data-emoji');
            var messageInput = document.getElementById('messageInput');
            messageInput.value += emojiValue;
            document.getElementById('emojiList').style.display = 'none';
        });
    });
}
var chatsocket;

function chatSocket() {
    chatsocket = new WebSocket('wss://' + window.location.host + '/ws/chat-server/');

    chatsocket.onopen = function () {
        fetchchats();
        fetchFriends();
        window.addEventListener('resize', function () {
            const chatsContent = document.getElementById('chats-content');
            const friendsContent = document.getElementById('friends-content');
            if (chatsContent) {
                const chatItems = chatsContent.querySelectorAll('.user-item');
                chatItems.forEach(chatItem => {
                    updateChatLayoutOnResize(chatItem);
                });
            }
            if (friendsContent) {
                const friendsItems = friendsContent.querySelectorAll('.user-item');
                friendsItems.forEach(friendItem => {
                    updateChatLayoutOnResize(friendItem);
                });
            }
        });
    };

    chatsocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_status') {
            changeFriendStatus(data);
        } else if (data.type === 'send_message_success') {
            fetchchats();
        } else if (data.type === 'join_chat_success') {
            fetchTargetDiscussion(data.target_user_id, data.target_status);
        } else if (data.type === 'chat_message') {
            appendMessage(data);
            fetchchats();
        } else if (data.type === 'error') {
        }
    };

    chatsocket.onclose = function () {
    };
}

function changeFriendStatus(data) {
    const headerStatus = document.querySelector('.header-status');

    if (headerStatus) {
        const userId = headerStatus.getAttribute('data-user-id');
        if (userId === data.id)
            headerStatus.textContent = '';
        headerStatus.textContent = data.status;
        if (data.status === 'online')
            headerStatus.classList.remove('offline');
        else
            headerStatus.classList.remove('online');

        headerStatus.classList.add(data.status);
    }
}

function appendMessage(data) {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'incoming');
    if (data.is_read)
        messageElement.classList.add('read');
    messageElement.setAttribute('data-message-id', data.message_id);

    const timestamp = new Date(data.timestamp);
    const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    messageElement.innerHTML = `
        <img class="user-avatar" src="${data.sender_avatar}" alt="${data.sender_id}" data-sender-id="${data.sender_id}">
        <div class="message-text incoming">
            <p>${data.content}</p>
            <span class="message-time">${time}</span>
        </div>  
    `;

    const avatarImg = messageElement.querySelector('.user-avatar');
    avatarImg.addEventListener('click', function () {
        const senderId = parseInt(avatarImg.getAttribute('data-sender-id'), 10);
        const hash = `#profile/${senderId}`;
        const id = senderId;
        const state = { id };
        history.pushState(state, '', hash);
        fetchUserProfile(senderId);
    });

    function handler(entries, observer) {
        for (entry of entries) {

            if (entry.isIntersecting) {
                messageElement.classList.add('read');
                markMessageAsRead(data.message_id);
            }
        }
    }

    let observer = new IntersectionObserver(handler);

    if (!messageElement.classList.contains('read'))
        observer.observe(messageElement);

    messagesContainer.appendChild(messageElement);
}

function fetchTargetDiscussion(targetId, targetStatus) {
    const access_token = getCookie('my-token');

    fetch(`/api/targetuser/${targetId}/discussion/`, {
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
            const messages = data.messages;
            const targetUsername = data.target_username;
            const targetAvatar = data.target_avatar;
            const header = document.querySelector('.chat-header');
            const conversations = document.querySelector('.conversation-area');
            const emptyconversation = document.querySelector('.empty-conversation');

            document.querySelector('.header-name').innerText = targetUsername;
            document.querySelector('.header-avatar').src = targetAvatar;
            const blockuser = document.querySelector('.block-user');
            const menuBtn = document.querySelector(".menu-btn");
            const dropdownMenu = document.querySelector(".dropdown-menu");
            blockuser.addEventListener('click', function () {
                blockUser(targetUsername);
                dropdownMenu.classList.add("hidden");
            });

            menuBtn.addEventListener("click", () => {
                dropdownMenu.classList.remove("hidden");
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest(".menu-icon")) {
                    dropdownMenu.classList.add("hidden");
                }
            });

            document.getElementById("invite-user").addEventListener("click", () => {
                fetchInviteUsers();
                const overlay = document.getElementById('friend-invite-overlay');
                overlay.style.display = 'flex';
                overlay.addEventListener('click', () => {
                    overlay.style.display = 'none';
                });
                dropdownMenu.classList.add("hidden");
            });

            const statusElement = document.querySelector('.header-status');
            statusElement.setAttribute('data-user-id', data.user_id);
            statusElement.textContent = targetStatus;
            statusElement.classList.add(targetStatus);

            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';

            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                messageElement.classList.add(message.is_sent ? 'outgoing' : 'incoming');
                if (message.is_read)
                    messageElement.classList.add('read');
                messageElement.setAttribute('data-message-id', message.message_id);
                const timestamp = new Date(message.timestamp);
                const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                messageElement.innerHTML = `
                <img class="user-avatar" src="${message.sender_avatar}" alt="${message.sender}" data-sender-id="${message.sender_id}">
                <div class="message-text ${message.is_sent ? 'outgoing' : 'incoming'}">
                    <p>${message.content}</p>
                    <span class="message-time">${time}</span>
                </div>
            `;
                const avatarImg = messageElement.querySelector('.user-avatar');
                avatarImg.addEventListener('click', function () {
                    const senderId = parseInt(avatarImg.getAttribute('data-sender-id'), 10);
                    const hash = `#profile/${senderId}`;
                    const id = senderId;
                    const state = { id };
                    history.pushState(state, '', hash);
                    fetchUserProfile(senderId);
                });

                function handler(entries, observer) {
                    for (entry of entries) {

                        if (entry.isIntersecting) {
                            messageElement.classList.add('read');
                            markMessageAsRead(message.message_id);
                        }
                    }
                }

                let observer = new IntersectionObserver(handler);

                if (messageElement.classList.contains('incoming') && !messageElement.classList.contains('read'))
                    observer.observe(messageElement);
                messagesContainer.appendChild(messageElement);
            });
            header.classList.remove('d-none');
            conversations.classList.remove('d-none');
            emptyconversation.classList.add('d-none');
            const chatsTab = document.getElementById("chats-tab");
            const friendsTab = document.getElementById("friends-tab");
            const chatsContent = document.getElementById("chats-content");
            const friendsContent = document.getElementById("friends-content");

            fetchchats();
            chatsTab.classList.add("active");
            chatsContent.classList.add("active");
            friendsTab.classList.remove("active");
            friendsContent.classList.remove("active");
            document.getElementById('sendButton').addEventListener('click', sendMessage);
            document.getElementById('messageInput').addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    sendMessage();
                }
            });        

            function sendMessage() {
                var messageInput = document.getElementById('messageInput');
                var messageText = messageInput.value.trim();
            
                if (messageText) {
                    messageInput.value = '';
                    var sanitizedMessageText = sanitizeMessage(messageText);
            
                    var currentTime = new Date();
                    var year = currentTime.getFullYear();
                    var month = currentTime.getMonth() + 1;
                    var day = currentTime.getDate();
                    var hours = currentTime.getHours();
                    var minutes = currentTime.getMinutes();
                    var seconds = currentTime.getSeconds();
            
                    month = month < 10 ? "0" + month : month;
                    day = day < 10 ? "0" + day : day;
                    hours = hours < 10 ? "0" + hours : hours;
                    minutes = minutes < 10 ? "0" + minutes : minutes;
                    seconds = seconds < 10 ? "0" + seconds : seconds;
                    
                    var timestamp = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
                    var messageData = {
                        type: 'send_message',
                        content: sanitizedMessageText,
                        target_user_id: targetId,
                        timestamp: timestamp
                    };
                    
                    chatsocket.send(JSON.stringify(messageData));
                    
                    var timeString = hours + ":" + (minutes < 10 ? "0" + minutes : minutes);
                    var newMessageDiv = document.createElement('div');
                    newMessageDiv.classList.add('message');
                    newMessageDiv.classList.add('outgoing');
                    newMessageDiv.innerHTML = `
                        <img class="user-avatar" src="${data.user_avatar}" alt="${data.user_username}" data-sender-id="${data.user_id}">
                        <div class="message-text outgoing">
                            <p>${sanitizedMessageText}</p>
                            <span class="message-time">${timeString}</span>
                        </div>
                    `;
            
                    const avatarImg = newMessageDiv.querySelector('.user-avatar');
                    avatarImg.addEventListener('click', function () {
                        const senderId = parseInt(avatarImg.getAttribute('data-sender-id'), 10);
                        const hash = `#profile/${senderId}`;
                        const id = senderId;
                        const state = { id };
                        history.pushState(state, '', hash);
                        fetchUserProfile(senderId);
                    });
            
                    messagesContainer.appendChild(newMessageDiv);
            
                    const userElement = document.querySelector(`.user-id-${targetId}`);
                    if (userElement) {
                        const messagePreview = userElement.querySelector('.message-preview');
                        if (messagePreview) {
                            messagePreview.textContent = sanitizedMessageText;
                        }
                    }
                }
            }
            

        })
        .catch(error => {
		});
}

function checkVisible(elm) {
    var rect = elm.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

function fetchInviteUsers() {
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
            const friendsList = document.getElementById('friend-invite-list');
            friendsList.innerHTML = '';

            if (data.friends.length === 0) {
                friendsList.innerHTML = `
                <div class="no-friends-message">
                    <p>You have no friends yet.</p>
                    <button id="add-friends-btn" class="btn btn-primary">Add Friends</button>
                </div>
            `;

                document.getElementById('add-friends-btn').onclick = function () {
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

                    userRow.querySelector(".invite-btn").onclick = function () {
                        const hash = "#pingpong_remote";
                        const state = "pingpong_remote";
                        history.pushState({ section: state }, '', hash);
                        loadContentInDiv(hash);
                        invited = true;
                        invitedId = user.id;
                    };

                    friendsList.appendChild(userRow);
                });
            }
        })
        .catch(error => {
			// console.error('Error loading user profile:', error);
		});}

function blockUser(username) {
    const access_token = getCookie('my-token');
    fetch(`/api/block-friend/${username}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
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
        })
        .catch(error => {
        });
}

function fetchchats() {
    const access_token = getCookie('my-token');

    fetch('/api/get-chats/', {
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
            const chatsContent = document.getElementById('chats-content');

            if (data.chats.length !== 0) {
                chatsContent.innerHTML = '';
                data.chats.forEach(chat => {
                    appendChat(chat, chatsContent);
                });
            }
        })
        .catch(error => {
		});
}

function fetchFriends() {
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
            friendsContent = document.getElementById('friends-content');
            if (data.friends.length != 0) {
                data.friends.forEach(friend => {
                    appendFriend(friend, friendsContent);
                });
            }
        })
        .catch(error => {
		});
}

function appendFriend(friend, friendsContent) {
    const li = document.createElement('li');
    li.classList.add('user-item');
    li.setAttribute('data-friend-id', friend.id);

    const userInfo = document.createElement('div');
    userInfo.classList.add('user-info');

    const img = document.createElement('img');
    img.classList.add('user-avatar');
    img.src = friend.avatar || '../images/avatars/avatar1.png';
    img.alt = `${friend.username} Avatar`;

    const userNameDiv = document.createElement('div');
    userNameDiv.classList.add('user-avatar-name');

    const h3 = document.createElement('h3');
    h3.classList.add('user-name');
    h3.textContent = friend.username || 'User 1';

    userNameDiv.appendChild(h3);
    userInfo.appendChild(img);
    userInfo.appendChild(userNameDiv);
    li.appendChild(userInfo);
    friendsContent.appendChild(li);
    updateChatLayoutOnResize(li);
}

function joinChat(targetUserId) {
    const joinData = {
        type: 'join_chat',
        target_user_id: targetUserId
    };
    if (chatsocket)
        chatsocket.send(JSON.stringify(joinData));
}

// function sendMessage(targetUserId, content) {
//     const messageData = {
//         type: 'send_message',
//         target_user_id: targetUserId,
//         content: content
//     };

//     socket.send(JSON.stringify(messageData));
// }

function appendChat(chat, chatsContent) {
    const li = document.createElement('li');
    li.classList.add('user-item');
    li.classList.add(`user-id-${chat.other_user_id}`);
    li.setAttribute('data-friend-id', chat.other_user_id);

    const userInfo = document.createElement('div');
    userInfo.classList.add('user-info');

    const img = document.createElement('img');
    img.classList.add('user-avatar');
    img.src = chat.other_user_avatar || '../images/avatars/avatar1.png';
    img.alt = `${chat.other_user_username} Avatar`;

    const userNameDiv = document.createElement('div');
    userNameDiv.classList.add('user-avatar-name');

    const h3 = document.createElement('h3');
    h3.classList.add('user-name');
    h3.textContent = chat.other_user_username || 'User 1';

    const messagePreview = document.createElement('p');
    messagePreview.classList.add('message-preview');
    messagePreview.textContent = chat.last_message;

    userNameDiv.appendChild(h3);
    userNameDiv.appendChild(messagePreview);

    userInfo.appendChild(img);
    userInfo.appendChild(userNameDiv);

    const userMeta = document.createElement('div');
    userMeta.classList.add('user-meta');

    const notificationCount = document.createElement('span');
    notificationCount.classList.add('notification-count');
    notificationCount.textContent = chat.unread_messages || '0';
    if (chat.unread_messages === 0)
        notificationCount.classList.add('d-none');

    const messageDate = document.createElement('span');
    if (chat.last_message_timestamp === null)
        messageDate.classList.add('d-none');
    messageDate.classList.add('message-date');
    const timestamp = new Date(chat.last_message_timestamp);
    timestamp.setHours(timestamp.getHours() - 1);
    const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    messageDate.textContent = time || '';
    userMeta.appendChild(notificationCount);
    userMeta.appendChild(messageDate);

    li.appendChild(userInfo);
    li.appendChild(userMeta);

    chatsContent.insertBefore(li, chatsContent.firstChild);
    updateChatLayoutOnResize(li);
}

function updateChatLayoutOnResize(li) {
    const roomConversation = document.querySelector('.room-conversions');
    const listUsers = document.querySelector('.list-users');
    const expand = document.querySelector('.expand-sidebar-chat');
    if (window.innerWidth <= 602) {
        li.classList.add('small-screen-chat');
        li.addEventListener('click', function () {
            const friendId = li.getAttribute('data-friend-id');

            listUsers.style.display = 'none';
            roomConversation.classList.add('display_flex');
            expand.classList.remove('d-none');
            expand.addEventListener('click', function () {
                listUsers.style.display = 'flex';
                roomConversation.classList.remove('display_flex');
                expand.classList.add('d-none');
            });
            joinChat(friendId);
        });
    } else {
        expand.classList.add('d-none');
        listUsers.style.display = 'flex';
        if (roomConversation.classList.contains('display_flex'))
            roomConversation.classList.remove('display_flex');
        li.classList.remove('small-screen-chat');
        li.addEventListener('click', function () {
            const friendId = li.getAttribute('data-friend-id');
            joinChat(friendId);
        });
    }
}

function markMessageAsRead(messageId) {
    if (!messageId)
        return;
    const access_token = getCookie('my-token');
    fetch('/api/mark-message-read/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message_id: messageId }),
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
            fetchchats();
            document.querySelector(`[data-message-id="${messageId}"]`).classList.add('read');
        })
        .catch(error => {
		});
}