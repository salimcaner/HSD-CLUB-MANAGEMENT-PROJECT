import { getUser } from "../store.js";

function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function renderProfile() {
  const user = getUser();
  
  if (!user) {
    return `<div class="profile-page"><h2>Kullanıcı verisi bulunamadı. Lütfen tekrar giriş yapın.</h2></div>`;
  }

  // Determine display values
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";
  const email = user.email || "—";
  const role = user.role ? capitalizeFirstLetter(user.role.replace(/_/g, " ")) : "—";
  const department = user.department || "—";
  const userClass = user.class_ || "—";
  const uniDepartment = user.university_department || "—";
  
  const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : "—";

  return `
    <link rel="stylesheet" href="../css/profile.css">
    <div class="profile-page">
      <div class="profile-header">
        <h1>Pro<span>fil</span></h1>
      </div>
      
      <div class="profile-content">
        <div class="profile-card">
          <div class="profile-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h2>Kişisel Bilgiler</h2>
          </div>
          <div class="profile-card-body">
            <div class="profile-info-grid">
              <div class="profile-info-item">
                <span class="info-label">Ad Soyad</span>
                <span class="info-value">${fullName}</span>
              </div>
              <div class="profile-info-item">
                <span class="info-label">E-posta</span>
                <span class="info-value">${email}</span>
              </div>
              <div class="profile-info-item">
                <span class="info-label">Rol</span>
                <span class="info-value">${role}</span>
              </div>
              <div class="profile-info-item">
                <span class="info-label">Departman</span>
                <span class="info-value">${department}</span>
              </div>
              <div class="profile-info-item">
                <span class="info-label">Sınıf</span>
                <span class="info-value">${userClass}</span>
              </div>
              <div class="profile-info-item">
                <span class="info-label">Üniversite Bölümü</span>
                <span class="info-value">${uniDepartment}</span>
              </div>
              <div class="profile-info-item">
                <span class="info-label">Hesap Oluşturulma Tarihi</span>
                <span class="info-value">${createdDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}