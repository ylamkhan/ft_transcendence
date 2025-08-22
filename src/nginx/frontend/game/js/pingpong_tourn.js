function pInitializeParticipantList() {
    if (invited === true)
        PhandleTournamentremote();
    const remoteOptions = document.getElementById('remote-tournament-options');

    document.getElementById('local-mode-btn').addEventListener('click', function() {
        document.querySelector('.tournament-mode').style.display = 'none';
        document.getElementById('create-tournament-section').style.display = 'block';
        PhandleTournamentlocal();
    });

    document.getElementById('remote-mode-btn').addEventListener('click', function () {
        document.querySelector('.tournament-mode').style.display = 'none';
        remoteOptions.style.display = 'block';
        PhandleTournamentremote();
    });
    
}

function startConfetti(containerId) {
    const confetti = {
        maxCount: 150,
        speed: 2,
        frameInterval: 15,
        alpha: 1,
        gradient: false,
        start: null,
        stop: null,
        toggle: null,
        pause: null,
        resume: null,
        togglePause: null,
        remove: null,
        isPaused: null,
        isRunning: null
    };

    let containerWidth, containerHeight; // Define in higher scope
    let e = false, i = false, o = Date.now(), a = [], r = 0, l = null;

    (function() {
        confetti.start = s;
        confetti.stop = w;
        confetti.toggle = function() {
            e ? w() : s();
        };
        confetti.pause = u;
        confetti.resume = m;
        confetti.togglePause = function() {
            i ? m() : u();
        };
        confetti.isPaused = function() {
            return i;
        };
        confetti.remove = function() {
            stop();
            i = false;
            a = [];
        };
        confetti.isRunning = function() {
            return e;
        };

        const t = window.requestAnimationFrame || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame || 
                  window.oRequestAnimationFrame || 
                  window.msRequestAnimationFrame;

        const n = [
            "rgba(30,144,255,", "rgba(107,142,35,", 
            "rgba(255,215,0,", "rgba(255,192,203,", 
            "rgba(106,90,205,", "rgba(173,216,230,", 
            "rgba(238,130,238,", "rgba(152,251,152,", 
            "rgba(70,130,180,", "rgba(244,164,96,", 
            "rgba(210,105,30,", "rgba(220,20,60,"
        ];

        function d(t, e, i) {
            t.color = n[Math.random() * n.length | 0] + (confetti.alpha + ")");
            t.color2 = n[Math.random() * n.length | 0] + (confetti.alpha + ")");
            t.x = Math.random() * e;
            t.y = Math.random() * i - i;
            t.diameter = 10 * Math.random() + 5;
            t.tilt = 10 * Math.random() - 10;
            t.tiltAngleIncrement = 0.07 * Math.random() + 0.05;
            t.tiltAngle = Math.random() * Math.PI;
            return t;
        }

        function u() {
            i = true;
        }

        function m() {
            i = false;
            c();
        }

        function c() {
            if (!i) {
                if (a.length === 0) {
                    l.clearRect(0, 0, containerWidth, containerHeight);
                } else {
                    const n = Date.now(),
                          u = n - o;

                    if (!t || u > confetti.frameInterval) {
                        l.clearRect(0, 0, containerWidth, containerHeight);
                        
                        const draw = function() {
                            let t, n = containerWidth,
                                i = containerHeight;
                            r += 0.01;
                            for (let o = 0; o < a.length; o++) {
                                t = a[o];
                                if (!e && t.y < -15) {
                                    t.y = i + 100;
                                } else {
                                    t.tiltAngle += t.tiltAngleIncrement;
                                    t.x += Math.sin(r) - 0.5;
                                    t.y += 0.5 * (Math.cos(r) + t.diameter + confetti.speed);
                                    t.tilt = 15 * Math.sin(t.tiltAngle);
                                }
                                if (t.x > n + 20 || t.x < -20 || t.y > i) {
                                    if (e && a.length <= confetti.maxCount) {
                                        d(t, n, i);
                                    } else {
                                        a.splice(o, 1);
                                        o--;
                                    }
                                }
                            }
                        };

                        draw();

                        const render = function(t) {
                            for (let n, e, i, o, r = 0; r < a.length; r++) {
                                n = a[r];
                                t.beginPath();
                                t.lineWidth = n.diameter;
                                i = n.x + n.tilt;
                                e = i + n.diameter / 2;
                                o = n.y + n.tilt + n.diameter / 2;
                                if (confetti.gradient) {
                                    const l = t.createLinearGradient(e, n.y, i, o);
                                    l.addColorStop("0", n.color);
                                    l.addColorStop("1.0", n.color2);
                                    t.strokeStyle = l;
                                } else {
                                    t.strokeStyle = n.color;
                                }
                                t.moveTo(e, n.y);
                                t.lineTo(i, o);
                                t.stroke();
                            }
                        };

                        render(l);
                        o = n - u % confetti.frameInterval;
                    }
                    requestAnimationFrame(c);
                }
            }
        }

        function s(t, n, o) {
            const container = document.getElementById(containerId); // Get the specified container
            if (!container) {
                return;
            }

            containerWidth = container.offsetWidth; // Assign to higher scope variables
            containerHeight = container.offsetHeight;

            window.requestAnimationFrame = window.requestAnimationFrame || 
                                           window.webkitRequestAnimationFrame || 
                                           window.mozRequestAnimationFrame || 
                                           window.oRequestAnimationFrame || 
                                           window.msRequestAnimationFrame || 
                                           function(t) {
                                               return window.setTimeout(t, confetti.frameInterval);
                                           };
            
            let m = document.getElementById("confetti-canvas");
            if (m === null) {
                m = document.createElement("canvas");
                m.setAttribute("id", "confetti-canvas");
                m.setAttribute("style", "display:block;z-index:999999;pointer-events:none;position:absolute;top:0;left:0");
                container.prepend(m); // Add the canvas to the container instead of the body
                m.width = containerWidth;
                m.height = containerHeight;
                window.addEventListener("resize", function() {
                    m.width = container.offsetWidth;
                    m.height = container.offsetHeight;
                }, true);
                l = m.getContext("2d");
            } else if (l === null) {
                l = m.getContext("2d");
            }

            let s = confetti.maxCount;
            if (n) {
                if (o) {
                    if (n == o) s = a.length + o;
                    else {
                        if (n > o) {
                            const f = n;
                            n = o;
                            o = f;
                        }
                        s = a.length + (Math.random() * (o - n) + n | 0);
                    }
                } else {
                    s = a.length + n;
                }
            } else if (o) {
                s = a.length + o;
            }
            while (a.length < s) {
                a.push(d({}, containerWidth, containerHeight));
            }
            e = true;
            i = false;
            c();
            if (t) {
                window.setTimeout(w, t);
            }
        }

        function w() {
            e = false;
        }
    })();

    confetti.start();
}
