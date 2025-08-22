
function function_setting() {
	// enable two factor-----------------------------------------------------------------------------------
	const tfabtn = document.querySelector(".enable-2fa-btn");
	var enable;

	tfabtn.addEventListener('click', async () => {
		if (tfabtn.classList.contains("disabled")) {
			tfabtn.classList.remove("disabled");
			tfabtn.classList.add("enabled");
			tfabtn.textContent = "Disable 2FA";
			enable = true;
		} else {
			tfabtn.classList.remove("enabled");
			tfabtn.classList.add("disabled");
			tfabtn.textContent = "Enable 2FA";
			enable = false;
		}

		const access_token = getCookie('my-token');
		const data = { enable: enable };

		try {
			const response = await fetch(window.location.origin + '/api/enabletfa/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${access_token}`
				},
				body: JSON.stringify(data)
			});

			if (response.ok) {
			} else {
				const errorData = await response.json();
			}
		} catch (error) {
		}
		loadUserProfile_setting();
	});



	//  this is for the alert  : --------------------------------------------------------

	function showAlert() {
		alertBox.style.display = "flex";
		setTimeout(() => {
			alertBox.style.display = "none";
		}, 5000);
	}

	const close_btn = document.getElementById('close_btn');
	close_btn.addEventListener('click', () => {
		alertBox.style.display = "none";
	});

	function cancel() {
		document.getElementById('first-name').value = '';
		document.getElementById('last-name').value = '';
		document.getElementById('country').value = '';
		document.getElementById('result1').innerHTML = '';
		document.getElementById('about').value = '';
		document.getElementById('birthday').value = '';
	}

	function cancel_pass() {
		document.getElementById('old_password').value = '';
		document.getElementById('new_password1').value = '';
		document.getElementById('new_password2').value = '';
	}

	function save() {
		const resultDiv = document.getElementById('result');
		const resultDiv1 = document.getElementById('result1');

		const access_token = getCookie('my-token');
		const firstName = sanitizeMessage(document.getElementById('first-name').value);
		const lastName = sanitizeMessage(document.getElementById('last-name').value);
		const countrySelect = sanitizeMessage(document.getElementById('country').value);
		const old_password = sanitizeMessage(document.getElementById('old_password').value);
		const new_password1 = sanitizeMessage(document.getElementById('new_password1').value);
		const new_password2 = sanitizeMessage(document.getElementById('new_password2').value);
		const about = sanitizeMessage(document.getElementById('about').value);
		const birthday = sanitizeMessage(document.getElementById('birthday').value);

		const data = {};
		if (firstName) {
			data.first_name = firstName;
		}
		if (lastName) {
			data.last_name = lastName;
		}
		if (countrySelect) {
			data.country_select = countrySelect;
			data.country = countrySelect;
		}
		if (about) {
			data.about = about;
		}
		if (birthday) {
			data.date_of_birth = birthday;
		}

		const is_notempty = Object.values(data).some(value => value && value.trim() !== '');

		fetch(window.location.origin + '/api/user/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${access_token}`
			},
			body: JSON.stringify(data)
		})
			.then(response => {
				if (!response.ok) {
					if (response.status === 401)
						logoutUserToken();
					return response.json().then(errorData => {
					});
					
				}
				if (is_notempty) {

					showAlert();
					document.getElementById('first-name').value = firstName;
					document.getElementById('last-name').value = lastName;
					document.getElementById('country').value = countrySelect;
					document.getElementById('about').value = about;
					document.getElementById('birthday').value = birthday;


				}
				return response.json();
			})
			.then(data => {
			})
			.catch((error) => {
			});

	}
	//  -------------change passeword;-------------

	function save_password() {


		const resultDiv1 = document.getElementById('result1');

		const access_token = getCookie('my-token');

		const old_password = sanitizeMessage(document.getElementById('old_password').value);
		const new_password1 = sanitizeMessage(document.getElementById('new_password1').value);
		const new_password2 = sanitizeMessage(document.getElementById('new_password2').value);

		if (old_password && new_password1 && new_password2) {
			const pass_data = {

				old_password: old_password,
				new_password1: new_password1,
				new_password2: new_password2
			};

			const errorMsgs = document.querySelectorAll('.msg');
			errorMsgs.forEach(errorMsg => errorMsg.remove());

			fetch(window.location.origin + '/api/password/change/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${access_token}`
				},
				body: JSON.stringify(pass_data)
			})
				.then(response => {

					if (!response.ok) {
						if (response.status === 401)
							logoutUserToken();
						return response.json().then(errorData => {
							resultDiv1.innerHTML = '';
							for (const key in errorData) {
								if (errorData.hasOwnProperty(key)) {
									let field;
									field = document.querySelector(`[name="${key}"]`);
									if (field) {

										errorData[key].forEach(error => {
											let errorMsg = field.nextElementSibling;
											if (!errorMsg || !errorMsg.classList.contains('msg')) {
												field.insertAdjacentHTML('afterend', `<span class="msg">${error}</span>`);
											} else {
												errorMsg.textContent = error;
											}
										});
									}
								}
							}
						});
					} else if (response.ok) {
						showAlert();
						cancel_pass();

					}
					return response.json();
				})
				.then(data => { })
				.catch((error) => {
				});


		} else {
			cancel();
		}
	}



	// function load_set_content() {


	// 	const countrySelect = document.getElementById('country');

	// 	fetch('https://restcountries.com/v3.1/all')
	// 		.then(response => response.json())
	// 		.then(countries => {
	// 			countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

	// 			countries.forEach(country => {
	// 				const option = document.createElement('option');
	// 				option.value = country.cca2;
	// 				option.id = country.cca2;
	// 				option.textContent = country.name.common;
	// 				if (option.textContent !== "Israel") {
	// 					countrySelect.appendChild(option);
	// 				}
	// 			});


	// 		})
	// 		.catch(error => {
	// 			// console.error('Error fetching countries:', error);
	// 		});

	// }

	// load_set_content();
	// ----------------change the image profil (post it to  database ---------


	document.querySelector('.update-image-button-setting').addEventListener('click', function () {
		document.getElementById('fileInput').click();
	});

	document.getElementById('fileInput').addEventListener('change', function (event) {

		function uploadImage() {
			const access_token = getCookie('my-token');
			const maxSizeInBytes = 50 * 1024 * 1024;
			const resultDiv = document.getElementById('result1');

			if (file) {
				if (file.size > maxSizeInBytes) {
					resultDiv.innerHTML = `<p class="msg">Big Size !! </p>`;

					return; // Prevent the upload if file is too large
				}
			}
			
			if (file) {
				const formData = new FormData();
				const data = {

					avatar: file,

				};

				for (const key in data) {
					if (key === "avatar") {
						formData.append(key, file);
					}
				}

				fetch(window.location.origin + '/api/user/', {
					method: 'PUT',
					headers: {
						'Authorization': `Bearer ${access_token}`
					},
					body: formData
				})
					.then(response => {
						if (!response.ok) {
							if (response.status === 401)
								logoutUserToken();
							return response.json().then(errorData => { });
						}
						return response.json();
					})
					.then(data => {
					})
					.catch(error => {
					});
			}
		}

		let file;

		file = event.target.files[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = function (e) {
				document.getElementById('photo').src = e.target.result;
				document.getElementById('photo1').src = e.target.result;

			};
			reader.readAsDataURL(file);
			uploadImage();
		}
	});


	document.getElementById('save_set').addEventListener('click', save);
	document.getElementById('save_set_pass').addEventListener('click', save_password);


	//     // -------get from database-----------------------------------------


	function loadUserProfile_setting() {

		const access_token = getCookie('my-token');

		fetch(window.location.origin + '/api/user/', {
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
				document.getElementById('photo').src = userData.avatar;
				document.getElementById('username').textContent = userData.username;
				document.getElementById('first-name').value = userData.first_name;
				document.getElementById('last-name').value = userData.last_name;
				document.getElementById('country').value = userData.country_select;
				document.getElementById('about').value = userData.about;
				document.getElementById('birthday').value = userData.date_of_birth;
				if (userData.tfa_enabled) {
					tfabtn.classList.remove("disabled");
					tfabtn.classList.add("enabled");
					tfabtn.textContent = "Disable 2FA";
				}
				else {
					tfabtn.classList.remove("enabled");
					tfabtn.classList.add("disabled");
					tfabtn.textContent = "Enable 2FA";
				}
			})
			.catch(error => {
			});
	}
	loadUserProfile_setting();
}