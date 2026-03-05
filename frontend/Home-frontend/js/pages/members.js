import { hasPerm } from "../acl.js";
import { getToken } from "../store.js";

const API_URL = "http://localhost:8000";

let membersData = [];
let currentUser = null;
let currentView = "table"; // veya "grid"
let searchQuery = "";
let roleFilter = "";
let isLoading = true;

function formtDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("tr-TR");
}
const banuBolumler = [
  "Antrenörlük Eğitimi",
  "Beden Eğitimi ve Spor Öğretmenliği",
  "Beslenme ve Diyetetik",
  "Bilgisayar Mühendisliği",
  "Çalışma Ekonomisi ve Endüstri İlişkileri",
  "Deniz Ulaştırma İşletme Mühendisliği",
  "Denizcilik İşletmeleri Yönetimi",
  "Ekonometri",
  "Elektrik Mühendisliği",
  "Elektrik-Elektronik Mühendisliği",
  "Fizyoterapi ve Rehabilitasyon",
  "Gemi İnşaatı ve Gemi Makineleri Mühendisliği",
  "Gemi Makineleri İşletme Mühendisliği",
  "Grafik Tasarımı",
  "Halkla İlişkiler ve Reklamcılık",
  "Hemşirelik",
  "İktisat",
  "İslami İlimler",
  "İşletme",
  "Maliye",
  "Mütercim ve Tercümanlık",
  "Sanat Tarihi",
  "Sağlık Yönetimi",
  "Siyaset Bilimi ve Kamu Yönetimi",
  "Sosyal Hizmet",
  "Sosyoloji",
  "Spor Yöneticiliği",
  "Tarih",
  "Tıp",
  "Türk Dili ve Edebiyatı",
  "Uluslararası İlişkiler",
  "Uluslararası Ticaret ve Lojistik",
  "Yazılım Mühendisliği",
  "Yeni Medya ve İletişim",
  "Yönetim Bilişim Sistemleri"
];

