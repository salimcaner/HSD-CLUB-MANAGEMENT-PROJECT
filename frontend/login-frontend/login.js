
const container = document.querySelector('.container');
const btn = document.querySelector('.btn');
const loginForm = document.querySelector('#loginForm');
const loginEmail = document.querySelector('#loginEmail');
const loginPassword = document.getElementById('loginPassword');
const toggleBtn = document.getElementById("togglePassword");
const toggleIcon = toggleBtn.querySelector("i");

btn.addEventListener('click', () =>{
    container.classList.remove('active');
});

// loginForm.addEventListener('submit', async (e) => {
//     e.preventDefault(); // Formun varsayılan gönderme işlemini engelle

//     const email = loginEmail.value;
//     const password = loginPassword.value;

// //     try {
// //         // Backend API'ye giriş isteği gönder
// //         const response = await fetch(`${API_BASE_URL}/login`, {
// //             method: 'POST',
// //             headers: {
// //                 'Content-Type': 'application/json',
// //             },
// //             body: JSON.stringify({
// //                 email: email,
// //                 password: password
// //             })
// //         });

// //         const data = await response.json();

//         if (response.ok) {
//             // Giriş başarılı
//             console.log("Giriş başarılı! ID Token:", data.idToken);
            
//             // Token'ı localStorage'a kaydet
//             localStorage.setItem('token', data.idToken);

//             alert("Giriş başarıyla yapıldı!");
//             loginEmail.value = ''; // Inputları temizle
//             loginPassword.value = '';

//             // Kullanıcıyı ana sayfaya yönlendir
//             window.location.href = '#';
//         }
// //         } else {
// //             // Backend'den gelen hata mesajını göster
// //             throw new Error(data.detail || 'Giriş sırasında bir hata oluştu');
// //         }

// //     } catch (error) {
// //         console.error("Giriş hatası:", error);
// //         alert(`Giriş sırasında bir hata oluştu: ${error.message}`);
// //     }
//  });

 toggleBtn.addEventListener("click", () =>{
        const isHidden = loginPassword.type === "password";
        loginPassword.type = isHidden ? "text" : "password";

        toggleIcon.classList.toggle("fa-eye", !isHidden);
        toggleIcon.classList.toggle("fa-eye-slash", isHidden);

 });