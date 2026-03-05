/*Burada:

Rapor listesi (komite filtresi, tag filtresi)

Rapor detayı (tıklayınca)

Feedback paneli:

Feedback ver (reports.feedback + scope)

(Opsiyonel) “Rapor oluştur” (eğer kural koyacaksan reports.create)

Etiket zorunluluğu:

“Aylık rapor” gibi tiplerde tag zorunlu */
//const API_BASE_URL = "   ";
 import { hasPerm } from '../acl.js';

/* ================================
   MOCK DATA
================================ */

const mockReports = [
  { id: 1, rapor_adi: 'Aylık Faaliyet Raporu', olusturan: 'Zeynep Çelik', tarih: '01.03.2024', komite: 'Proje Komitesi', tur_etiket: 'Proje Raporu', tur_renk: 'blue', tur_alt: 'Sosyal Sorumluluk Projesi', durum: 'Onaylandı', durum_renk: 'green', gizlilik: 'Genel', gizlilik_renk: 'green' },
  { id: 2, rapor_adi: 'Sponsorluk Görüşmesi', olusturan: 'Mehmet Kaya', tarih: '28.02.2024', komite: 'Sponsorluk ve Organizasyon Komitesi', tur_etiket: 'Etkinlik Raporu', tur_renk: 'orange', tur_alt: 'Bahar Şenliği', durum: 'Onay Bekliyor', durum_renk: 'orange', gizlilik: 'Gizli', gizlilik_renk: 'red' },
  { id: 3, rapor_adi: 'Webinar Değerlendirme', olusturan: 'Ayşe Yılmaz', tarih: '15.02.2024', komite: 'Akademi Komitesi', tur_etiket: 'Eğitim Raporu', tur_renk: 'purple', tur_alt: 'Kariyer Günleri', durum: 'Onaylandı', durum_renk: 'green', gizlilik: 'Genel', gizlilik_renk: 'green' },
  { id: 4, rapor_adi: 'Yıllık Mali Rapor', olusturan: 'Ali Demir', tarih: '10.02.2024', komite: 'Yönetim Kurulu', tur_etiket: 'Finans Raporu', tur_renk: 'blue', tur_alt: 'Bütçe Planlaması', durum: 'Onay Bekliyor', durum_renk: 'orange', gizlilik: 'Çok Gizli', gizlilik_renk: 'red' },
];

/* ================================
   KOMİTE → TÜR MAPPING
================================ */

const KOMITE_TUR = {
  'Yönetim Kurulu':                      ['Finans Raporu', 'Toplantı Raporu'],
  'Proje Komitesi':                      ['Proje Raporu', 'Toplantı Raporu'],
  'Pazarlama ve Sosyal Medya Komitesi':  ['Etkinlik Raporu', 'Toplantı Raporu', 'Webinar Raporu'],
  'Sponsorluk ve Organizasyon Komitesi': ['Etkinlik Raporu', 'Toplantı Raporu', 'Webinar Raporu'],
  'Akademi Komitesi':                    ['Eğitim Raporu', 'Toplantı Raporu'],
};

const PROJE_ADLARI = ['HSD Agency', 'Kulüp Yönetim', 'HSD Arena', 'Mülakat'];

// Tum benzersiz turleri topla (filtre icin)
const TUM_TURLER = [...new Set(Object.values(KOMITE_TUR).flat())].sort((a,b) => a.localeCompare(b,'tr'));

/* ================================
   HELPERS
================================ */