export function renderMembers(user) {
  currentUser = user;

  if (!hasPerm(user, "members:read")) {
    return `
      <div class="no-permission">
        <div class="big-icon">🔒</div>
        <h2>Bu sayfayı görüntüleme yetkiniz yok</h2>
      </div>
    `;
  }

  const canCreate = hasPerm(user, "members:create");

  return `
    <section class="members-page">
      <div class="members-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 20px;">
        <div class="members-title-block">
          <h1 style="font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: normal;">Üye Listesi</h1>
        </div>
        ${canCreate ? `<button class="btn btn-red" id="btnAddMember">
          + Üye Ekle
        </button>` : ''}
      </div>

      <div class="members-toolbar" style="display: none;">
        <!-- Hidden for design match, can be toggled by JS later if needed -->
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="memberSearch" placeholder="İsim veya e-posta ara...">
        </div>
        <select class="filter-select" id="roleFilter">
          <option value="">Tüm Roller</option>
          <option value="ELCI">Elçi</option>
          <option value="ELCI_YARDIMCISI">Elçi Yardımcısı</option>
          <option value="GENEL_SEKRETER">Genel Sekreter</option>
          <option value="INSAN_KAYNAKLARI">İnsan Kaynakları</option>
          <option value="KOMITE_LIDERI">Komite Lideri</option>
          <option value="UYE">Üye</option>
        </select>
        
        <!-- View Toggle Removed to force Table View -->

        ${canCreate ? `<button class="btn btn-red" id="btnAddMember">
          + Üye Ekle
        </button>` : ''}
      </div>

      <div id="membersContent">
        <!-- Table or Grid will be rendered here -->
      </div>
    </section>

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" id="memberModalOverlay">
      <div class="modal">
        <div class="modal-header">
          <h2 id="memberModalTitle">Yeni <span>Üye Ekle</span></h2>
          <button class="modal-close" id="btnMemberModalClose">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="memberForm">
            <input type="hidden" id="memberId">
            <div class="form-row">
              <div class="form-group">
                <label>İsim</label>
                <input type="text" id="memberFirstName" required>
              </div>
              <div class="form-group">
                <label>Soyisim</label>
                <input type="text" id="memberLastName" required>
              </div>
            </div>
            <div class="form-group">
              <label>E-posta</label>
              <input type="email" id="memberEmail" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Topluluk Departmanı</label>
                <select id="memberDepartment" required>
                  <option value="" disabled selected>Departman Seç</option>
                  <option value="Proje">Proje Departmanı</option>
                  <option value="Eğitim">Akademi Departmanı</option>
                  <option value="İnsan Kaynakları">İnsan Kaynakları </option>
                  <option value="Organizasyon">Sponsorluk ve Organizasyon Departmanı</option>
                  <option value="Tasarım ve Medya">Tasarım ve Medya Departmanı</option>
                  <option value="PR ve Kurumsal İletişim">PR ve Kurumsal İletişim Departmanı</option>
                </select>
              </div>
              <div class="form-group">
                <label>Rol</label>
                <select id="memberRole" required>
                  <option value="uye">Üye</option>
                  <option value="lider">Komite Lideri</option>
                  <option value="genel_sekreter">İnsan Kaynakları</option>
                  <option value="genel_sekreter">Genel Sekreter</option>
                  <option value="elci">Elçi Yardımcısı</option>
                  <option value="elci">Elçi</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Üniversite Bölümü</label>
                <select id="memberUniDepartment" required>
                  <option value="">Seçiniz</option>
                  ${banuBolumler.map(x => `<option value="${x}">${x}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label>Sınıfı</label>
                <select id="memberClass" required>
                  <option value="Hazırlık">Hazırlık</option>
                  <option value="1. Sınıf">1. Sınıf</option>
                  <option value="2. Sınıf">2. Sınıf</option>
                  <option value="3. Sınıf">3. Sınıf</option>
                  <option value="4. Sınıf">4. Sınıf</option>
                  <option value="5. Sınıf">5. Sınıf</option>
                  <option value="6. Sınıf">6. Sınıf</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btnMemberModalCancel">İptal</button>
          <button type="button" class="btn btn-primary" id="btnMemberModalSave">Kaydet</button>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div class="confirm-overlay" id="confirmOverlay">
        <div class="confirm-box">
            <h3>Üyeyi Sil</h3>
            <p>Bu üyeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div class="confirm-actions">
                <button type="button" class="btn btn-ghost" id="btnConfirmCancel">İptal</button>
                <button type="button" class="btn btn-danger" id="btnConfirmDelete">Sil</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>
  `;
}

function renderMembersContent() {
  const contentEl = document.getElementById("membersContent");
  if (!contentEl) return;

  if (isLoading) {
    contentEl.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Yükleniyor...</div>`;
    return;
  }

  let filtered = membersData;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m =>
      (m.first_name && m.first_name.toLowerCase().includes(q)) ||
      (m.last_name && m.last_name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }

  if (roleFilter) {
    filtered = filtered.filter(m => m.role === roleFilter);
  }

  const totalMembersEl = document.getElementById("totalMembersCount");
  if (totalMembersEl) {
    totalMembersEl.innerText = filtered.length;
  }

  if (filtered.length === 0) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <p>Gösterilecek üye bulunamadı.</p>
      </div>
    `;
    return;
  }

  const canUpdate = hasPerm(currentUser, "members:update");
  const canDelete = hasPerm(currentUser, "members:delete");

  if (currentView === "table") {
    let tbodyHtml = filtered.map(m => {
      const initials = ((m.first_name?.[0] || 'X') + (m.last_name?.[0] || 'Y')).toUpperCase();
      const date = formtDate(m.created_at);

      let actionsHtml = '';
      if (canUpdate || canDelete) {
        actionsHtml = '<div class="action-btns">';
        if (canUpdate) {
          actionsHtml += `<button class="icon-btn-simple" onclick="editMember('${m.id}')" title="Düzenle">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted)" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>`;
        }
        if (canDelete) {
          actionsHtml += `<button class="icon-btn-simple delete" onclick="deleteMemberConfirm('${m.id}')" title="Sil">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
            </button>`;
        }
        actionsHtml += '</div>';
      }

      // "Aktif" and "Pasif" depending on if they logged in or have missing fields
      // Eğer kullanıcı profilini tamamlamışsa (sınıf bilgisi vs. varsa) "Aktif" diyelim ya da is_active var sayalım
      let durum = "Aktif";
      let durumClass = "status-active";
      if (m.is_active === false || (!m.class_ && !m.university_department)) {
        // Profil tablosunda "is_active" olmadığında, 
        // ya da ilk girişte profil doldurma zorunlu olduğu için
        // profil bilgisi boş olanların mail onayını henüz yapıp girmediğini varsayabiliriz.
        durum = "Pasif";
        durumClass = "status-passive";
      }

      return `
        <tr>
          <td>
            <div class="member-name-cell">
              <div class="name">${m.first_name || '-'}</div>
            </div>
          </td>
          <td>${m.last_name || '-'}</td>
          <td>${m.email || '-'}</td>
          <td>${m.department || '-'}</td>
          <td><span class="role-badge role-${m.role || 'UYE'}">${(m.role || 'UYE').replace('_', ' ')}</span></td>
          <td>${m.university_department || '-'}</td>
          <td>${m.class_ ? m.class_ + '. Sınıf' : '-'}</td>
          <td><span class="status-badge ${durumClass}">${durum}</span></td>
          <td>${date}</td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join("");

    contentEl.innerHTML = `
      <div class="members-table-wrap" style="overflow-x: auto;">
        <table class="members-table" style="min-width: 1000px;">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Soyad</th>
              <th>E-posta</th>
              <th>Departman</th>
              <th style="padding-left: 24px;">Rol</th>
              <th>Üni. Bölümü</th>
              <th>Sınıf</th>
              <th>Durum</th>
              <th>Katılım Tarihi</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      </div>
    `;
  }
}

let memberToDelete = null;

async function fetchMembers() {
  isLoading = true;
  renderMembersContent();
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include' // Switch to include if auth cookie logic is fully applied
    });

    if (!res.ok) throw new Error("Üyeler getirilemedi");
    const data = await res.json();
    membersData = data || [];
  } catch (error) {
    console.error("API Hatası:", error);
    showToast("Veriler sunucudan alınamadı.", "error");
  } finally {
    isLoading = false;
    renderMembersContent();
  }
}

export function initMembers() {
  fetchMembers();

  const searchInput = document.getElementById("memberSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderMembersContent();
    });
  }

  const roleFilterSelect = document.getElementById("roleFilter");
  if (roleFilterSelect) {
    roleFilterSelect.addEventListener("change", (e) => {
      roleFilter = e.target.value;
      renderMembersContent();
    });
  }

  // View toggles removed

  const btnAddMember = document.getElementById("btnAddMember");
  const memberModalOverlay = document.getElementById("memberModalOverlay");
  const btnMemberModalClose = document.getElementById("btnMemberModalClose");
  const btnMemberModalCancel = document.getElementById("btnMemberModalCancel");
  const btnMemberModalSave = document.getElementById("btnMemberModalSave");

  if (btnAddMember) {
    btnAddMember.addEventListener("click", () => {
      document.getElementById("memberForm").reset();
      document.getElementById("memberId").value = "";
      document.getElementById("memberModalTitle").innerHTML = `Yeni <span>Üye Ekle</span>`;
      memberModalOverlay.classList.add("open");
    });
  }

  const closeModal = () => {
    if (memberModalOverlay) memberModalOverlay.classList.remove("open");
  };

  if (btnMemberModalClose) btnMemberModalClose.addEventListener("click", closeModal);
  if (btnMemberModalCancel) btnMemberModalCancel.addEventListener("click", closeModal);

  if (btnMemberModalSave) {
    btnMemberModalSave.addEventListener("click", async () => {
      const idVal = document.getElementById("memberId").value;
      const fName = document.getElementById("memberFirstName").value.trim();
      const lName = document.getElementById("memberLastName").value.trim();
      const email = document.getElementById("memberEmail").value.trim();
      const dep = document.getElementById("memberDepartment").value;
      const role = document.getElementById("memberRole").value;
      const uniDep = document.getElementById("memberUniDepartment").value.trim();
      const mClassStr = document.getElementById("memberClass").value.trim();
      const mClass = mClassStr ? parseInt(mClassStr) : null;

      if (!fName || !lName || !email) {
        showToast("Lütfen isim, soyisim ve e-posta gibi zorunlu alanları doldurun.", "error");
        return;
      }

      const btn = btnMemberModalSave;
      const originalText = btn.innerText;
      btn.innerText = "Kaydediliyor...";
      btn.disabled = true;

      const payload = {
        email: email,
        first_name: fName,
        last_name: lName,
        role: role,
        department: dep || null,
        class_: mClass,
        university_department: uniDep || null
      };

      try {
        if (idVal) {
          // PUT /users/{id}
          const token = getToken();
          const res = await fetch(`${API_URL}/users/${idVal}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error("Güncelleme başarısız!");
          showToast("Üye bilgileri başarıyla güncellendi.", "success");
        } else {
          // POST /auth/invite
          const token = getToken();
          const res = await fetch(`${API_URL}/auth/invite`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error("Ekleme başarısız!");
          showToast("Yeni üye başarıyla davet edildi/eklendi.", "success");
        }

        closeModal();
        fetchMembers();
      } catch (err) {
        console.error(err);
        showToast(err.message || "Bilinmeyen bir hata oluştu.", "error");
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
  }

  const confirmOverlay = document.getElementById("confirmOverlay");
  const btnConfirmCancel = document.getElementById("btnConfirmCancel");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");

  const closeConfirm = () => {
    if (confirmOverlay) confirmOverlay.classList.remove("open");
    memberToDelete = null;
  };

  if (btnConfirmCancel) btnConfirmCancel.addEventListener("click", closeConfirm);
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", async () => {
      if (memberToDelete) {
        const btn = btnConfirmDelete;
        const originalText = btn.innerText;
        btn.innerText = "Siliniyor...";
        btn.disabled = true;
        try {
          const token = getToken();
          const res = await fetch(`${API_URL}/users/${memberToDelete}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            credentials: 'include'
          });
          if (!res.ok) throw new Error("Silinemedi");
          showToast("Üye başarıyla silindi.", "success");
          fetchMembers();
        } catch (err) {
          showToast("Silme işlemi başarısız.", "error");
          console.error(err);
        } finally {
          btn.innerText = originalText;
          btn.disabled = false;
        }
      }
      closeConfirm();
    });
  }

  window.editMember = (id) => {
    const mem = membersData.find(m => String(m.id) === String(id));
    if (!mem) return;

    document.getElementById("memberId").value = mem.id;
    document.getElementById("memberFirstName").value = mem.first_name || '';
    document.getElementById("memberLastName").value = mem.last_name || '';
    document.getElementById("memberEmail").value = mem.email || '';
    document.getElementById("memberDepartment").value = mem.department || '';
    document.getElementById("memberRole").value = mem.role || 'UYE';
    document.getElementById("memberUniDepartment").value = mem.university_department || '';
    document.getElementById("memberClass").value = mem.class_ || '';

    document.getElementById("memberModalTitle").innerHTML = `Üye <span>Düzenle</span>`;
    memberModalOverlay.classList.add("open");
  };

  window.deleteMemberConfirm = (id) => {
    memberToDelete = id;
    confirmOverlay.classList.add("open");
  };
}

function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}