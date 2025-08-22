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
function to_login_page() {
	function showLoader() {
	  document.getElementById("loader").style.display = "block";
	  document.getElementById("login-container-register").style.display = "none";
	  document.body.style.backgroundColor = "#1E1F22";
	}
  
	
	function handleRedirection() {
		showLoader(); 
		loadContentInDiv("#login");
	}
	handleRedirection();
}
function function_to_register() {
	const formBx = document.querySelector(".formBx");
	const body = document.querySelector("body");
	const form_login = document.querySelector(".login"); 
	const form_register =document.querySelector(".register");

	const loginBtn = document.querySelector(".loginBtn");
	const loginBtn2 = document.querySelector(".loginBtn2");

	loginBtn2.addEventListener("click", () => {
		window.location.hash = "#login";
		formBx.classList.remove("active");
		body.classList.remove("active");
		form_login.classList.remove("d-none");
		form_register.classList.add("d-none");
		});
	
	loginBtn.addEventListener("click", () => {
		window.location.hash = "#login";
		formBx.classList.remove("active");
		body.classList.remove("active");
		form_login.classList.remove("d-none");
		form_register.classList.add("d-none");
	});

	const resultDiv = document.getElementById('result');

	const form = document.getElementById('form_register');
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const formData = {
			first_name: sanitizeMessage(document.getElementById('first_name').value),
			last_name: sanitizeMessage(document.getElementById('last_name').value),
			email: sanitizeMessage(document.getElementById('email').value),
			password1: sanitizeMessage(document.getElementById('password1').value),
			password2: sanitizeMessage(document.getElementById('password2').value),
		};

		const jsonData = JSON.stringify(formData);

		fetch(window.location.origin + '/api/register/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: jsonData
			})
				.then((response) => {
		  if (response.ok) {
			return response.json();
		  } else {
			return response.json().then((errData) => {
			  document.querySelectorAll(".text-danger").forEach((msg) => msg.remove());
  
			  resultDiv.innerHTML = "";
			  for (const key in errData) {
				if (errData.hasOwnProperty(key)) {
				  let field;
				  if (key === "non_field_errors") {
					field = document.querySelector(`[name="password2"]`);
				  } else {
					field = document.querySelector(`[name="${key}"]`);
				  }
				  if (field) {
					errData[key].forEach((error) => {
					  let errorMsg = field.nextElementSibling;
					  if (!errorMsg || !errorMsg.classList.contains("text-danger")) {
						field.insertAdjacentHTML(
						  "afterend",
						  `<span class="text-danger">${error}</span>`
						);
					  } else {
						errorMsg.textContent = error;
					  }
					});
				  }
				}
			  }
			  throw new Error("Registration failed");
			});
		  }
		})
			.then(data => {
				localStorage.setItem('authTokens', JSON.stringify(data));
			
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

			})
			.catch(error => {
				// console.error('Error:', error);
			});
	});
	// });


	const urlParams = new URLSearchParams(window.location.search);
	var code = urlParams.get("code");

	if (code) {
		var state = urlParams.get('state');
		urlParams.delete('code');
		urlParams.delete('state');
		window.history.replaceState({}, '', window.location.pathname);
		verification_code(code, state);

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
    document.getElementById('intra2').addEventListener('click', intra);
    document.getElementById('google2').addEventListener('click', google);

}