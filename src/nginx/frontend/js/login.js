function loadUserdata_side() {
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
			if (response.status === 401) {
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

function verification_code(code, state) {
	const data = {
		code: code,
	};
	if (state === "intra") {
		url = window.location.origin + '/api/login/intra/';
	} else {
		url = window.location.origin + '/api/login/google/';
	}
	fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errorData => {
				});
			}
			return response.json();
		})
		.then(data => {
			if (data.access) {
				localStorage.setItem('authTokens', JSON.stringify(data));
				setCookie('my-token', data.access, 30);
				setCookie('my-refresh-token', data.refresh, 30);

				function showLoader() {
					document.querySelector("#loader-login").style.display = "block";
					document.querySelector(".container-custom.position-relative").style.display = "none";
				}

				function handleRedirection() {
					showLoader();
					setTimeout(() => {
						addBootstrap();
						UserSocket();
						loadContentInDiv('#home');
						loadUserdata_side();
					}, 1500);
				}
				handleRedirection();
			}
		})
		.catch(error => {
			document.getElementById('result').innerText = 'Error during verification: ' + error.message;
		});
}

function function_to_login() {
	const loginBtn = document.querySelector(".loginBtn");
	const registerBtn = document.querySelector(".registerBtn");

	const formBx = document.querySelector(".formBx");
	const body = document.querySelector("body");
	const form_login = document.querySelector(".login");
	const form_register = document.querySelector(".register");
	const forgot_pass = document.querySelector(".forgotPass");

	const forgot_Btn = document.querySelector("#forgot_Btn");
	const container = document.querySelector(".container-custom");
	const secondCont = document.querySelector(".secondCont");

	const checkPass = document.querySelector(".checkPass");
	const resetPassBtn = document.querySelector(".resetPassBtn");
	const resetPassForm = document.querySelector(".resetPass");

	const backToLogin = document.querySelector(".backToLogin");


	backToLogin.addEventListener("click", () => {
		container.classList.remove("d-none");
		secondCont.classList.add("d-none");


	});


	forgot_Btn.addEventListener("click", () => {
		container.classList.add("d-none");
		secondCont.classList.remove("d-none");
		resetPassForm.classList.remove("d-none");
		checkPass.classList.add("d-none");

	});




	registerBtn.addEventListener("click", () => {
		formBx.classList.add("active");
		body.classList.add("active");
		form_register.classList.remove("d-none");
		form_login.classList.add("d-none");
		function_to_register();


	});

	loginBtn.addEventListener("click", () => {
		formBx.classList.remove("active");
		body.classList.remove("active");
		form_login.classList.remove("d-none");
		form_register.classList.add("d-none");
	});




	const registerBtn2 = document.querySelector(".registerBtn2");

	registerBtn2.addEventListener("click", () => {
		formBx.classList.add("active");
		body.classList.add("active");
		form_register.classList.remove("d-none");
		form_login.classList.add("d-none");
		function_to_register();
	});
	const loginBtn2 = document.querySelector(".loginBtn2");

	loginBtn2.addEventListener("click", () => {
		formBx.classList.add("active");
		body.classList.add("active");
		form_register.classList.add("d-none");
		form_login.classList.remove("d-none");

	});

	const urlParams = new URLSearchParams(window.location.search);
	var code = urlParams.get("code");

	if (code) {
		var state = urlParams.get('state');
		urlParams.delete('code');
		urlParams.delete('state');
		window.history.replaceState({}, '', window.location.pathname);
		verification_code(code, state);

	}
	// // // -----------------------------------------------------------------------------------------------------------------------------------

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

	const resultDiv = document.getElementById('result');
	document.getElementById('form_login').addEventListener('submit', function (e) {
		e.preventDefault();

		var name = sanitizeMessage(document.getElementById('username').value);
		const password = sanitizeMessage(document.getElementById('password').value);

		if (name === '') {
			resultDiv.innerHTML = `<p class="text-danger">Error: you should enter your email or username .</p>`;
			return;
		}
		else if (password === '') {
			resultDiv.innerHTML = `<p class="text-danger">Error: you should enter your  passeword.</p>`;
			return;
		}

		resultDiv.innerHTML = '';
		const data = {
			username: name,
			password: password
		};
		loginAndHandleOTP(data);
	});

	async function loginAndHandleOTP(data) {
		try {
			const loginResponse = await fetch(window.location.origin + '/api/login/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data)
			});
	
			if (!loginResponse.ok) {
				if (loginResponse.status === 404) {
					resultDiv.innerHTML = `<p class="error">Oops! Please try later.</p>`;
					return;
				}
	
				const errorData = await loginResponse.json();
				if (errorData.non_field_errors) {
					resultDiv.innerHTML = `<p class="text-danger">Error: The email address or username you entered isn't connected to an account.</p>`;
					return;
				}
			}
	
			const loginData = await loginResponse.json();
			localStorage.setItem('authTokens', JSON.stringify(loginData));
	
			const namec = sanitizeMessage(document.getElementById('username').value);
			const passwordc = sanitizeMessage(document.getElementById('password').value);
			const datacheck = { username: namec, password: passwordc };
			const otpCheckResponse = await fetch(window.location.origin + '/api/otp/check/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(datacheck)
			});
			
			const otpCheckData = await otpCheckResponse.json();
			
			if (otpCheckData.tfaenabled) {
				const twofact = document.querySelector(".twofact");
				const form_login = document.querySelector(".login");
				
				twofact.classList.remove("d-none");
				form_login.classList.add("d-none");
				const otpVerified = await function_to_check_otp();
				
				if (!otpVerified) {
					function showLoader() {
						document.querySelector("#loader-login").style.display = "block";
						document.querySelector(".container-custom.position-relative").style.display = "none";
					}
					
					function handleRedirection() {
						showLoader();
						setTimeout(() => {
							loadContentInDiv('#login');
						}, 1500);
					}
					handleRedirection();
					return;
				}
			}
			
			function showLoader() {
				document.querySelector("#loader-login").style.display = "block";
				document.querySelector(".container-custom.position-relative").style.display = "none";
			}
			
			function handleRedirection() {
				showLoader();
				setTimeout(() => {
					addBootstrap();
					UserSocket();
					loadContentInDiv('#home');
					loadUserdata_side();
				}, 1500);
			}
			const { access, refresh } = loginData;
			const set_access = 'my-token';
			const set_refresh = 'my-refresh-token';
			setCookie(set_access, access, 30);
			setCookie(set_refresh, refresh, 30);
			handleRedirection();
	
		} catch (error) {
		}
	}	

	function intra() {
		var host = window.location.host;
		const CLIENT_ID = 'u-s4t2ud-151e94554d1a6455432c2173462878a47039f3277ee2f4ac2a6545d67e7601f1';
		const REDIRECT_URI = encodeURIComponent(`https://${host}/`);
		const authorizeUrl = `https://api.intra.42.fr/oauth/authorize?` +
			`client_id=${CLIENT_ID}&` +
			`redirect_uri=${REDIRECT_URI}&` +
			`response_type=code&state=intra`;
		window.location.href = authorizeUrl;
	}

	function google() {
		var host = window.location.host;
		const CLIENT_ID = '911564297343-v1ocvliemvb0ulls2dakbn3gbtedqdqq.apps.googleusercontent.com';
		const REDIRECT_URI = encodeURIComponent(`https://${host}`);
		const authorizeUrl = `http://accounts.google.com/o/oauth2/v2/auth?` +
			`redirect_uri=${REDIRECT_URI}&` +
			`prompt=consent&response_type=code&` +
			`client_id=${CLIENT_ID}&` + `scope=openid%20email%20profile&access_type=offline`;

		window.location.href = authorizeUrl;
	}

	document.getElementById('intra').addEventListener('click', intra);
	document.getElementById('google').addEventListener('click', google);


}

async function function_to_check_otp() {
	const getOtpCode = () => {
		const otpInputs = document.querySelectorAll("#token_code .otp-input");
		let otpCode = '';
		otpInputs.forEach(input => {
			otpCode += input.value.trim();   
		});
		return otpCode;
	};

	return new Promise((resolve) => {
		const submitbtn = document.getElementById('submitotp');

		submitbtn.addEventListener("click", async () => {
			const otpcode = getOtpCode();
			const name = sanitizeMessage(document.getElementById('username').value);
			const password = sanitizeMessage(document.getElementById('password').value);

			const content = {
				token: otpcode,
				username: name,
				password: password,
			};

			try {
				const response = await fetch(window.location.origin + '/api/otp/verify/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(content)
				});

				if (!response.ok) {
					if (response.status === 401)
					{
						logoutUserToken();
						return;
					}
				}

				const result = await response.json();

				if (result.tfaverified) {
					resolve(true);
				} else {
					resolve(false);
				}
			} catch (error) {
				resolve(false);   
			}
		});
	});
}



