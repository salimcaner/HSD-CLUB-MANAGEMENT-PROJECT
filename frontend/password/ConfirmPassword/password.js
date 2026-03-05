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
        alert("Bağlantı hatası: " + errorMessage + "\nLütfen yeni bir davet isteyin (Davet linkleri tek kullanımlıktır).");
    } else {
        alert("Geçersiz veya eksik token. Lütfen e-postanıza gelen davet linkini kontrol edin. (Linkin tamamını kopyaladığınızdan emin olun)");
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
        alert("Geçersiz veya eksik token! Güvenlik nedeniyle bu sayfadan işlem yapılamaz.");
        return;
    }

    const passwordVal = newPassword.value;
    const confirmVal = confirmPassword.value;

    if (passwordVal !== confirmVal) {
        alert("Şifreler birbiriyle eşleşmiyor. Lütfen kontrol edip tekrar deneyin.");
        return;
    }

    if (passwordVal.length < 6) {
        alert("Şifreniz en az 6 karakter uzunluğunda olmalıdır.");
        return;
    }

    // İstek başlıyor, butonu devre dışı bırakalım ki art arda basılmasın
    const originalBtnText = btn.textContent;
    btn.textContent = "Kaydediliyor...";
    btn.disabled = true;

    try {
        const response = await fetch(`http://127.0.0.1:8001/auth/reset-password`, {
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
            alert("Şifreniz başarıyla oluşturuldu! Giriş ekranına yönlendiriliyorsunuz...");
            // Kullanıcıyı login sayfasına yönlendir
            window.location.href = '../login-frontend/login.html';
        } else {
            throw new Error(data.detail || 'Şifre sıfırlanırken bir hata oluştu');
        }

    } catch (error) {
        console.error("Şifre sıfırlama hatası:", error);
        alert(`Hata: ${error.message}`);
    } finally {
        // Hata durumunda butonu eski haline getir
        btn.textContent = originalBtnText;
        btn.disabled = false;
    }
});
