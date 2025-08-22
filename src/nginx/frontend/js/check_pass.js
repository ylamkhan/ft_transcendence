function function_to_check_pass() {
	const container = document.querySelector(".container-custom");
	const secondCont = document.querySelector(".secondCont");
	const backToLogin = document.querySelector(".backToLogin");


	backToLogin.addEventListener("click", () => {
		window.location.hash = "#login";
		container.classList.remove("d-none");
		secondCont.classList.add("d-none");
	});
}
function sendCodeReset() {
	var email;
	if (localStorage.getItem('email') != null)
		email = localStorage.getItem('email');


	function getOtpCode() {
		const otpInputs = document.querySelectorAll("#token_code .otp-input");
		let otpCode = '';

		otpInputs.forEach(input => {
			otpCode += input.value;
		});
		return otpCode;

	}
	if (email) { }

	const new_password1 = sanitizeMessage(document.getElementById('pass1').value);
	const new_password2 = sanitizeMessage(document.getElementById('pass2').value);
	const token = getOtpCode();

	const data = {
		new_password1: new_password1,
		new_password2: new_password2,
		token: token,
		email: email
	};

	fetch(window.location.origin + '/api/password/reset/confirm/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})
	.then(response => {
		if (!response.ok) {
			return response.json().then(errorData => {
				if (errorData.token) {
					document.getElementById('result_checkPass').innerHTML = `<p class="text-danger">Error: Code : ${errorData.token}</p>`;

				}
				else if (errorData.email) {

					document.getElementById('result_checkPass').innerHTML = `<p class="text-danger">Error: Email :  Invalid email ${errorData.email}</p>`;

				} else if (errorData.new_password1) {

					document.getElementById('result_checkPass').innerHTML = `<p class="text-danger">Error: Re-Passeword : ${errorData.new_password1}</p>`;

				} else if (errorData.new_password2) {
					document.getElementById('result_checkPass').innerHTML = `<p class="text-danger">Error: Re-Passeword : ${errorData.new_password2}</p>`;
				}
			});
		}
		loadContentInDiv('#login');
		return response.json();
	})
	.then(data => {
	})
	.catch((error) => {
	});

}
