(function () {
    const slider = document.querySelector('.slider .list');
    const items = document.querySelectorAll('.slider .list .item');
    const next = document.getElementById('next');
    const prev = document.getElementById('prev');
    const dots = document.querySelectorAll('.slider .dots li');

    if (!slider || items.length === 0 || !next || !prev || dots.length === 0) {
        return;
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
})();
