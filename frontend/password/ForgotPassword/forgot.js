
const isLocal = window.location.hostname === "127.0.0.1" 
             || window.location.hostname === "localhost";
const BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

const forgotForm = document.querySelector('#ForgotForm');
const forgotEmail = document.querySelector('#forgotEmail');
const submitBtn = document.querySelector('#submitBtn');

const forgotMessage = document.getElementById('forgotMessage');

function showMessage(text, type) {
    forgotMessage.textContent = text;
    forgotMessage.className = `login-message ${type}`;
    forgotMessage.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            forgotMessage.style.display = 'none';
        }, 3000);
    }
}

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = forgotEmail.value.trim();

    if (!email) {
        showMessage("Lütfen e-posta adresinizi girin.", "error");
        return;
    }

    // Butonu devre dışı bırak
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Gönderiliyor...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            // E-postayı login sayfasında hatırlamak için kaydet
            localStorage.setItem('remembered_email', email);
            
            showMessage(data.message || "Sıfırlama bağlantısı e-posta adresinize gönderildi.", "success");
            forgotEmail.value = '';
            
            setTimeout(() => {
                window.location.href = "/frontend/login-frontend/login.html";
            }, 3000);
        } else {
            throw new Error(data.detail || "Bir hata oluştu. Lütfen tekrar deneyin.");
        }

    } catch (error) {
        console.error("Şifremi unuttum hatası:", error);
        showMessage(error.message, "error");
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});
