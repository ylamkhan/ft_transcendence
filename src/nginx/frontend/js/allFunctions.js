var invited = false;
var invitedId = 0;

function sanitizeMessage(message) {
	var element = document.createElement('div');
	if (message) {
		element.innerText = message;
		message = element.innerHTML;
	}
	return message;
}    

function loadUserdata_game(profile, name) {
    
	const access_token = getCookie('my-token');
	
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
			
   
		  profile.src =userData.avatar;

		 name.textContent = userData.username;

		})
		.catch(error => {
		});
	
}

function drawLineChart(labels, data) {
    const canvas = document.getElementById('lineChart');
    const ctx = canvas.getContext('2d');

    const padding = 50;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    const gradient = ctx.createLinearGradient(0, 0, chartWidth, 0);
    gradient.addColorStop(0, '#ff6384');
    gradient.addColorStop(1, '#4bc0c0');

    const maxValue = Math.max(...data);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Winning Rate', canvas.width / 2, 30);

    ctx.strokeStyle = '#3c3c3c';
    ctx.lineWidth = 1;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';

    for (let i = 0; i <= 5; i++) {
        let y = padding + (i * chartHeight) / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();

        ctx.fillText(((maxValue / 5) * (5 - i)).toFixed(0), 10, y + 4);
    }

    labels.forEach((label, index) => {
        let x = padding + (index * chartWidth) / (labels.length - 1);
        ctx.fillText(label, x - 15, canvas.height - 15);
    });

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = gradient;
    ctx.moveTo(padding, padding + chartHeight - (data[0] / maxValue) * chartHeight);

    for (let i = 1; i < data.length; i++) {
        let x = padding + (i * chartWidth) / (data.length - 1);
        let y = padding + chartHeight - (data[i] / maxValue) * chartHeight;
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    data.forEach((value, index) => {
        let x = padding + (index * chartWidth) / (data.length - 1);
        let y = padding + chartHeight - (value / maxValue) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gradient;
        ctx.stroke();
    });
}

//  ----------------------------------- outils global -----------------------------------------------

function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
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

function addBootstrap(){
	var bootstrapLink = document.createElement('link');
			
	bootstrapLink.rel = 'stylesheet';
	bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
	bootstrapLink.integrity = 'sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH';
	bootstrapLink.crossOrigin = 'anonymous';
	document.head.appendChild(bootstrapLink);
}




function setActive(element) {
	var items = document.querySelectorAll('.menu li');

	items.forEach(function(item) {
		if (item.classList.contains('active')) {
			item.classList.remove('active');
		}
	});
	element.classList.add('active');
}
