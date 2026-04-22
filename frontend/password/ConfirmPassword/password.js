import { showToast } from "../../Home-frontend/js/notifications.js";

const isLocal = window.location.hostname === "127.0.0.1" 
             || window.location.hostname === "localhost";
const BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

const passwordForm = document.querySelector('#PasswordForm');
const newPassword = document.querySelector('#newPassword');
const confirmPassword = document.querySelector('#confirmPassword');
const btn = document.querySelector('.btn');

const toggleBtn1 = document.getElementById("togglePassword1");
const toggleIcon1 = toggleBtn1.querySelector("i");
const toggleBtn2 = document.getElementById("togglePassword2");
const toggleIcon2 = toggleBtn2.querySelector("i");

// Extract access_token from URL hash (Supabase default) or search params
let token = null;

// URL'deki hash'i (eğer Supabase #access_token= formunda gönderiyorsa) okuma:
const hashParams = new URLSearchParams(window.location.hash.substring(1));
let errorMessage = null;

if (hashParams.has('error_description')) {
    errorMessage = hashParams.get('error_description').replace(/\+/g, ' ');
}

if (hashParams.has('access_token')) {
    token = hashParams.get('access_token');
} else {
    // Veya varsayılan query formatından oku: ?token=... (Eğer backend ?token= atıyorsa ki supabase'in action_link'i genelde hash üzerinden fırlatır)
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.has('token')) {
        token = queryParams.get('token');
    } else if (queryParams.has('access_token')) {
        token = queryParams.get('access_token');
    } else if (queryParams.has('error_description')) {
        errorMessage = queryParams.get('error_description').replace(/\+/g, ' ');
    }
}

if (!token) {
    if (errorMessage) {
        showToast("Bağlantı hatası: " + errorMessage, 'error');
    } else {
        showToast("Geçersiz veya eksik token. Lütfen davet linkini kontrol edin.", 'warning');
    }
    // Butonu ve inputları pasife al ki kullanıcı boşuna işlem yapamasın:
    btn.disabled = true;
    newPassword.disabled = true;
    confirmPassword.disabled = true;
}

toggleBtn1.addEventListener("click", () => {
    const isHidden = newPassword.type === "password";
    newPassword.type = isHidden ? "text" : "password";
    toggleIcon1.classList.toggle("fa-eye", !isHidden);
    toggleIcon1.classList.toggle("fa-eye-slash", isHidden);
});

toggleBtn2.addEventListener("click", () => {
    const isHidden = confirmPassword.type === "password";
    confirmPassword.type = isHidden ? "text" : "password";
    toggleIcon2.classList.toggle("fa-eye", !isHidden);
    toggleIcon2.classList.toggle("fa-eye-slash", isHidden);
});

passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!token) {
        showToast("Geçersiz veya eksik token!", 'error');
        return;
    }

    const passwordVal = newPassword.value;
    const confirmVal = confirmPassword.value;

    if (passwordVal !== confirmVal) {
        showToast("Şifreler birbiriyle eşleşmiyor.", 'warning');
        return;
    }

    if (passwordVal.length < 6) {
        showToast("Şifreniz en az 6 karakter olmalıdır.", 'warning');
        return;
    }

    // İstek başlıyor, butonu devre dışı bırakalım ki art arda basılmasın
    const originalBtnText = btn.textContent;
    btn.textContent = "Kaydediliyor...";
    btn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                new_password: passwordVal
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Şifreniz başarıyla oluşturuldu! Yönlendiriliyorsunuz...", 'success');
            // Kullanıcıyı login sayfasına yönlendir (backend üzerinden sunulduğu için absolute path)
            setTimeout(() => {
                window.location.href = '/frontend/login-frontend/login.html';
            }, 2000);
        } else {
            throw new Error(data.detail || 'Şifre sıfırlanırken bir hata oluştu');
        }

    } catch (error) {
        console.error("Şifre sıfırlama hatası:", error);
        showToast(error.message, 'error');
    } finally {
        // Hata durumunda butonu eski haline getir
        btn.textContent = originalBtnText;
        btn.disabled = false;
    }
});
