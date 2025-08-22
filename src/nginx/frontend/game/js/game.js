function loadContent(page, gameName) {
    loadContentInDiv("#levels");
}

function initializeCards() {
    let mode;
    let gameName;
    document.querySelectorAll('.card-wrap').forEach(cardWrap => {
        const card = cardWrap.querySelector('.card');
        const cardBg = card.querySelector('.card-bg');
        const image = cardWrap.getAttribute('data-image');

        if (cardBg && image) {
            cardBg.style.backgroundImage = `url(${image})`;
        }

        cardWrap.addEventListener('mousemove', (e) => {
            const rect = cardWrap.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;

            const mousePX = mouseX / rect.width;
            const mousePY = mouseY / rect.height;

            const rX = mousePX * 25;
            const rY = mousePY * -25;
            card.style.transform = `rotateY(${rX}deg) rotateX(${rY}deg)`;

            const tX = mousePX * 50;
            const tY = mousePY * -50;
            cardBg.style.transform = `translateX(${tX}px) translateY(${tY}px)`;
        });

        cardWrap.addEventListener('mouseenter', () => {
            clearTimeout(card.mouseLeaveDelay);
        });

        cardWrap.addEventListener('mouseleave', () => {
            card.mouseLeaveDelay = setTimeout(() => {
                card.style.transform = '';
                cardBg.style.transform = '';
            }, 300);
        });

        cardWrap.addEventListener('click', (event) => {
            event.preventDefault();

            const gameClass = cardWrap.classList.contains('card-wrap')
                ? cardWrap.classList[1]
                : null;

            const gameNames = {
                'pingpong': 'pingpong',
                'tictactoe': 'tictactoe',
                'rock': 'rock'
            };

            gameName = gameNames[gameClass] || 'Unknown Game';
            history.pushState("gaming", '', "#gaming");
            loadContent('/views/levels', gameName);
            localStorage.setItem("gameName", gameName);
        });
    });
}

function initializeModes(gameName) {

    const cards = document.querySelectorAll(".card-level");

    cards.forEach(card => {
        card.addEventListener("click", function () {
            const mode = card.classList[1];
            loadGameContent1(mode, gameName);
        });
    });

    function loadGameContent1(mode, gameName) {
        if (gameName == "pingpong") {
            const hash = "#pingpong_" + mode;
            const state = "pingpong_" + mode;
            history.pushState({ section: state }, '', hash);
            loadContentInDiv(hash);
        }
        if (gameName == "tictactoe") {
            if (mode != 'tournoi') {
                const hash = "#tictactoe_" + mode;
                const state = "tictactoe_" + mode;
                history.pushState({ section: state }, '', hash);
                loadContentInDiv(hash);
            }
        }
        if (gameName == 'rock') {
            if (mode != 'tournoi') {
                const hash = "#rock_" + mode;
                const state = "rock_" + mode;
                history.pushState({ section: state }, '', hash);
                loadContentInDiv(hash);
            }
        }
    }
}
