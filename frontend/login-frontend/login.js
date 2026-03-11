const container = document.querySelector('.container');
const btn = document.querySelector('.btn');
const loginForm = document.querySelector('#LoginForm');
const loginEmail = document.querySelector('#loginEmail');
const loginPassword = document.getElementById('loginPassword');
const toggleBtn = document.getElementById("togglePassword");
const toggleIcon = toggleBtn.querySelector("i");
const loginMessage = document.getElementById('loginMessage');

function showMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `login-message ${type}`;

    // Mesajı belli bir süre sonra temizle (hata ise kalsın, başarı ise yönlendirme zaten olacak)
    if (type === 'success') {
        setTimeout(() => {
            loginMessage.style.display = 'none';
        }, 3000);
    }
}


btn.addEventListener('click', () => {
    container.classList.remove('active');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginEmail.value;
    const password = loginPassword.value;

    try {
        const response = await fetch(`http://127.0.0.1:8000/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showMessage(`Hoş geldiniz ${data.user.full_name}!`, 'success');
            loginEmail.value = '';
            loginPassword.value = '';

            setTimeout(() => {
                window.location.href = '../Home-frontend/html/index.html';
            }, 1000);
        } else {
            throw new Error(data.detail || 'Giriş sırasında bir hata oluştu');
        }

    } catch (error) {
        const userFriendlyMessage = (error.message === 'Failed to fetch' || error.message === 'Giriş sırasında bir hata oluştu')
            ? 'Girilen E-posta veya Şifre hatalı'
            : error.message;
        showMessage(userFriendlyMessage, 'error');
    }
});

toggleBtn.addEventListener("click", () => {
    const isHidden = loginPassword.type === "password";
    loginPassword.type = isHidden ? "text" : "password";

    toggleIcon.classList.toggle("fa-eye", !isHidden);
    toggleIcon.classList.toggle("fa-eye-slash", isHidden);

});