


function function_to_reset_pass() {

    const checkPass = document.querySelector(".checkPass");
    const resetPassForm = document.querySelector(".resetPass");

const email = sanitizeMessage(document.getElementById('email_reset').value);
if (!email) {
    // Si l'email est vide, on arrête la fonction et on montre un message d'erreur.
    document.getElementById('result_reset').innerHTML = `<span class="text-danger">Please enter a valid email address.</span>`;
    return;
}

// On prépare les données à envoyer
const data = {
    email: email
};

fetch(window.location.origin + '/api/password/reset/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
.then(response => {
    if (!response.ok) {
        return response.json().then(errorData => {
            document.getElementById('result_reset').innerHTML = `<span class="text-danger">Error: ${errorData.email}</span>`;
        });
    }
    localStorage.setItem('email', data.email);
    window.location.hash = "#check_pass";

   loadContentInDiv("#check_pass");
    


})
.catch((error) => {
    document.getElementById('result_reset').innerHTML = `<span class="text-danger">There was an issue with your request. Please try again later.</span>`;
});
}
