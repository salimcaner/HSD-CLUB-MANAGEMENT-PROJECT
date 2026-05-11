const isLocal = window.location.hostname === "127.0.0.1"
    || window.location.hostname === "localhost";
const BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

const form = document.getElementById("UpdatePasswordForm");
const oldPasswordInput = document.getElementById("oldPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordMessage = document.getElementById("passwordMessage");
const submitButton = document.querySelector(".btn");

function showMessage(text, type) {
    passwordMessage.textContent = text;
    passwordMessage.className = `login-message ${type}`;
}

function togglePassword(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    const icon = toggle.querySelector("i");

    toggle.addEventListener("click", () => {
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        icon.classList.toggle("fa-eye", !isHidden);
        icon.classList.toggle("fa-eye-slash", isHidden);
    });
}

togglePassword("oldPassword", "toggleOldPassword");
togglePassword("newPassword", "toggleNewPassword");
togglePassword("confirmPassword", "toggleConfirmPassword");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("access_token");
    if (!token) {
        showMessage("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.", "error");
        return;
    }

    const oldPassword = oldPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (newPassword !== confirmPassword) {
        showMessage("Yeni şifre ile tekrar alanı aynı olmalıdır.", "warning");
        return;
    }

    if (!PASSWORD_RULE.test(newPassword)) {
        showMessage("Yeni şifre en az 6 karakter olmalı, bir büyük ve bir küçük harf içermelidir.", "warning");
        return;
    }

    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Güncelleniyor...";

    try {
        const response = await fetch(`${BASE_URL}/auth/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Şifre güncellenirken bir hata oluştu.");
        }

        showMessage("Şifreniz başarıyla güncellendi.", "success");
        setTimeout(() => {
            window.location.href = "/frontend/Home-frontend/html/index.html#/settings";
        }, 1000);
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});
