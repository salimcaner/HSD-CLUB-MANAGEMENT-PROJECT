const isLocal = window.location.hostname === "127.0.0.1" 
             || window.location.hostname === "localhost";
const BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

const container = document.querySelector('.container');
const btn = document.querySelector('.btn');
const loginForm = document.querySelector('#LoginForm');
const loginEmail = document.querySelector('#loginEmail');
const loginPassword = document.getElementById('loginPassword');
const toggleBtn = document.getElementById("togglePassword");
const toggleIcon = toggleBtn.querySelector("i");
const loginMessage = document.getElementById('loginMessage');

// Hatırlanan e-postayı kontrol et ve doldur
const rememberedEmail = localStorage.getItem('remembered_email');
if (rememberedEmail) {
    loginEmail.value = rememberedEmail;
    // Bir kere doldurduktan sonra silebiliriz veya tutabiliriz, kullanıcı deneyimine göre
    // localStorage.removeItem('remembered_email'); 
}

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
        const response = await fetch(`${BASE_URL}/auth/login`, {
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

            const fullName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim();
            showMessage(`Hoş geldiniz ${fullName}!`, 'success');
            loginEmail.value = '';
            loginPassword.value = '';
            localStorage.removeItem('remembered_email');

            setTimeout(() => {
                window.location.href = '../Home-frontend/html/index.html';
            }, 1000);
        } else {
            throw new Error(data.detail || 'Giriş sırasında bir hata oluştu');
        }

    } catch (error) {
        let userFriendlyMessage = "Giriş sırasında bir hata oluştu.";
        
        if (error.message === 'Failed to fetch') {
            userFriendlyMessage = "Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.";
        } else if (error.message.includes("Email veya şifre hatalı")) {
            userFriendlyMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
        } else if (error.message.includes("Kullanıcı profili bulunamadı")) {
            userFriendlyMessage = "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.";
        } else {
            userFriendlyMessage = error.message;
        }
        
        showMessage(userFriendlyMessage, 'error');
    }
});

toggleBtn.addEventListener("click", () => {
    const isHidden = loginPassword.type === "password";
    loginPassword.type = isHidden ? "text" : "password";

    toggleIcon.classList.toggle("fa-eye", !isHidden);
    toggleIcon.classList.toggle("fa-eye-slash", isHidden);

});