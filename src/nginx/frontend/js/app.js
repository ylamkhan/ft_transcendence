const overlay = document.getElementById('overlay');
const searchDiv = document.querySelector('.search-div');
const searchButton = document.getElementById('search-button');
const cardWraps = document.querySelectorAll('.card-wrap');
const contentToShow = document.getElementById('content-to-show');
const smallMenu = document.querySelector('.small-menu');

if (overlay) {
    overlay.addEventListener('click', () => {
        overlay.querySelector("#search-input").value = "";
        overlay.querySelector(".search-body").innerHTML = "";
        overlay.style.display = 'none';
        if (contentToShow) {
            contentToShow.classList.add('hidden');
        }
    });
} else {
    // console.error('Element with ID "overlay" not found');
}

if (searchButton) {
    searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (overlay) {
            overlay.style.display = 'flex';
        }
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
        function_to_search();
    });
} else {
    // console.error('Element with ID "search-button" not found');
}

if (searchDiv) {
    searchDiv.addEventListener('click', (event) => {
        event.stopPropagation();
    });
} else {
    // console.error('Element with class "search-div" not found');
}

document.querySelector('.expand-sidebar').addEventListener('click', function () {
    var sidebar = document.querySelector('.sidebar');
    var expandIcon = document.getElementById('expand-icon');

    if (sidebar.classList.contains('opened-side')) {
        expandIcon.src = ' images/menu-icons/expand_right.svg';
        expandIcon.alt = 'expand-sidebar';
        sidebar.classList.remove('opened-side');
    } else {
        expandIcon.src = ' images/menu-icons/expand_left.svg';
        expandIcon.alt = 'collapse-sidebar';
        sidebar.classList.add('opened-side');
    }
});

const gamesContainer = document.querySelector('.games');
let isDragging = false;
let startX;
let scrollLeft;

if (gamesContainer) {
    gamesContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {  // Detect vertical scroll
            e.preventDefault();  // Prevent the default vertical scroll
            gamesContainer.scrollLeft += e.deltaY;  // Scroll horizontally instead of vertically
        }
    });


}



// -=============================================-=============================================-=============================================-=============================================-=============================================

//  ------------------------------------------------------------------------------------------------ logout without tooken ----  -------




function activateMenuSelector() {
    const gamingHash = ["#levels", "#pingpong_ai", "#pingpong_remote", "#pingpong_tournoi", "#rock_ai", "#rock_local", "#rock_remote", "#tictactoe_local", "#tictactoe_remote", "#tictactoe_ai"];
    const currentHash = window.location.hash;
    function activateElement(menuSelector, elementClass) {
        var menu = document.querySelector(menuSelector);
        var element = menu.querySelector(elementClass);
        if (element) {
            setActive(element);
        }
    }

    if (currentHash === "#chat") {
        activateElement(".menu", ".chat");
    }
    if (currentHash === "#profile") {
        activateElement(".menu", ".my-profile");
    }
    if (currentHash === "#setting") {
        activateElement(".menu", ".settings");
    }
    if (currentHash === "#home") {
        activateElement(".menu", ".home");
    }
    if (currentHash === "#gaming") {
        activateElement(".menu", ".gaming");
    }
    if (gamingHash.includes(currentHash)) {
        activateElement(".menu", ".gaming");
    }

}

//  -------------------------------------------------------------------------------------------------------



// ----------------------logout ----------------------------------


function logoutUser() {
    fetch('/api/logout/', {
        method: 'POST',
    })
        .then(response => {
            if (response.ok) {

                const access_token_cookie = 'my-token';
                const refresh_token_cookie = 'my-refresh-token';

                deleteCookie(access_token_cookie);
                deleteCookie(refresh_token_cookie);

                localStorage.removeItem('authTokens');
                window.location.hash = "#login";
            } else {
                if (response.status === 401)
                    logoutUserToken();
            }
        })
        .catch(error => {
            // console.error('Erreur:', error);
        });
}


// ------------------------------------------------------------------ verification_access_refresh_token ------------------------------------------------------------------------------------------------
//   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function loadUserdata_side() {

    const access_token = getCookie('my-token');

    fetch('/api/user/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401)
                    logoutUserToken();
            }
            return response.json();
        })
        .then(userData => {
            document.getElementById('photo1').src = userData.avatar;
            document.getElementById('username1').textContent = userData.username;
            const dailyWinningRates = userData.daily_winning_rates;

            if (dailyWinningRates && dailyWinningRates.labels && dailyWinningRates.rates) {
                const labels = dailyWinningRates.labels;
                const rates = dailyWinningRates.rates;
                drawLineChart(labels, rates);
            }
        })
        .catch(error => {
        });

}

loadUserdata_side();
//-------------------------- --------------------------------------------------------------------------------------------- first ---------------------------------------------------------------------------------------------

document.querySelectorAll('.settings').forEach(element => {
    element.addEventListener('click', (event) => {
        event.preventDefault();
        history.pushState({ section: 'setting' }, '', '#setting');
        loadContentInDiv('#setting');

    });
});

document.querySelectorAll('.chat').forEach(element => {
    element.addEventListener('click', (event) => {
        event.preventDefault();
        history.pushState({ section: 'chat' }, '', '#chat');
        loadContentInDiv('#chat');

    });
});

document.querySelectorAll('.my-profile').forEach(element => {
    element.addEventListener('click', (event) => {
        event.preventDefault();

        history.pushState({ section: 'profile' }, '', '#profile');
        loadContentInDiv('#profile');

    });
});

document.querySelectorAll('.gaming').forEach(element => {
    element.addEventListener('click', (event) => {
        event.preventDefault();

        history.pushState({ section: 'gaming' }, '', '#gaming');
        loadContentInDiv('#gaming');


    });
});


document.querySelectorAll('.home').forEach(element => {

    element.addEventListener('click', (event) => {
        event.preventDefault();

        history.pushState({ section: 'home' }, '', '#home');
        loadUserdata_side();
        loadContentInDiv('#home');


    });
});

document.querySelectorAll('.overlay').forEach(element => {
    element.addEventListener('click', (event) => {
        document.querySelector('.overlay').style.display = 'none';
    });
});

document.querySelectorAll('.logoutUser').forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
});


document.querySelectorAll(".me-auto").forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState({ section: 'home' }, '', '#home');
        activateMenuSelector();
        UserSocket();
        loadUserdata_side();
        loadContentInDiv('#home');

    });
});