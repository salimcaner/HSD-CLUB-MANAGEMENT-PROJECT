import { hasPerm } from '../acl.js';
import { getUser, getToken } from '../store.js';

const API_URL = "http://127.0.0.1:8000/reports";

let eventsData = []; // Backend'den çekilen veriler
let editingReportId = null;

// ==============================================================================
// 0. BACKEND API ETKİLEŞİM İŞLEMLERİ (FETCH)
// ==============================================================================

async function fetchReportsFromBackend() {
  try {
    const token = getToken();
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    // Arama inputu varsa backend API'ye gönderilebilir ama frontend'de filtreliyoruz şimdilik.
    const url = `${API_URL}/?limit=100`;

    const response = await fetch(url, { method: "GET", headers });

    if (response.ok) {
      const data = await response.json();
      eventsData = data.data || [];
    } else {
      console.error("Raporlar getirilirken hata. HTTP:", response.status);
    }
  } catch (error) {
    console.error("Fetch Reports Error:", error);
  }
}

async function createReportBackend(formData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (response.ok) {
      return true;
    } else {
      const errData = await response.json();
      alert(`Hata: ${errData.detail || 'Rapor oluşturulamadı.'}`);
      return false;
    }
  } catch (error) {
    console.error("Create Report Error:", error);
    return false;
  }
}

async function updateReportBackend(reportId, formData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/${reportId}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (response.ok) {
      return true;
    } else {
      const errData = await response.json();
      alert(`Hata: ${errData.detail || 'Rapor güncellenemedi.'}`);
      return false;
    }
  } catch (error) {
    console.error("Update Report Error:", error);
    return false;
  }
}

async function deleteReportBackend(reportId) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/${reportId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
      return true;
    } else {
      const errData = await response.json();
      alert(`Silemezsiniz: ${errData.detail || 'Hata'}`);
      return false;
    }
  } catch (error) {
    console.error("Delete Report Error:", error);
    return false;
  }
}

async function updateReportStatusBackend(reportId, newStatus) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/${reportId}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      return true;
    } else {
      const errData = await response.json();
      alert(`Hata: ${errData.detail || 'Durum değiştirilemedi.'}`);
      return false;
    }
  } catch (error) {
    console.error("Update Report Status Error:", error);
    return false;
  }
}


const KOMITE_TUR = {
  'Yönetim Kurulu': ['Finans Raporu', 'Toplantı Raporu'],
  'Proje Komitesi': ['Proje Raporu', 'Toplantı Raporu'],
  'Pazarlama ve Sosyal Medya Komitesi': ['Etkinlik Raporu', 'Toplantı Raporu', 'Webinar Raporu'],
  'Sponsorluk ve Organizasyon Komitesi': ['Etkinlik Raporu', 'Toplantı Raporu', 'Webinar Raporu'],
  'Akademi Komitesi': ['Eğitim Raporu', 'Toplantı Raporu'],
};

const PROJE_ADLARI = ['HSD Agency', 'Kulüp Yönetim', 'HSD Arena', 'Mülakat'];
const TUM_TURLER = [...new Set(Object.values(KOMITE_TUR).flat())].sort((a, b) => a.localeCompare(b, 'tr'));

/* ================================
   HELPERS
================================ */

function getStatusColor(status) {
  if (status === 'Approved') return 'green';
  if (status === 'Rejected') return 'red';
  return 'orange';
}

function getStatusLabel(status) {
  if (status === 'Approved') return 'Onaylandı';
  if (status === 'Rejected') return 'Reddedildi';
  return 'Onay Bekliyor';
}

function getPrivacyColor(privacy) {
  if (privacy === 'genel') return 'green';
  if (privacy === 'gizli' || privacy === 'cok_gizli') return 'red';
  return 'blue';
}

