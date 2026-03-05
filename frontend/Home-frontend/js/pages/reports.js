import { hasPerm } from '../acl.js';

/* ================================
   MOCK DATA
================================ */

// olusturan_id: Backend'den gelen raporu oluşturan kullanıcının ID'si.
// Giriş yapan kullanıcının ID'si (user.id) ile karşılaştırılarak sahiplik kontrolü yapılır.
// Backend entegrasyonunda bu alan API response'undan doldurulmalıdır.
const mockReports = [
  { id: 1, rapor_adi: 'Aylık Faaliyet Raporu',    olusturan: 'Zeynep Çelik',  olusturan_id: 2, tarih: '01.03.2024', komite: 'Proje Komitesi',                        tur_etiket: 'Proje Raporu',    tur_renk: 'neutral', durum: 'Onaylandı',    durum_renk: 'green',  gizlilik: 'Genel',     gizlilik_renk: 'green' },
  { id: 2, rapor_adi: 'Sponsorluk Görüşmesi',      olusturan: 'Mehmet Kaya',   olusturan_id: 3, tarih: '28.02.2024', komite: 'Sponsorluk ve Organizasyon Komitesi', tur_etiket: 'Etkinlik Raporu', tur_renk: 'neutral', durum: 'Onay Bekliyor', durum_renk: 'orange', gizlilik: 'Gizli',     gizlilik_renk: 'red'   },
  { id: 3, rapor_adi: 'Webinar Değerlendirme',     olusturan: 'Ayşe Yılmaz',  olusturan_id: 4, tarih: '15.02.2024', komite: 'Akademi Komitesi',                     tur_etiket: 'Eğitim Raporu',   tur_renk: 'neutral', durum: 'Onaylandı',    durum_renk: 'green',  gizlilik: 'Genel',     gizlilik_renk: 'green' },
  { id: 4, rapor_adi: 'Yıllık Mali Rapor',         olusturan: 'Ali Demir',     olusturan_id: 5, tarih: '10.02.2024', komite: 'Yönetim Kurulu',                       tur_etiket: 'Finans Raporu',   tur_renk: 'neutral', durum: 'Onay Bekliyor', durum_renk: 'orange', gizlilik: 'Çok Gizli', gizlilik_renk: 'red'   },
  { id: 5, rapor_adi: 'Akademi Tanıtım Sunumu',    olusturan: 'Ceren Arslan',  olusturan_id: 6, tarih: '05.02.2024', komite: 'Akademi Komitesi',                     tur_etiket: 'Eğitim Raporu',   tur_renk: 'neutral', durum: 'Reddedildi',   durum_renk: 'red',    gizlilik: 'Genel',     gizlilik_renk: 'green' },
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

// ─────────────────────────────────────────────────────────────────
// YETKİ MANTIĞI:
//   canDelete → true ise kullanıcı ELÇİ'dir, tüm raporları silebilir.
//               false ise sadece kendi raporunu silebilir (r.olusturan_id === user.id).
//   canUpdate → true ise kullanıcı ELÇİ'dir, tüm raporları güncelleyebilir.
//               false ise sadece kendi raporunu güncelleyebilir (r.olusturan_id === user.id).
//   user.id   → giriş yapan kullanıcının ID'si (store.js'den gelir).
//   r.olusturan_id → raporu oluşturan kullanıcının ID'si (backend'den gelir).
// ─────────────────────────────────────────────────────────────────
function renderRows(reports, canDelete, canUpdate, canFeedback, user) {
  if (!reports.length) {
    return `<tr><td colspan="8" class="rp-no-data">Gösterilecek rapor bulunamadı.</td></tr>`;
  }
  return reports.map(r => `
    <tr class="rp-row" data-id="${r.id}" data-rapor-adi="${r.rapor_adi.toLowerCase()}">
      <td class="rp-td"><span class="rp-report-name">${r.rapor_adi}</span></td>
      <td class="rp-td rp-td--muted">${r.olusturan}</td>
      <td class="rp-td rp-td--muted">${r.tarih}</td>
      <td class="rp-td rp-td--muted">${r.komite}</td>
      <td class="rp-td">
        <span class="rp-badge rp-badge--${r.tur_renk}">${r.tur_etiket}</span>
      </td>
      <td class="rp-td"><span class="rp-pill rp-pill--${r.durum_renk}">${r.durum}</span></td>
      <td class="rp-td rp-td--gizlilik"><span class="rp-pill rp-pill--${r.gizlilik_renk}">${r.gizlilik}</span></td>
      <td class="rp-td">
        <div class="rp-dropdown" data-id="${r.id}">
          <button class="rp-dropdown-toggle" data-id="${r.id}">
            İşlemler
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="rp-dropdown-menu">
            <button class="rp-dropdown-item" data-action="view" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Görüntüle
            </button>
            <button class="rp-dropdown-item" data-action="download" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              İndir
            </button>
            ${ // GÜNCELLEME YETKİSİ: canUpdate=true → elçi (herkesi düzenler) | false → sadece kendi raporu (olusturan_id===user.id) | Backend: PUT /reports/:id 403 kontrolü ekle
              (canUpdate || r.olusturan_id === user?.id) ? `
            <button class="rp-dropdown-item" data-action="edit" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Düzenle
            </button>` : ""}
            ${canFeedback ? `
            <button class="rp-dropdown-item rp-dropdown-item--approve" data-action="approve" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Onayla
            </button>
            <button class="rp-dropdown-item rp-dropdown-item--reject" data-action="reject" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reddet
            </button>` : ""}
            ${ // SİLME YETKİSİ: canDelete=true → elçi (herkesi siler) | false → sadece kendi raporu (olusturan_id===user.id) | Backend: DELETE /reports/:id 403 kontrolü ekle
              (canDelete || r.olusturan_id === user?.id) ? `
            <div class="rp-dropdown-divider"></div>
            <button class="rp-dropdown-item rp-dropdown-item--delete" data-action="delete" data-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              Sil
            </button>` : ""}
          </div>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ================================
   RENDER
================================ */

// 📌 TABLO ARKA PLAN RESMİ:
// Tablonun arka planına eklemek istediğin fotoğrafı buraya ekle.
// CSS'te .rp-table-wrap içine background-image olarak tanımlanabilir:
//   background-image: url('../img/tablo-bg.jpg');
//   background-size: cover;
//   background-position: center;
//   background-blend-mode: overlay;  /* renk üstüne bindirmek için */
export function renderReports(user) {
  const canCreate   = hasPerm(user, 'reports:create');
  // canDelete: 'report:delete' iznine sahip kullanıcı (elçi) tüm raporları silebilir.
  //             Bu izin yoksa renderRows içinde r.olusturan_id === user.id kontrolü devreye girer.
  //             → Backend: acl.js'de 'report:delete' iznini sadece elçi rolüne tanımla.
  const canDelete   = hasPerm(user, 'report:delete');

  // canUpdate: 'report:update' iznine sahip kullanıcı (elçi) tüm raporları güncelleyebilir.
  //            Bu izin yoksa renderRows içinde r.olusturan_id === user.id kontrolü devreye girer.
  //            → Backend: acl.js'de 'report:update' iznini sadece elçi rolüne tanımla.
  const canUpdate   = hasPerm(user, 'report:update');
  const canFeedback = hasPerm(user, 'reports:feedback');

  const rowsHTML = renderRows(mockReports, canDelete, canUpdate, canFeedback, user);

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
          <colgroup>
            <col style="width:22%"/>
            <col style="width:13%"/>
            <col style="width:10%"/>
            <col style="width:18%"/>
            <col style="width:14%"/>
            <col style="width:11%"/>
            <col style="width:0%"/>
            <col style="width:12%"/>
          </colgroup>
          <thead>
            <tr class="rp-thead-row">
              <th class="rp-th">RAPOR ADI</th>
              <th class="rp-th">OLUŞTURAN</th>
              <th class="rp-th">TARİH</th>
              <th class="rp-th">KOMİTE</th>
              <th class="rp-th">TÜR</th>
              <th class="rp-th">DURUM</th>
              <th class="rp-th rp-th--gizlilik">GİZLİLİK</th>
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

/* ================================
   EVENTS & FILTERING LOGIC
================================ */

export function initReports(user) { // user parametresini eklemeyi unutma (yetkiler için)

  // Türkçe karakterlere duyarlı küçük harf dönüştürücü
  const toLowerTR = (str) => (str || '').toLocaleLowerCase('tr-TR');

  // Filtre: komite degisince tur filtresini de guncelle
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
    const tur    = document.getElementById('turSelect')?.value || '';
    const sort   = document.getElementById('sortSelect')?.value || 'tarih-yeni';

    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    let filtered = mockReports.filter(r => {
      const raporAdi = toLowerTR(r.rapor_adi);
      
      // DEĞİŞİKLİK BURADA: .includes(search) yerine .startsWith(search) 
      // Böylece sadece yazdığın harfle BAŞLAYANLAR gelir.
      const matchSearch = !search || raporAdi.startsWith(search);
      
      const matchKomite = !komite || r.komite === komite;
      const matchTur    = !tur    || r.tur_etiket === tur;
      
      return matchSearch && matchKomite && matchTur;
    });

    // Sıralama Mantığı
    const parseDate = str => {
      const p = (str || '').split('.');
      return p.length === 3 ? p[2] + p[1] + p[0] : '00000000';
    };

    filtered.sort((a, b) => {
      if (sort === 'tarih-yeni') return parseDate(b.tarih).localeCompare(parseDate(a.tarih));
      if (sort === 'tarih-eski') return parseDate(a.tarih).localeCompare(parseDate(b.tarih));
      if (sort === 'ad-az') return a.rapor_adi.localeCompare(b.rapor_adi, 'tr');
      if (sort === 'ad-za') return b.rapor_adi.localeCompare(a.rapor_adi, 'tr');
      return 0;
    });

    // Tabloyu DOM üzerinde güncelle
    const rows = Array.from(tbody.querySelectorAll('.rp-row'));
    rows.forEach(row => row.style.display = 'none');

    filtered.forEach(r => {
      const row = tbody.querySelector(`.rp-row[data-id="${r.id}"]`);
      if (row) {
        row.style.display = '';
        tbody.appendChild(row); 
      }
    });

    // Eğer hiç sonuç yoksa "Bulunamadı" mesajını göster
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="rp-no-data">Arama kriterlerine uygun rapor bulunamadı.</td></tr>`;
    } else {
        // Eğer daha önce "Bulunamadı" yazdıysa ve şimdi veri geldiyse, 
        // tabloyu temizleyip sadece mevcut satırları göstermek gerekebilir.
        const noDataRow = tbody.querySelector('.rp-no-data');
        if (noDataRow) {
            // refresh yapıldığında tabloyu orijinal yetkilerle tekrar render et
            document.dispatchEvent(new CustomEvent('reports:refresh'));
        }
    }
  }

  // Dinleyiciler
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
  document.getElementById('turSelect')?.addEventListener('change', applyFilters);
  document.getElementById('komiteSelect')?.addEventListener('change', updateTurFilter);
  document.getElementById('createReportBtn')?.addEventListener('click', openReportModal);

  // Sayfa yüklendiğinde çalıştır
  applyFilters();
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

    // ─── BACKEND ENTEGRASYONU (bu yorumları backend hazır olunca uygula) ───
    // 1) Asagidaki mockReports.unshift ve dispatchEvent satirlarini SIL.
    // 2) Yerine su kodu yaz:
    //      const res = await fetch('/api/reports', {
    //        method: 'POST',
    //        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + store.getToken() },
    //        body: JSON.stringify({ rapor_adi: raporAdi, komite, tur, gizlilik, proje_adi: projeAdi || null })
    //      });
    //      if (!res.ok) { alert('Rapor kaydedilemedi.'); return; }
    //      const yeniRapor = await res.json();
    //      addReportToTable(yeniRapor);
    // 3) Dosya icin FormData kullan:
    //      const fd = new FormData();
    //      fd.append('dosya', document.getElementById('modalFileInput').files[0]);
    //      fd.append('rapor_id', yeniRapor.id);
    //      await fetch('/api/reports/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + store.getToken() }, body: fd });
    // 4) olusturan ve olusturan_id icin: const u = store.getUser(); → u.name, u.id
    // ─────────────────────────────────────────────────────────────────────────────

    // Simdilik: mock olarak diziye ekle, tabloyu guncelle
    const bugun = new Date();
    const gg  = String(bugun.getDate()).padStart(2, '0');
    const aa  = String(bugun.getMonth() + 1).padStart(2, '0');
    const yyyy = bugun.getFullYear();

    const yeniRapor = {
      id:            mockReports.length + 1,
      rapor_adi:     raporAdi,
      olusturan:     'Sen',           // Backend gelince: store.getUser().name
      olusturan_id:  window.__currentUserId || 0, // Backend gelince: store.getUser().id
      tarih:         gg + '.' + aa + '.' + yyyy,
      komite:        komite,
      tur_etiket:    tur,
      tur_renk:      'neutral',
      durum:         'Onay Bekliyor',
      durum_renk:    'orange',
      gizlilik:      gizlilik,
      gizlilik_renk: gizlilik === 'Genel' ? 'green' : 'red',
    };

    mockReports.unshift(yeniRapor);
    closeReportModal();
    document.dispatchEvent(new CustomEvent('reports:refresh'));
  });
}