function renderRows(reports, canDelete, canUpdate, canFeedback) {
  if (!reports.length) {
    return `<tr><td colspan="8" class="rp-no-data">Gösterilecek rapor bulunamadı.</td></tr>`;
  }
  return reports.map(r => `
    <tr class="rp-row" data-id="${r.id}">
      <td class="rp-td"><span class="rp-report-name">${r.rapor_adi}</span></td>
      <td class="rp-td rp-td--muted">${r.olusturan}</td>
      <td class="rp-td rp-td--muted">${r.tarih}</td>
      <td class="rp-td rp-td--muted">${r.komite}</td>
      <td class="rp-td">
        <span class="rp-badge rp-badge--${r.tur_renk}">${r.tur_etiket}</span>
        <span class="rp-tur-alt">${r.tur_alt}</span>
      </td>
      <td class="rp-td"><span class="rp-pill rp-pill--${r.durum_renk}">${r.durum}</span></td>
      <td class="rp-td"><span class="rp-pill rp-pill--${r.gizlilik_renk}">${r.gizlilik}</span></td>
      <td class="rp-td">
        <div class="rp-actions">
          <button class="rp-btn-icon rp-btn-icon--view" title="Görüntüle" data-action="view" data-id="${r.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="rp-btn-icon rp-btn-icon--download" title="İndir" data-action="download" data-id="${r.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          ${canUpdate ? `
          <button class="rp-btn-icon rp-btn-icon--edit" title="Düzenle" data-action="edit" data-id="${r.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>` : ""}
          ${canDelete ? `
          <button class="rp-btn-icon rp-btn-icon--delete" title="Sil" data-action="delete" data-id="${r.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>` : ""}
          ${canFeedback ? `
          <button class="rp-btn-icon rp-btn-icon--approve" title="Onayla" data-action="approve" data-id="${r.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button class="rp-btn-icon rp-btn-icon--reject" title="Reddet" data-action="reject" data-id="${r.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>` : ""}
        </div>
      </td>
    </tr>
  `).join('');
}

/* ================================
   RENDER
================================ */

export function renderReports(user) {
  const canCreate   = hasPerm(user, 'reports:create');
  const canDelete   = hasPerm(user, 'report:delete');
  const canUpdate   = hasPerm(user, 'report:update');
  const canFeedback = hasPerm(user, 'reports:feedback');

  const rowsHTML = renderRows(mockReports, canDelete, canUpdate, canFeedback);

  // Filtre: komite options
  const komiteOptions = Object.keys(KOMITE_TUR)
    .map(k => `<option value="${k}">${k}</option>`).join('');

  // Filtre: tur options (tum benzersiz turler)
  const turOptions = TUM_TURLER
    .map(t => `<option value="${t}">${t}</option>`).join('');

  // Modal: komite options
  const modalKomiteOptions = Object.keys(KOMITE_TUR)
    .map(k => `<option value="${k}">${k}</option>`).join('');

  return `
    <div class="rp-page">

      <!-- HEADER -->
      <div class="rp-header">
        <h1 class="rp-title">Raporlar</h1>
        ${canCreate ? `<button class="rp-btn-new" id="createReportBtn">Yeni Rapor</button>` : ''}
      </div>

      <!-- FİLTRELER -->
      <div class="rp-filters">
        <div class="rp-search-wrap">
          <svg class="rp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="rp-search" type="text" id="searchInput" placeholder="Rapor adı ara..." />
        </div>
        <select class="rp-select" id="sortSelect">
          <option value="tarih-yeni">En Yeni</option>
          <option value="tarih-eski">En Eski</option>
          <option value="ad-az">Ad (A-Z)</option>
          <option value="ad-za">Ad (Z-A)</option>
        </select>
        <select class="rp-select" id="komiteSelect">
          <option value="">Tüm Komiteler</option>
          ${komiteOptions}
        </select>
        <select class="rp-select" id="turSelect">
          <option value="">Tüm Türler</option>
          ${turOptions}
        </select>
      </div>

      <!-- TABLO -->
      <div class="rp-table-wrap">
        <table class="rp-table">
          <thead>
            <tr class="rp-thead-row">
              <th class="rp-th">RAPOR ADI</th>
              <th class="rp-th">OLUŞTURAN</th>
              <th class="rp-th">TARİH</th>
              <th class="rp-th">KOMİTE</th>
              <th class="rp-th">TÜR</th>
              <th class="rp-th">DURUM</th>
              <th class="rp-th">GİZLİLİK</th>
              <th class="rp-th">İŞLEMLER</th>
            </tr>
          </thead>
          <tbody id="reportsTableBody">
            ${rowsHTML}
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
              <label class="rp-label">Gizlilik Seviyesi <span class="rp-required">*</span></label>
              <select class="rp-modal-select" id="modalGizlilik">
                <option value="">Seçiniz</option>
                <option value="Genel">Genel</option>
                <option value="Gizli">Gizli</option>
                <option value="Çok Gizli">Çok Gizli</option>
              </select>
              <div class="rp-hint">
                <span><strong>Genel:</strong> Tüm kullanıcılar görüntüleyebilir.</span>
                <span><strong>Gizli:</strong> Üye rolü hariç tüm yetkililer görüntüleyebilir.</span>
                <span><strong>Çok Gizli:</strong> Sadece Elçi görüntüleyebilir.</span>
              </div>
            </div>

            <div class="rp-form-group">
              <label class="rp-label">Rapor Dosyası (PDF veya Word) <span class="rp-required">*</span></label>
              <div class="rp-file-drop" id="modalFileDrop">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Dosyayı sürükleyin veya <label class="rp-file-link" for="modalFileInput">seçin</label></span>
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

/* ================================
   EVENTS
================================ */

export function initReports() {
    

  // Filtre: komite degisince tur filtresini de guncelle
  function updateTurFilter() {
    const komite = document.getElementById('komiteSelect')?.value || '';
    const turSelect = document.getElementById('turSelect');
    if (!turSelect) return;

    const mevcutDeger = turSelect.value;
    const turler = komite ? (KOMITE_TUR[komite] || []) : TUM_TURLER;

    turSelect.innerHTML = '<option value="">Tüm Türler</option>' +
      turler.map(t => `<option value="${t}">${t}</option>`).join('');

    // Onceki secim hala gecerliyse koru
    if (turler.includes(mevcutDeger)) turSelect.value = mevcutDeger;

    applyFilters();
  }

  function applyFilters() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const komite = document.getElementById('komiteSelect')?.value || '';
    const tur    = document.getElementById('turSelect')?.value || '';
    const sort   = document.getElementById('sortSelect')?.value || 'tarih-yeni';

    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('.rp-row'));

    rows.forEach(row => {
      const ad        = (row.querySelector('.rp-report-name')?.textContent || '').trim();
      const cells     = row.querySelectorAll('.rp-td');
      const rowKomite = (cells[3]?.textContent || '').trim();
      const rowTur    = (cells[4]?.querySelector('.rp-badge')?.textContent || '').trim();

      const matchSearch = !search || ad.toLowerCase().includes(search);
      const matchKomite = !komite || rowKomite === komite;
      const matchTur    = !tur    || rowTur    === tur;

      row.style.display = (matchSearch && matchKomite && matchTur) ? '' : 'none';
    });

    const visible = rows.filter(r => r.style.display !== 'none');

    const parseDate = row => {
      const txt = (row.querySelectorAll('.rp-td')[2]?.textContent || '').trim();
      const parts = txt.split('.');
      if (parts.length !== 3) return '00000000';
      return parts[2] + parts[1] + parts[0];
    };
    const getAd = row => (row.querySelector('.rp-report-name')?.textContent || '').trim();

    visible.sort((a, b) => {
      if (sort === 'tarih-yeni') return parseDate(b).localeCompare(parseDate(a));
      if (sort === 'tarih-eski') return parseDate(a).localeCompare(parseDate(b));
      if (sort === 'ad-az')      return getAd(a).localeCompare(getAd(b), 'tr', { sensitivity: 'base' });
      if (sort === 'ad-za')      return getAd(b).localeCompare(getAd(a), 'tr', { sensitivity: 'base' });
      return 0;
    });

    visible.forEach(row => tbody.appendChild(row));
  }

  // searchInput, turSelect, sortSelect -> applyFilters
  // komiteSelect -> updateTurFilter (o da applyFilters cagiriyor)
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
  document.getElementById('turSelect')?.addEventListener('change', applyFilters);
  document.getElementById('komiteSelect')?.addEventListener('change', updateTurFilter);

  applyFilters();

  const createBtn = document.getElementById('createReportBtn');
  if (createBtn) createBtn.addEventListener('click', openReportModal);

  const tbody = document.getElementById('reportsTableBody');
  if (tbody) {
    tbody.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      console.log('Action:', btn.dataset.action, 'ID:', btn.dataset.id);
    });
  }
}