function renderRows(reports, isSuperUser, canCreate, canFeedback, user) {
  if (!reports.length) {
    return `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-dim);">Gösterilecek rapor bulunamadı.</td></tr>`;
  }

  return reports.map(r => {
    const formattedDate = new Date(r.created_at).toLocaleDateString('tr-TR');
    const durum_renk = getStatusColor(r.status);
    const durum_etiket = getStatusLabel(r.status);
    const isOwner = r.sender_id === user?.id;
    const senderName = r.profiles ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim() : r.sender_id;

    return `
    <tr class="report-row" data-id="${r.id}">
      <td><span class="report-name" style="font-weight: 600; color: var(--text-main);">${r.report_name || ''}</span></td>
      <td style="color: var(--text-dim);">${senderName}</td>
      <td style="color: var(--text-dim);">${formattedDate}</td>
      <td style="color: var(--text-dim);">${r.committee || ''}</td>
      <td>
        <span class="type-badge" style="background: rgba(255,255,255,0.05); color: var(--text-dim); padding: 4px 8px; border-radius: 4px; font-size: 11px; border: 1px solid var(--border-light);">${r.report_type || ''}</span>
      </td>
      <td><span class="status-badge ${durum_renk}">${durum_etiket}</span></td>
      <td style="visibility: hidden; width: 0; padding: 0;">${r.privacy}</td>
      <td>
        <div class="rp-dropdown">
          <button class="rp-dropdown-toggle">
            İşlemler
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="rp-dropdown-menu">
            <button class="rp-dropdown-item" data-action="download" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              İndir
            </button>
            ${(isSuperUser || (canCreate && isOwner)) ? `
            <button class="rp-dropdown-item" data-action="edit" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Düzenle
            </button>
            ` : ""}
            ${canFeedback ? `
            <div class="rp-dropdown-divider"></div>
            <button class="rp-dropdown-item rp-dropdown-item--approve" data-action="approve" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Onayla
            </button>
            <button class="rp-dropdown-item rp-dropdown-item--reject" data-action="reject" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reddet
            </button>
            ` : ""}
            ${(isSuperUser || (canCreate && isOwner)) ? `
            <div class="rp-dropdown-divider"></div>
            <button class="rp-dropdown-item rp-dropdown-item--delete" data-action="delete" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              Sil
            </button>
            ` : ""}
          </div>
        </div>
      </td>
    </tr>
    `;
  }).join('');
}

