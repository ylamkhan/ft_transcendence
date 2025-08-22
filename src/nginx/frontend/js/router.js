function slideHome() {
    const slider = document.querySelector('.slider .list');
    const items = document.querySelectorAll('.slider .list .item');
    const next = document.getElementById('next');
    const prev = document.getElementById('prev');
    const dots = document.querySelectorAll('.slider .dots li');

    // Check if essential elements are not null
    if (!slider || items.length === 0 || !next || !prev || dots.length === 0) {
        return; // Stop execution if any required element is missing
    }

    const lengthItems = items.length - 1;
    let active = 0;

    next.onclick = function () {
        active = active + 1 <= lengthItems ? active + 1 : 0;
        reloadSlider();
    }

    prev.onclick = function () {
        active = active - 1 >= 0 ? active - 1 : lengthItems;
        reloadSlider();
    }

    let refreshInterval = setInterval(() => { next.click() }, 5000);

    function reloadSlider() {
        slider.style.transform = 'translateX(' + (-active * 100) + '%)';

        const last_active_dot = document.querySelector('.slider .dots li.active');
        if (last_active_dot) {
            last_active_dot.classList.remove('active');
        }

        dots[active].classList.add('active');

        clearInterval(refreshInterval);
        refreshInterval = setInterval(() => { next.click() }, 5000);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', function () {
            active = index;
            reloadSlider();
        });
    });

    window.onresize = function () {
        reloadSlider();
    };


}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

const routes = {
    "#login": {
        html: "views/login.html",
        css: "css/login.css",
    },
    "#register": {
        html: "views/register.html",
        css: "css/register.css",
    },
    "#check_pass": {
        html: "views/check_pass.html",
        css: "css/check_pass.css",
    },
    "#reset_pass": {
        html: "views/reset_pass.html",
        css: "css/reset_pass.css",
    },
    "#home": {
        html: "views/home.html",
        css: [
            "images/logo.ico",
            "chat/css/chat.css",
            "css/bell-sun.css",
            "css/gaming.css",
            "css/nav.css",
            "css/skew.css",
            "css/cards.css",
            "css/online.css",
            "css/slide.css",
            "css/chatbot.css",
            "css/levels.css",
            "css/search.css",
            "css/styles.css",
            "css/loader.css",
            "css/setting.css",
            "css/tour.css",
            "css/game.css",
            "css/rank.css",
            "css/side.css",
            "css/home.css",
            "css/chart.css",
        ],
        js: ["js/app.js", "js/slide.js"],
    },
    "#setting": {
        html: "views/setting.html",
        css: "css/setting.css",
        js: "js/app.js",
    },
    "#profile": {
        html: "views/profile.html",
        css: ["css/profile.css", "css/friend.css"],
        js: "js/app.js",
    },
    "#errorPage": {
        html: "views/errorPage.html",
        css: "css/errorPage.css",
    },
    "#gaming": {
        html: "views/gaming.html",
        css: [
            "css/gaming.css",
            "game/css/tic.css",
            "game/css/rock.css",
            "game/css/rock_local.css",
            "game/css/tic_local.css",
            "game/css/tic_remote.css",
            "game/css/ping_remote.css",
            "game/css/rock_remote.css",
            "game/css/ping_tourn.css",
            'game/css/tourn-list.css',
            "game/css/ping_local.css",
            "css/friend.css",
        ],
        js: [
            "game/js/three.min.js",
            "game/js/keyboard.js",
            "game/js/pingpong_ia.js",
            "game/js/pingpong_remote.js",
            "game/js/pinppong_local.js",
            "game/js/pingpong_tournremote.js",
            "game/js/pingpong_tournlocal.js",
            "game/js/pingpong_tourn.js",
            "game/js/rock_ai.js",
            "game/js/rock_local.js",
            "game/js/rock_remote.js",
            "game/js/tic_ai.js",
            "game/js/tic_local.js",
            "game/js/tic_remote.js",
            "game/js/game.js",
            "js/app.js",
        ],
    },
    "#pingpong_ai": {
        html: "views/pingpong_ai.html",
    },
    "#pingpong_remote": {
        html: "views/pingpong_remote.html",
    },
    "#pingpong_tournoi": {
        html: "views/pingpong_tournoi.html",
    },
    "#pingpong_local": {
        html: "views/pingpong_local.html",
    },
    "#rock_ai": {
        html: "views/rock_ai.html",
    },
    "#rock_local": {
        html: "views/rock_local.html",
    },
    "#rock_remote": {
        html: "views/rock_remote.html",
    },
    "#tictactoe_local": {
        html: "views/tictactoe_local.html",
    },
    "#tictactoe_remote": {
        html: "views/tictactoe_remote.html",
    },
    "#tictactoe_ai": {
        html: "views/tictactoe_ai.html",
    },
    "#levels": {
        html: "views/levels.html",
        css: "css/levels.css"
    },

    "#chat": {
        html: "views/chat.html",
        css: [
            "chat/css/chat-sidebar.css",
            "chat/css/main-chat.css",
            "chat/css/mobile-chat.css",
            "css/friend.css",
        ],
        js: [
            "js/app.js",
        ],
    },
  
};

