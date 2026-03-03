
const SUPABASE_URL = 'https://rmefajtxoshjflacccfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZWZhanR4b3NoamZsYWNjY2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTY0NTYsImV4cCI6MjA4Njk5MjQ1Nn0.2w6gXRJqtK_UffBssay9DT3maP6Pp7gS9rKGL4wiQw8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const setPasswordForm = document.getElementById('setPasswordForm');
const successState = document.getElementById('successState');
const userEmailEl = document.getElementById('userEmail');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const matchText = document.getElementById('matchText');

const ruleLength = document.getElementById('ruleLength');
const ruleUpper = document.getElementById('ruleUpper');
const ruleLower = document.getElementById('ruleLower');
const ruleNumber = document.getElementById('ruleNumber');

const toggleNewPassword = document.getElementById('toggleNewPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');


window.addEventListener('DOMContentLoaded', async () => {
    // URL'de hash fragment (davet token) var mı kontrol et
    const hashFragment = window.location.hash;
    const hasInviteToken = hashFragment && (hashFragment.includes('access_token') || hashFragment.includes('type=invite') || hashFragment.includes('type=recovery'));

    // Doğrudan açıldıysa (token yoksa) formu direkt göster
    if (!hasInviteToken) {
        showForm('(Önizleme Modu)');
        return;
    }

    // Token varsa normal doğrulama akışı
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            showError('Oturum doğrulanırken hata oluştu: ' + error.message);
            return;
        }

        if (!data.session) {
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    showForm(session.user.email);
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    showForm(session.user.email);
                }
            });

            setTimeout(async () => {
                const { data: retryData } = await supabaseClient.auth.getSession();
                if (!retryData.session) {
                    showError('Geçersiz veya süresi dolmuş davet linki. Lütfen yöneticinizden yeni bir davet isteyin.');
                }
            }, 3000);
        } else {
            showForm(data.session.user.email);
        }
    } catch (err) {
        showError('Beklenmeyen bir hata oluştu: ' + err.message);
    }
});


function showForm(email) {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    successState.style.display = 'none';
    setPasswordForm.style.display = 'block';

    if (email) {
        userEmailEl.textContent = email;
    }
}

function showError(message) {
    loadingState.style.display = 'none';
    setPasswordForm.style.display = 'none';
    successState.style.display = 'none';
    errorState.style.display = 'flex';

    if (message) {
        errorMessage.textContent = message;
    }
}

function showSuccess() {
    loadingState.style.display = 'none';
    setPasswordForm.style.display = 'none';
    errorState.style.display = 'none';
    successState.style.display = 'flex';
}


function checkPasswordStrength(password) {
    let score = 0;

    const hasLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;

    updateRule(ruleLength, hasLength);
    updateRule(ruleUpper, hasUpper);
    updateRule(ruleLower, hasLower);
    updateRule(ruleNumber, hasNumber);

    const strengthMap = {
        0: { width: '0%', color: '', text: '' },
        1: { width: '25%', color: '#ef4444', text: 'Zayıf' },
        2: { width: '50%', color: '#f59e0b', text: 'Orta' },
        3: { width: '75%', color: '#22c55e', text: 'İyi' },
        4: { width: '100%', color: '#16a34a', text: 'Güçlü' }
    };

    const level = strengthMap[score];
    strengthBar.style.width = level.width;
    strengthBar.style.background = level.color;
    strengthText.textContent = level.text;
    strengthText.style.color = level.color;

    return { score, hasLength, hasUpper, hasLower, hasNumber };
}

function updateRule(element, isValid) {
    if (isValid) {
        element.classList.add('valid');
        element.classList.remove('invalid');
    } else {
        element.classList.remove('valid');
        element.classList.add('invalid');
    }
}


function checkPasswordMatch() {
    const password = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    if (confirm.length === 0) {
        matchText.textContent = '';
        matchText.className = 'match-text';
        return false;
    }

    if (password === confirm) {
        matchText.textContent = '✓ Şifreler eşleşiyor';
        matchText.className = 'match-text match';
        return true;
    } else {
        matchText.textContent = '✗ Şifreler eşleşmiyor';
        matchText.className = 'match-text no-match';
        return false;
    }
}


function validateForm() {
    const password = newPasswordInput.value;
    const strength = checkPasswordStrength(password);
    const isMatch = checkPasswordMatch();

    const allRulesPassed = strength.hasLength && strength.hasUpper && strength.hasLower && strength.hasNumber;

    submitBtn.disabled = !(allRulesPassed && isMatch);
}


newPasswordInput.addEventListener('input', validateForm);
confirmPasswordInput.addEventListener('input', validateForm);

toggleNewPassword.addEventListener('click', () => {
    const isHidden = newPasswordInput.type === 'password';
    newPasswordInput.type = isHidden ? 'text' : 'password';

    const icon = toggleNewPassword.querySelector('i');
    icon.classList.toggle('fa-eye', !isHidden);
    icon.classList.toggle('fa-eye-slash', isHidden);
});

toggleConfirmPassword.addEventListener('click', () => {
    const isHidden = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isHidden ? 'text' : 'password';

    const icon = toggleConfirmPassword.querySelector('i');
    icon.classList.toggle('fa-eye', !isHidden);
    icon.classList.toggle('fa-eye-slash', isHidden);
});


setPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword !== confirmPassword) {
        matchText.textContent = '✗ Şifreler eşleşmiyor!';
        matchText.className = 'match-text no-match';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Şifre belirleniyor...';

    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Şifremi Belirle';
            showError('Şifre belirlenirken hata oluştu: ' + error.message);
            return;
        }

        // Başarılı — başarı mesajını göster, 3 saniye sonra login sayfasına yönlendir
        showSuccess();

        setTimeout(() => {
            window.location.href = '/frontend/login-frontend/login.html';
        }, 3000);

    } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Şifremi Belirle';
        showError('Beklenmeyen bir hata oluştu: ' + err.message);
    }
});