export function renderReports(user) {
  const isSuperUser = ["ADMIN", "GENEL_SEKRETER", "ELCI"].includes(user?.role?.toUpperCase());
  const canCreate = hasPerm(user, 'reports:create');
  const canFeedback = hasPerm(user, 'reports:feedback');

  const komiteOptions = Object.keys(KOMITE_TUR).map(k => `<option value="${k}">${k}</option>`).join('');
  const turOptions = TUM_TURLER.map(t => `<option value="${t}">${t}</option>`).join('');
  const modalKomiteOptions = Object.keys(KOMITE_TUR).map(k => `<option value="${k}">${k}</option>`).join('');

  return `
    <div class="reports-page">
      <div class="reports-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 20px; margin-bottom: 20px;">
        <div class="reports-title-block">
          <h1 style="font-family: 'Figtree', sans-serif; font-size: 28px; font-weight: 700; margin: 0;">Rapo<span>rlar</span></h1>
        </div>
        ${canCreate ? `<button class="btn btn-primary" id="createReportBtn">
          + Yeni Rapor
        </button>` : ''}
      </div>

      <div class="reports-toolbar" style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;">
        <div class="search-box" style="position: relative; flex: 1; min-width: 250px;">
          <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-dim);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="searchInput" placeholder="Rapor adı ara..." style="width: 100%; padding: 10px 14px 10px 40px; background: var(--bg-dark); border: 1px solid var(--border-light); border-radius: 6px; color: var(--text-main); font-family: 'Figtree', sans-serif; font-size: 14px; outline: none;">
        </div>
        <select class="filter-select" id="sortSelect">
          <option value="tarih-yeni">En Yeni</option>
          <option value="tarih-eski">En Eski</option>
          <option value="ad-az">Ad (A-Z)</option>
          <option value="ad-za">Ad (Z-A)</option>
        </select>
        <select class="filter-select" id="komiteSelect">
          <option value="">Tüm Komiteler</option>
          ${komiteOptions}
        </select>
        <select class="filter-select" id="turSelect">
          <option value="">Tüm Türler</option>
          ${turOptions}
        </select>
      </div>

      <div class="reports-table-wrap">
        <table class="reports-table">
          <thead>
            <tr>
              <th>Rapor Adı</th>
              <th>Ekleyen</th>
              <th>Tarih</th>
              <th>Komite</th>
              <th>Tür</th>
              <th>Durum</th>
              <th style="visibility: hidden; width: 0; padding: 0;">Gizlilik</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="reportsTableBody">
            <!-- Dinamik -->
          </tbody>
        </table>
      </div>

      <!-- YENİ RAPOR MODAL -->
      <div class="rp-modal-overlay" id="createReportModal" style="display:none;">
        <div class="rp-modal">
          <div class="rp-modal-header">
            <h2 class="rp-modal-title">Yeni Rapor Oluştur</h2>
            <button class="rp-modal-close" id="modalCloseBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="rp-modal-body">
            <div class="rp-form-group">
              <label class="rp-label">Rapor Adı <span class="rp-required">*</span></label>
              <input class="rp-input" type="text" id="modalRaporAdi" />
            </div>
            <div class="rp-form-group">
              <label class="rp-label">İlgili Komite <span class="rp-required">*</span></label>
              <select class="rp-modal-select" id="modalKomite">
                <option value="">Seçiniz</option>
                ${modalKomiteOptions}
              </select>
            </div>
            <div class="rp-form-group" id="modalTurGroup">
              <label class="rp-label">Rapor Türü <span class="rp-required">*</span></label>
              <select class="rp-modal-select" id="modalTur" disabled>
                <option value="">Önce komite seçiniz</option>
              </select>
            </div>
            <div class="rp-form-group" id="modalProjeGroup" style="display:none;">
              <label class="rp-label">Proje Adı <span class="rp-required">*</span></label>
              <select class="rp-modal-select" id="modalProjeAdi">
                <option value="">Seçiniz</option>
                ${PROJE_ADLARI.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>
            <div class="rp-form-group">
              <label class="rp-label">Gizlilik Seviyesi</label>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
                <label style="display: flex; align-items: center; gap: 8px; color: #fff; font-size: 13.5px; cursor: pointer;">
                  <input type="checkbox" id="modalGizlilikElci" class="rp-checkbox" style="width: 16px; height: 16px; cursor: pointer;">
                  Sadece Elçi Görsün
                </label>
                <label style="display: flex; align-items: center; gap: 8px; color: #fff; font-size: 13.5px; cursor: pointer;">
                  <input type="checkbox" id="modalGizlilikUye" class="rp-checkbox" style="width: 16px; height: 16px; cursor: pointer;">
                  Sadece Üye Görmesin
                </label>
              </div>
              <div class="rp-hint">
                <span>İkisi de seçilmezse rapor herkes tarafından görüntülenebilir.</span>
              </div>
            </div>
            <div class="rp-form-group">
              <label class="rp-label">Rapor Dosyası (PDF veya Word) <span class="rp-required">*</span></label>
              <div class="rp-file-drop" id="modalFileDrop">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Dosyayı sürükleyin veya <label class="rp-file-link" for="modalFileInput">seçin</label></span>
                <span style="font-size: 11px; opacity: 0.7;">En fazla 10MB büyüklüğünde dosya yükleyiniz.</span>
                <input type="file" id="modalFileInput" accept=".pdf,.doc,.docx" style="display:none;" />
                <span class="rp-file-name" id="modalFileName"></span>
              </div>
            </div>
          </div>
          <div class="rp-modal-footer">
            <button class="rp-btn-cancel" id="modalCancelBtn">İptal</button>
            <button class="rp-btn-submit" id="modalSubmitBtn">Rapor Oluştur</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// INIT AND EVENTS
// ----------------------------------------------------
export async function initReports(userParam) {
  const user = userParam || getUser();
  const isSuperUser = ["ADMIN", "GENEL_SEKRETER", "ELCI"].includes(user?.role?.toUpperCase());
  const canCreate = hasPerm(user, 'reports:create');
  const canFeedback = hasPerm(user, 'reports:feedback');

  const toLowerTR = (str) => (str || '').toLocaleLowerCase('tr-TR');
  // Backend'den çek başlangıçta
  await fetchReportsFromBackend();
  applyFilters();

  function updateTurFilter() {
    const komite = document.getElementById('komiteSelect')?.value || '';
    const turSelect = document.getElementById('turSelect');
    if (!turSelect) return;

    const mevcutDeger = turSelect.value;
    const turler = komite ? (KOMITE_TUR[komite] || []) : TUM_TURLER;

    turSelect.innerHTML = '<option value="">Tüm Türler</option>' +
      turler.map(t => `<option value="${t}">${t}</option>`).join('');

    if (turler.includes(mevcutDeger)) turSelect.value = mevcutDeger;
    applyFilters();
  }

  function applyFilters() {
    const searchInputRaw = document.getElementById('searchInput')?.value || '';
    const search = toLowerTR(searchInputRaw).trim();

    const komite = document.getElementById('komiteSelect')?.value || '';
    const tur = document.getElementById('turSelect')?.value || '';
    const sort = document.getElementById('sortSelect')?.value || 'tarih-yeni';

    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    let filtered = eventsData.filter(r => {
      const raporAdi = toLowerTR(r.report_name);
      const matchSearch = !search || raporAdi.startsWith(search);
      const matchKomite = !komite || r.committee === komite;
      const matchTur = !tur || r.report_type === tur;
      return matchSearch && matchKomite && matchTur;
    });

    const parseDate = dStr => new Date(dStr || 0).getTime();

    filtered.sort((a, b) => {
      if (sort === 'tarih-yeni') return parseDate(b.created_at) - parseDate(a.created_at);
      if (sort === 'tarih-eski') return parseDate(a.created_at) - parseDate(b.created_at);
      if (sort === 'ad-az') return (a.report_name || '').localeCompare(b.report_name || '', 'tr');
      if (sort === 'ad-za') return (b.report_name || '').localeCompare(a.report_name || '', 'tr');
      return 0;
    });

    tbody.innerHTML = renderRows(filtered, isSuperUser, canCreate, canFeedback, user);
  }

  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
  document.getElementById('turSelect')?.addEventListener('change', applyFilters);
  document.getElementById('komiteSelect')?.addEventListener('change', updateTurFilter);
  document.getElementById('createReportBtn')?.addEventListener('click', openReportModal);

  document.body.addEventListener('click', async (e) => {
    // Dropdown toggle logic
    const toggleBtn = e.target.closest('.rp-dropdown-toggle');
    if (toggleBtn) {
      const dropdown = toggleBtn.closest('.rp-dropdown');
      const isOpen = dropdown.classList.contains('rp-dropdown--open');

      // Close all other open dropdowns
      document.querySelectorAll('.rp-dropdown--open').forEach(el => el.classList.remove('rp-dropdown--open'));

      if (!isOpen) {
        dropdown.classList.add('rp-dropdown--open');
      }
      return;
    }

    // Close dropdowns when clicking outside
    if (!e.target.closest('.rp-dropdown')) {
      document.querySelectorAll('.rp-dropdown--open').forEach(el => el.classList.remove('rp-dropdown--open'));
    }

    // Action item click logic
    const actionBtn = e.target.closest('.rp-dropdown-item');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      const id = parseInt(actionBtn.getAttribute('data-id'), 10);

      if (action === 'edit') {
        openEditReportModal(id);
      } else if (action === 'delete') {
        if (confirm("Bu raporu silmek istediğinize emin misiniz?")) {
          const success = await deleteReportBackend(id);
          if (success) {
            await fetchReportsFromBackend();
            applyFilters();
          }
        }
      } else if (action === 'approve') {
        const success = await updateReportStatusBackend(id, 'Approved');
        if (success) {
          await fetchReportsFromBackend();
          applyFilters();
        }
      } else if (action === 'reject') {
        const success = await updateReportStatusBackend(id, 'Rejected');
        if (success) {
          await fetchReportsFromBackend();
          applyFilters();
        }
      } else if (action === 'download') {
        // Yönlendirme servisi
        try {
          const token = getToken();
          const response = await fetch(`${API_URL}/${id}/download`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok && data.url) {
            window.open(data.url, '_blank');
          } else {
            alert("İndirme linki alınamadı: " + (data.detail || "Bilinmeyen hata"));
          }
        } catch (err) {
          console.error("Download error:", err);
          alert("İndirme işlemi başarısız.");
        }
      }

      // Close the dropdown after action
      document.querySelectorAll('.rp-dropdown--open').forEach(el => el.classList.remove('rp-dropdown--open'));
    }
  });


  // --- MODAL FUNCTIONS DECLARED INSIDE FOR CLOSURE ACCESS OR ACCESSIBLE GLOBALLY
  function openReportModal() {
    editingReportId = null;
    const titleEl = document.querySelector('.rp-modal-title');
    if (titleEl) titleEl.innerText = "Yeni Rapor Oluştur";
    const submitBtn = document.getElementById('modalSubmitBtn');
    if (submitBtn) submitBtn.innerText = "Rapor Oluştur";

    const modal = document.getElementById('createReportModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    bindModalEvents();
  }

  function closeReportModal() {
    const modal = document.getElementById('createReportModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    modal.querySelectorAll('input[type=text], select').forEach(f => f.value = '');
    const fn = document.getElementById('modalFileName');
    if (fn) fn.textContent = '';

    document.getElementById('modalFileInput').value = '';

    const turSel = document.getElementById('modalTur');
    if (turSel) {
      turSel.innerHTML = '<option value="">Önce komite seçiniz</option>';
      turSel.disabled = true;
    }
    const projeGroup = document.getElementById('modalProjeGroup');
    if (projeGroup) projeGroup.style.display = 'none';
  }

  function openEditReportModal(id) {
    const r = eventsData.find(x => x.id === id);
    if (!r) return;

    editingReportId = id;

    const titleEl = document.querySelector('.rp-modal-title');
    if (titleEl) titleEl.innerText = "Raporu Düzenle";
    const submitBtn = document.getElementById('modalSubmitBtn');
    if (submitBtn) submitBtn.innerText = "Kaydet";

    const modal = document.getElementById('createReportModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      document.getElementById('modalRaporAdi').value = r.report_name;

      const elciCheck = document.getElementById('modalGizlilikElci');
      const uyeCheck = document.getElementById('modalGizlilikUye');

      if (r.privacy === 'Çok Gizli') {
        if (elciCheck) elciCheck.checked = true;
        if (uyeCheck) uyeCheck.checked = false;
      } else if (r.privacy === 'Gizli') {
        if (elciCheck) elciCheck.checked = false;
        if (uyeCheck) uyeCheck.checked = true;
      } else {
        if (elciCheck) elciCheck.checked = false;
        if (uyeCheck) uyeCheck.checked = false;
      }

      const komiteSel = document.getElementById('modalKomite');
      if (komiteSel) {
        komiteSel.value = r.committee;
        komiteSel.dispatchEvent(new Event('change'));
      }

      setTimeout(() => {
        const turSel = document.getElementById('modalTur');
        if (turSel) {
          turSel.value = r.report_type;
          turSel.dispatchEvent(new Event('change'));
        }

        if (r.report_type === 'Proje Raporu') {
          document.getElementById('modalProjeAdi').value = r.project_name || '';
        }
      }, 50);
    }, 50);

    bindModalEvents();
  }

  function bindModalEvents() {
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeReportModal);
    document.getElementById('modalCancelBtn')?.addEventListener('click', closeReportModal);

    const overlay = document.getElementById('createReportModal');
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) closeReportModal();
    });

    document.getElementById('modalKomite')?.addEventListener('change', function () {
      const seciliKomite = this.value;
      const turSel = document.getElementById('modalTur');
      const projeGroup = document.getElementById('modalProjeGroup');

      if (projeGroup) projeGroup.style.display = 'none';
      const projeSel = document.getElementById('modalProjeAdi');
      if (projeSel) projeSel.value = '';

      if (!seciliKomite || !KOMITE_TUR[seciliKomite]) {
        turSel.innerHTML = '<option value="">Önce komite seçiniz</option>';
        turSel.disabled = true;
        return;
      }

      const turler = KOMITE_TUR[seciliKomite];
      turSel.innerHTML = '<option value="">Seçiniz</option>' +
        turler.map(t => `<option value="${t}">${t}</option>`).join('');
      turSel.disabled = false;
      turSel.value = '';
    });

    document.getElementById('modalTur')?.addEventListener('change', function () {
      const projeGroup = document.getElementById('modalProjeGroup');
      if (!projeGroup) return;
      projeGroup.style.display = (this.value === 'Proje Raporu') ? '' : 'none';
      if (this.value !== 'Proje Raporu') {
        document.getElementById('modalProjeAdi').value = '';
      }
    });

    const fileInput = document.getElementById('modalFileInput');
    const fileName = document.getElementById('modalFileName');
    fileInput?.addEventListener('change', () => {
      if (fileName) {
        fileName.textContent = fileInput.files[0] ? fileInput.files[0].name : "Dosya seçilmedi";
      }
    });

    const fileDrop = document.getElementById('modalFileDrop');
    if (fileDrop) {
      // Tıklanınca input'u tetikle
      fileDrop.addEventListener('click', (e) => {
        // Eğer linkin kendisine tıklandıysa zaten input tetiklenecektir, tekrar tetiklemeye gerek yok
        if (e.target.tagName.toLowerCase() !== 'label') {
          fileInput.click();
        }
      });

      fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('rp-file-drop--active'); });
      fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('rp-file-drop--active'));
      fileDrop.addEventListener('drop', e => {
        e.preventDefault();
        fileDrop.classList.remove('rp-file-drop--active');
        const file = e.dataTransfer.files[0];
        if (file && fileName) {
          // Drop üzerinden file gelirse input'a aktarmak zor olabilir, 
          // File input object'i DataTransfer gerektirir.
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          fileName.textContent = file.name;
        }
      });
    }

    const elciCheck = document.getElementById('modalGizlilikElci');
    const uyeCheck = document.getElementById('modalGizlilikUye');

    if (elciCheck && uyeCheck) {
      elciCheck.addEventListener('change', function () {
        if (this.checked) uyeCheck.checked = false;
      });
      uyeCheck.addEventListener('change', function () {
        if (this.checked) elciCheck.checked = false;
      });
    }

    // Unbind and bind submit btn
    const submitBtn = document.getElementById('modalSubmitBtn');
    if (submitBtn) {
      // Clone to remove previous listeners
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

      newSubmitBtn.addEventListener('click', async () => {
        const raporAdi = document.getElementById('modalRaporAdi')?.value.trim();
        const komite = document.getElementById('modalKomite')?.value;
        const tur = document.getElementById('modalTur')?.value;

        const isElci = document.getElementById('modalGizlilikElci')?.checked;
        const isUye = document.getElementById('modalGizlilikUye')?.checked;

        let gizlilik = 'genel';
        if (isElci) gizlilik = 'cok_gizli';
        else if (isUye) gizlilik = 'gizli';

        const projeGroup = document.getElementById('modalProjeGroup');
        const projeAdi = document.getElementById('modalProjeAdi')?.value;
        const fileInputNode = document.getElementById('modalFileInput');

        if (!raporAdi || !komite || !tur) {
          alert('Lütfen rapor adını, komiteyi ve türü doldurunuz.');
          return;
        }

        if (tur === 'Proje Raporu' && projeGroup?.style.display !== 'none' && !projeAdi) {
          alert('Lütfen proje adını seçiniz.');
          return;
        }

        const file = fileInputNode.files[0];

        // Yeni raporsa dosya zorunludur
        if (!editingReportId && !file) {
          alert('Lütfen eklenecek geçerli bir PDF veya Word dosyası yükleyin.');
          return;
        }

        const formData = new FormData();
        formData.append('report_name', raporAdi);
        formData.append('committee', komite);
        formData.append('report_type', tur);
        formData.append('privacy', gizlilik);
        if (projeAdi) {
          formData.append('project_name', projeAdi);
        }
        if (file) {
          formData.append('file', file);
        }

        if (editingReportId) {
          // Update
          newSubmitBtn.innerText = "Kaydediliyor...";
          newSubmitBtn.disabled = true;
          const success = await updateReportBackend(editingReportId, formData);
          if (success) {
            closeReportModal();
            await fetchReportsFromBackend();
            applyFilters();
          } else {
            newSubmitBtn.innerText = "Kaydet";
            newSubmitBtn.disabled = false;
          }
        } else {
          // Create
          newSubmitBtn.innerText = "Oluşturuluyor...";
          newSubmitBtn.disabled = true;
          const success = await createReportBackend(formData);
          if (success) {
            closeReportModal();
            await fetchReportsFromBackend();
            applyFilters();
          } else {
            newSubmitBtn.innerText = "Rapor Oluştur";
            newSubmitBtn.disabled = false;
          }
        }
      });
    }
  }
}