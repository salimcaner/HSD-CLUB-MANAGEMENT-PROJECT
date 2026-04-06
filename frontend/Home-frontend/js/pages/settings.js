export function renderSettings() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  
  return `
    <link rel="stylesheet" href="../css/settings.css">
    <div class="settings-page">
      <div class="settings-header">
        <h1>Ayarlar</h1>
      </div>

      <div class="settings-content">
        <!-- Tema Ayarı Kartı -->
        <div class="settings-card">
          <div class="settings-card-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <h2>Görünüm</h2>
          </div>
          <div class="settings-card-body">
            <p class="settings-desc">Uygulama temasını açık veya koyu mod olarak değiştirebilirsiniz.</p>
            <div class="theme-options">
              <label class="theme-option ${currentTheme !== 'light' ? 'active' : ''}">
                <input type="radio" name="appTheme" value="dark" ${currentTheme !== 'light' ? 'checked' : ''}>
                <div class="theme-option-content">
                  <div class="theme-color-preview dark-preview"></div>
                  <span>Koyu Tema</span>
                </div>
              </label>
              <label class="theme-option ${currentTheme === 'light' ? 'active' : ''}">
                <input type="radio" name="appTheme" value="light" ${currentTheme === 'light' ? 'checked' : ''}>
                <div class="theme-option-content">
                  <div class="theme-color-preview light-preview"></div>
                  <span>Açık Tema</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Güvenlik Kartı -->
        <div class="settings-card">
          <div class="settings-card-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h2>Güvenlik</h2>
          </div>
          <div class="settings-card-body">
            <p class="settings-desc">Hesap güvenliğiniz için şifre işlemlerini buradan yapabilirsiniz.</p>
            <div class="security-options">
              <button class="forgot-password-btn" onclick="window.location.href='../../password/ConfirmPassword/password.html'">Şifremi Unuttum</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function initSettings() {
  const themeRadios = document.querySelectorAll('input[name="appTheme"]');
  
  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      
      // Label "active" class güncellemesi UI için
      document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active'));
      e.target.closest('.theme-option').classList.add('active');

      // Tema Değiştirme Mantığı
      if (selectedTheme === "light") {
        document.body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
      } else {
        document.body.classList.remove("light-theme");
        localStorage.setItem("theme", "dark");
      }
    });
  });
}