/* ================================
   MODAL
================================ */

function openReportModal() {
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

  // Tur select'i sifirla
  const turSel = document.getElementById('modalTur');
  if (turSel) {
    turSel.innerHTML = '<option value="">Önce komite seçiniz</option>';
    turSel.disabled = true;
  }
  // Proje alanini gizle
  const projeGroup = document.getElementById('modalProjeGroup');
  if (projeGroup) projeGroup.style.display = 'none';
}

function bindModalEvents() {
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeReportModal);
  document.getElementById('modalCancelBtn')?.addEventListener('click', closeReportModal);

  const overlay = document.getElementById('createReportModal');
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeReportModal();
  });

  const escHandler = e => {
    if (e.key === 'Escape') {
      closeReportModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Komite degisince tur listesini guncelle
  document.getElementById('modalKomite')?.addEventListener('change', function() {
    const seciliKomite = this.value;
    const turSel = document.getElementById('modalTur');
    const projeGroup = document.getElementById('modalProjeGroup');

    // Proje alanini gizle
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

  // Tur degisince proje alanini goster/gizle
  document.getElementById('modalTur')?.addEventListener('change', function() {
    const projeGroup = document.getElementById('modalProjeGroup');
    if (!projeGroup) return;
    projeGroup.style.display = (this.value === 'Proje Raporu') ? '' : 'none';
    if (this.value !== 'Proje Raporu') {
      document.getElementById('modalProjeAdi').value = '';
    }
  });

  // Dosya secimi
  const fileInput = document.getElementById('modalFileInput');
  const fileName  = document.getElementById('modalFileName');
  fileInput?.addEventListener('change', () => {
    if (fileName) fileName.textContent = fileInput.files[0]?.name || '';
  });

  const fileDrop = document.getElementById('modalFileDrop');
  if (fileDrop) {
    fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('rp-file-drop--active'); });
    fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('rp-file-drop--active'));
    fileDrop.addEventListener('drop', e => {
      e.preventDefault();
      fileDrop.classList.remove('rp-file-drop--active');
      const file = e.dataTransfer.files[0];
      if (file && fileName) fileName.textContent = file.name;
    });
  }

  document.getElementById('modalSubmitBtn')?.addEventListener('click', () => {
    const raporAdi  = document.getElementById('modalRaporAdi')?.value.trim();
    const komite    = document.getElementById('modalKomite')?.value;
    const tur       = document.getElementById('modalTur')?.value;
    const gizlilik  = document.getElementById('modalGizlilik')?.value;
    const projeGroup = document.getElementById('modalProjeGroup');
    const projeAdi  = document.getElementById('modalProjeAdi')?.value;

    if (!raporAdi || !komite || !tur || !gizlilik) {
      alert('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    // Proje raporu secildiyse proje adi zorunlu
    if (tur === 'Proje Raporu' && projeGroup?.style.display !== 'none' && !projeAdi) {
      alert('Lütfen proje adını seçiniz.');
      return;
    }

    console.log('Yeni rapor:', { raporAdi, komite, tur, gizlilik, projeAdi: projeAdi || null });
    closeReportModal();
  });
  // TABLO BUTONLARI (Event Delegation)
  const tbody = document.getElementById("reportsTableBody");

  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      console.log("CLICK:", action, id);

      switch (action) {
        case "view":
          alert("View: " + id);
          break;

        case "delete":
          alert("Delete: " + id);
          break;

        case "approve":
          alert("Approve: " + id);
          break;

        case "reject":
          alert("Reject: " + id);
          break;

        case "edit":
          alert("Edit: " + id);
          break;

        case "download":
          alert("Download: " + id);
          break;
      }
    });
  }
}