function activateMenuSelector() {

    const gamingHash = ["#levels", "#pingpong_ai", "#pingpong_remote",  "#pingpong_tournoi",  "#rock_ai",  "#rock_local",  "#rock_remote", "#tictactoe_local", "#tictactoe_remote" ,"#tictactoe_ai"];
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
    if(gamingHash.includes(currentHash) )
    {
         activateElement(".menu", ".gaming");
    }

}

function addCSSForHome(hash) {
    const addCss_ifNot = (cssFile) => {
        if (!document.querySelector(`link[href="${cssFile}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = cssFile;
            link.dataset.route = hash;
            document.head.appendChild(link);
        }
    };
    if (Array.isArray(routes[hash].css)) {
        routes[hash].css.forEach((css) => addCss_ifNot(css));
    } else {
        addCss_ifNot(routes[hash].css);
    }

}

function deleteCookie(cookieName) {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function logoutUserToken()
{
    const access_token_cookie = 'my-token'; 
    const refresh_token_cookie = 'my-refresh-token';
    
    deleteCookie(access_token_cookie); 
    deleteCookie(refresh_token_cookie);
    
    localStorage.removeItem('authTokens');
    window.location.hash = '#login';
}

async function verificationRefreshTokenExpire() {
    try {
        const refresh = getCookie('my-refresh-token');
        if (!refresh) {
            logoutUserToken(); 
            return;
        }

        const data = { refresh: refresh };

        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            logoutUserToken(); 
            return;
        }

        const result = await response.json();
        
        setCookie('my-token', result.access, 30);

    } catch (error) {
        logoutUserToken();  
    }
}    

async function loadContentInDiv(hash) {
    const LoginRegister = ["#register", "#login", "#reset_pass", "#check_pass"];
    if(!LoginRegister.includes(hash))
    {
            verificationRefreshTokenExpire().then(() => {
                const tokenValid = getCookie("my-token");
                if(!tokenValid)
                    return;
            }).catch(error => {
            });
    }
    
    if (!hash.includes("#chat")) {
        if (chatsocket)
            chatsocket.close();
    }

    if (!hash.includes("#pingpong_remote")) {
        if (rpingpongsocket)
            rpingpongsocket.close();
    }

    if (!hash.includes("#pingpong_ai")) {
        if (playerIsActive)
            playerIsActive = false;
    }

    if (!hash.includes("#pingpong_remote") && !hash.includes("#pingpong_tournoi") && !hash.includes("#tictactoe_remote") && !hash.includes("#rock_remote")) {
        if (matchmaking)
            matchmaking.close();
        if (tsocket)
            tsocket.close();
        if (ticsocket)
            ticsocket.close();
        if (rocksocket)
            rocksocket.close();
        if (rpingpongsocket)
            rpingpongsocket.close();
    }

    const sidebar = document.getElementById("sidebar");
    const search_bar_side = document.getElementById("search_bar_side");
    const sidebar2 = document.getElementById("sidebar2");
    const modals = document.querySelectorAll(".modal-div");


    if (hash === "#errorPage") {
        sidebar.style.display = "none";
        sidebar2.style.display = "none";
        search_bar_side.style.display = "none";

    }
    // if ((!/^#profile\/\d+$/.test(hash)) && (hash !== "#profile/3") && (!routes[hash] || !getCookie("my-token")) && hash !== "#register" && hash !== "#check_pass" && hash !== "#reset_pass") 
    // {
    // hash = "#login";
    // }
    // if ( (!/^#profile\/\d+$/.test(hash)) && getCookie("my-token") && (hash === "#register" || hash === "#check_pass" || hash === "#login" || hash === "#reset_pass"))
    // {
    // hash = "#home";
    // }

    // if (/^#profile\/\d+$/.test(hash))
    // {
    // return;
    // }


    const response = await fetch(routes[hash].html);
    const html = await response.text();
    document.getElementById("main-content").innerHTML = html;


      
   
    //remove before u add css. 
    // const links = document.querySelectorAll('link[rel="stylesheet"]');
    // links.forEach((link) => link.remove());


    const addCss_ifNot = (cssFile) => {
        if (!document.querySelector(`link[href="${cssFile}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = cssFile;
            link.dataset.route = hash;
            document.head.appendChild(link);
        }
    };
    

    if (Array.isArray(routes[hash].css)) {
        routes[hash].css.forEach((css) => addCss_ifNot(css));
    } else {
        if (invited === true)
        {
            if (Array.isArray(routes["#gaming"].css))
                routes["#gaming"].css.forEach((css) => addCss_ifNot(css));
        }
        if (routes[hash].css)
        {
            addCss_ifNot(routes[hash].css);
        }
    }



    // css and html done 


    if (["#home", "#setting", "#profile", "#chat", "#gaming", "#levels"].includes(hash)) {

        const removeStylesByRoute = (route) => {
            const linksToRemove = document.querySelectorAll(
                `link[data-route="${route}"]`
            );
            linksToRemove.forEach((link) => link.remove());
        };
        removeStylesByRoute("#login");
        removeStylesByRoute("#register");
        removeStylesByRoute("#check_pass");
        removeStylesByRoute("#reset_pass");

        sidebar.style.display = "flex";
        sidebar2.style.display = "flex";
        search_bar_side.style.display = "flex";
        modals.forEach(modal => {
            modal.style.display = "block";
        });

    }

    if (["#login", "#register", "#check_pass", "#reset_pass"].includes(hash)) {
        sidebar.style.display = "none";
        sidebar2.style.display = "none";
        search_bar_side.style.display = "none";
        modals.forEach(modal => {
            modal.style.display = "none";
        });

        const removeStylesByRoute = (route) => {
            const linksToRemove = document.querySelectorAll(
                `link[data-route="${route}"]`
            );
            linksToRemove.forEach((link) => link.remove());
        };
        removeStylesByRoute("#home");

        addCss_ifNot(routes[hash].css);
    }
    // contenu loader avec le css et js ;
    hideLoaderLoadContent();
    if (invited === true)
    {
        if (routes['#gaming'].js) {
            const scriptPromises = [];
            for (let i = 0; i < routes['#gaming'].js.length; i++) {
                const js = routes['#gaming'].js[i];
                const promise = new Promise((resolve, reject) => {
                    if (document.querySelector(`script[src="${js}"]`)) {
                        resolve();
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = js;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
                scriptPromises.push(promise);
            }

            await Promise.all(scriptPromises);
        }
    }

    if (routes[hash].html === "views/login.html")
        function_to_login();
    else if (routes[hash].html === "views/register.html")
        function_to_register();
    else if (routes[hash].html === "views/check_pass.html") {
        function_to_check_pass();
    }
    else if (routes[hash].html === "views/reset_pass.html") {
        // function_to_reset_pass();
    }
    else if (routes[hash].html === "views/home.html") {
        slideHome();
        if (routes[hash].js) {
            const scriptPromises = [];
            for (let i = 0; i < routes[hash].js.length; i++) {
                const js = routes[hash].js[i];
                const promise = new Promise((resolve, reject) => {
                    if (document.querySelector(`script[src="${js}"]`)) {
                        resolve();
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = js;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
                scriptPromises.push(promise);
            }

            await Promise.all(scriptPromises);

        }

    }
    else if (routes[hash].html === "views/setting.html") {

        function_setting();
        if (routes[hash].js) {
            const js = routes[hash].js;

            const promise = new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${js}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement("script");
                script.src = js;

                script.onload = resolve;
                script.onerror = reject;

                document.body.appendChild(script);
            });

            await promise;
        }


    }
    else if (routes[hash].html === "views/profile.html") {
        load_profile_user();
        if (routes[hash].js) {
            const js = routes[hash].js;

            const promise = new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${js}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement("script");
                script.src = js;

                script.onload = resolve;
                script.onerror = reject;

                document.body.appendChild(script);
            });

            await promise;
        }
    }
    else if (routes[hash].html === "views/errorPage.html") {
        // errorPage();
    }
    else if (hash == "#pingpong_ai")
        {
            
            // sidebar.style.display = 'none';
            sidebar2.style.display = 'none';
            initializeAIPing();
        }
        else   if (hash == "#tictactoe_ai")
        {

            initialize();
        }
        else   if (hash == "#rock_ai")
        {
            setupRockAI();
        }
        else  if (hash == "#pingpong_local")
        {
            sidebar2.style.display = 'none';
            initializeLocalPing();
        }
        else  if (hash == "#tictactoe_local")
            initializeLocal();
        else  if (hash == "#tictactoe_remote")
            initializeRemote();
        else   if (hash == "#rock_local")
            setupRockLocal();
        else   if (hash == "#rock_remote")
            setupRockRemote();
        else   if (hash == "#pingpong_remote")
        {
            sidebar2.style.display = 'none';
            initializeRemotePing();
        }
        else  if (hash == "#pingpong_tournoi")
        {
            pInitializeParticipantList();
        }
        else if (hash === "#levels") {
            const gameName = localStorage.getItem("gameName");
            const titleElement = document.querySelector('#select-mode .welcome h2');
    
            if (titleElement) {
                switch (gameName) {
                    case 'pingpong':
                    titleElement.textContent = 'WELCOME TO PING-PONG GAME';
                    break;
                    case 'tictactoe':
                    titleElement.textContent = 'WELCOME TO TIC-TAC-TOE GAME';
                    break;
                    case 'rock':
                    titleElement.textContent = 'WELCOME TO ROCK-PAPER-SCISSORS GAME';
                    break;
                    default:
                    titleElement.textContent = 'WELCOME TO THE GAME';
                }
            }
            


            initializeModes(gameName);
        }
       
    else {
        if (routes[hash].js) {
            const scriptPromises = [];
            for (let i = 0; i < routes[hash].js.length; i++) {
                const js = routes[hash].js[i];
                const promise = new Promise((resolve, reject) => {
                    if (document.querySelector(`script[src="${js}"]`)) {
                        resolve();
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = js;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
                scriptPromises.push(promise);
            }

            await Promise.all(scriptPromises);
        }
    }

    history.replaceState(null, null, hash);
    if (routes[hash].html === "views/chat.html") {
        mychat();
        chatSocket();
    }
    if (routes[hash].html === "views/gaming.html") {
        // if (localStorage.getItem("gameStatePushed") === null) {
        //     localStorage.setItem("gameStatePushed", "false");
        // }
        // if (localStorage.getItem("GaName") === null) {
        //     localStorage.setItem("GaName", "a");
        // }
        localStorage.setItem("level","a");
        initializeCards();
    }
    // resolve(); 
    // }
    // );

};








window.addEventListener("hashchange", () => {
  

    const validHashes = ["#chat", "#profile", "#setting", "#home", "#gaming", "#register", "#levels", "#login", "#reset_pass", "#check_pass",     "#pingpong_ai", "#pingpong_remote",  "#pingpong_tournoi",  "#rock_ai",  "#rock_local",  "#rock_remote",  "#tictactoe_local", "#tictactoe_remote" ,"#tictactoe_ai"];
    const TokenExict = ["#register", "#login", "#reset_pass", "#check_pass"];
    const userCookie = getCookie("my-token");
    const TokenNotExist = ["#chat", "#profile", "#setting", "#home", "#gaming"];
    
    const currentHash = window.location.hash;

    if (userCookie) {
        if ((!currentHash.includes("#profile/")) && (!validHashes.includes(currentHash)) && (!currentHash.includes("#levels"))) {
            loadContentInDiv("#errorPage");
        }
        else if ((!currentHash.includes("#profile/") && !currentHash.includes("#levels")) && (currentHash === "" || !routes[currentHash] || TokenExict.includes(currentHash))) {
            activateMenuSelector();
            UserSocket();
            loadContentInDiv("#home");
            loadUserdata_side();
        }
        else if (currentHash.includes("#profile/")) {
            let id = currentHash.split("/")[1]; 
            addCSSForHome("#home");
            loadUserdata_side();
            activateMenuSelector();
            const script = document.createElement('script');
            script.src = 'js/app.js';
            script.type = 'text/javascript';
            document.body.appendChild(script);
            UserSocket();
            fetchUserProfile(id);

        }
        else {
            if (currentHash !== "#login" && currentHash !== "#register" && currentHash !== "#check_pass" && currentHash !== "#reset_pass") {
                addCSSForHome("#home");
            }
            UserSocket();
            activateMenuSelector();
            loadUserdata_side();
            addCSSForHome("#home");
            loadContentInDiv(currentHash);
        }

    } 
    else {

        if (!TokenExict.includes(currentHash) && (!TokenNotExist.includes(currentHash)))
            loadContentInDiv("#errorPage");
        else if (TokenNotExist.includes(currentHash))
            loadContentInDiv("#login");
        else
            loadContentInDiv(currentHash);

    }

});

window.addEventListener("load", () => {
    showLoaderLoadContent();

    const TokenExict = ["#register", "#login", "#reset_pass", "#check_pass"];
    const script = document.createElement('script');
    script.src = '../game/js/game.js';

    script.type = 'text/javascript';
    document.body.appendChild(script);

        const userCookie = getCookie("my-token");
        const currentHash = window.location.hash;

        if (userCookie) {
            if (currentHash === "" ||  TokenExict.includes(currentHash)) {
                activateMenuSelector();
                UserSocket();
                loadContentInDiv("#home");
                loadUserdata_side();
            }
            else if (currentHash.includes("#profile/")) {

                let id = currentHash.split("/")[1];
                addCSSForHome("#home");
                loadUserdata_side();
                activateMenuSelector();
                const script = document.createElement('script');
                script.src = 'js/app.js';
                script.type = 'text/javascript';
                document.body.appendChild(script);
                UserSocket();
                fetchUserProfile(id);

            }
            else {
                const gamingHash = ["#levels", "#pingpong_ai", "#pingpong_remote",  "#pingpong_tournoi",  "#rock_ai",  "#rock_local",  "#rock_remote", "#tictactoe_local", "#tictactoe_remote" ,"#tictactoe_ai"];

                if(gamingHash.includes(currentHash))
                {
                    addCSSForHome("#gaming");
                    if (routes["#gaming"].js) {
                        const scriptPromises = [];
                        for (let i = 0; i < routes["#gaming"].js.length; i++) {
                            const js = routes["#gaming"].js[i];
                            const promise = new Promise((resolve, reject) => {
                                if (document.querySelector(`script[src="${js}"]`)) {
                                    resolve();
                                    return;
                                }
                                const script = document.createElement("script");
                                script.src = js;
                                script.onload = resolve;
                                script.onerror = reject;
                                document.body.appendChild(script);
                            });
                            scriptPromises.push(promise);
                        }
    
                    }
                }
                const sidebar = document.getElementById("sidebar");
                const search_bar_side = document.getElementById("search_bar_side");
                const sidebar2 = document.getElementById("sidebar2");

                sidebar.style.display = "flex";
                sidebar2.style.display = "flex";
                search_bar_side.style.display = "flex";

               
                loadUserdata_side();
                addCSSForHome("#home");
                activateMenuSelector();
                UserSocket();
                loadContentInDiv(currentHash);
            }
        }
        else {
            if (currentHash !== "#login" && currentHash !== "#register" && currentHash !== "#check_pass" && currentHash !== "#reset_pass") {
                loadContentInDiv("#login");
            } else {
                loadContentInDiv(currentHash);
            }
        }
    setTimeout(() => {
        hideLoaderLoadContent();
    }, 2000);
});


function addLoaderCSS() {
    const css = `
    .loader {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: none;
    }
    .loader img {
    width: 200px;
    height: auto;
    animation: heartbeat 1s infinite;
    }
    @keyframes heartbeat {
    0% { transform: scale(0.5); }
    50% { transform: scale(1); }
    100% { transform: scale(0.5); }
    }
    `;

    // Créer un élément <style> et y insérer le CSS
    const styleElement = document.createElement('style');
    styleElement.innerHTML = css;
    document.head.appendChild(styleElement);
}

function showLoaderLoadContent() {

    const modalList = document.querySelector(".modal-div");
    const Content = document.querySelector(".content");

    Content.classList.add("d-none");
    modalList.classList.add("d-none");
    addLoaderCSS();
    // total.classList.add("d-none");

    document.querySelector("#loader").style.display = "block";
    document.body.style.backgroundColor = "#1E1F22";
    // document.querySelector(".container-custom.position-relative").style.display = "none";
}



function hideLoaderLoadContent() {
    const modalList = document.querySelector(".modal-div");
    const Content = document.querySelector(".content");
    document.getElementById("loader").style.display = "none";

    Content.classList.remove("d-none");
    modalList.classList.remove("d-none");
    // document.getElementById("login-container").style.display = "none";
    // document.body.style.backgroundColor = "#1E1F22";
}



