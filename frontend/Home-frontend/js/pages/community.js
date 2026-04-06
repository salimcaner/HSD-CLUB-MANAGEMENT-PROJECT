import { getToken } from "../store.js";

const API_URL = "http://localhost:8000";

const COMMITTEE_ORDER = [
  "Yönetim Kurulu",
  "Proje Komitesi",
  "Pazarlama ve Sosyal Medya Komitesi",
  "Sponsorluk ve Organizasyon Komitesi",
  "Akademi Komitesi",
  "Mezunlar",
  "Diğer"
];

const COMMITTEE_META = {
  "Yönetim Kurulu": { label: "Yönetim Kurulu", color: "#f59e0b" },
  "Proje Komitesi": { label: "Proje Komitesi", color: "#7c3aed" },
  "Pazarlama ve Sosyal Medya Komitesi": { label: "Pazarlama ve Sosyal Medya", color: "#ec4899" },
  "Sponsorluk ve Organizasyon Komitesi": { label: "Sponsorluk ve Organizasyon", color: "#3b82f6" },
  "Akademi Komitesi": { label: "Akademi Komitesi", color: "#10b981" },
  "Mezunlar": { label: "Mezunlar Komitesi", color: "#94a3b8" },
  "Diğer": { label: "Diğer", color: "#64748b" }
};

export function renderCommunity() {
  return `
    <link rel="stylesheet" href="/frontend/Home-frontend/css/community.css">
    <section class="community-page">
      <div class="comm-header">
        <div>
          <h1>Topluluk</h1>
          <p class="comm-subtitle">Tüm üyeler — komite sırasına göre</p>
        </div>
        <div class="comm-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="commSearch" placeholder="İsim veya e-posta ara...">
        </div>
      </div>

      <div id="communityContent">
        <div class="comm-loading">
          <div class="comm-spinner"></div>
          <p>Üyeler yükleniyor...</p>
        </div>
      </div>
    </section>
  `;
}

export async function initCommunity() {
  await fetchAndRender();

  document.getElementById("commSearch")?.addEventListener("input", (e) => {
    renderList(window._commAllMembers || [], e.target.value.trim().toLowerCase());
  });
}

function normalizeCommittee(rawDept, rawRole) {
  const dept = (rawDept || "").trim().toLowerCase();
  const role = (rawRole || "").trim().toLowerCase();

  // Admin veya Yönetim özel rollerini Yönetim Kuruluna ata
  if (["admin", "elci", "elci_yardimcisi", "genel_sekreter", "insan_kaynaklari"].includes(role)) {
    return "Yönetim Kurulu";
  }

  if (role === "mezun" || dept.includes("mezun")) return "Mezunlar";

  if (dept.includes("proje")) return "Proje Komitesi";
  if (dept.includes("pazarlama") || dept.includes("medya") || dept.includes("sosyal")) return "Pazarlama ve Sosyal Medya Komitesi";
  if (dept.includes("sponsorluk") || dept.includes("organizasyon")) return "Sponsorluk ve Organizasyon Komitesi";
  if (dept.includes("akademi") || dept.includes("eğitim")) return "Akademi Komitesi";
  if (dept === "yonetim" || dept === "yönetim") return "Yönetim Kurulu";

  return "Diğer";
}

async function fetchAndRender() {
  const token = getToken();
  const contentEl = document.getElementById("communityContent");
  try {
    const res = await fetch(`${API_URL}/community/`, {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) throw new Error("Yüklenemedi");
    const response = await res.json();
    console.log("Fetched Community Response: ", response);

    // Extract members array from response object
    const members = response.data || response;

    window._commAllMembers = members;
    renderList(members, "");
  } catch (e) {
    console.error("Community Page Error:", e);
    contentEl.innerHTML = `<div class="comm-error">Üyeler yüklenirken hata oluştu.</div>`;
  }
}

function renderList(members, query) {
  const contentEl = document.getElementById("communityContent");
  if (!contentEl) return;

  // Filtrele
  let filtered = members;
  if (query) {
    filtered = members.filter(m =>
      (m.first_name || "").toLowerCase().includes(query) ||
      (m.last_name || "").toLowerCase().includes(query) ||
      (m.email || "").toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    contentEl.innerHTML = `<div class="comm-empty">Eşleşen üye bulunamadı.</div>`;
    return;
  }

  // Komiteye göre grupla ve sırala
  const grouped = {};
  filtered.forEach(m => {
    const comm = normalizeCommittee(m.department, m.role);
    if (!grouped[comm]) grouped[comm] = [];
    grouped[comm].push(m);
  });

  // Komite sırasına göre render
  const commKeys = COMMITTEE_ORDER.filter(c => grouped[c]?.length > 0);

  const html = commKeys.map(comm => {
    const meta = COMMITTEE_META[comm] || { label: comm, color: "#94a3b8" };
    const membersHtml = grouped[comm]
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      .map(m => memberRow(m, meta))
      .join("");

    return `
      <div class="comm-group">
        <div class="comm-group-header" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;" onselectstart="return false">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${meta.icon ? `<span class="comm-role-icon">${meta.icon}</span>` : ''}
            <span class="comm-role-label" style="color: ${meta.color}">${meta.label}</span>
            <span class="comm-role-count">${grouped[comm].length} kişi</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="comm-role-line" style="background: ${meta.color}; width: 50px; height: 2px;"></div>
            <svg class="comm-accordion-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; transform: rotate(-90deg);">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div class="comm-members-grid" style="display: none; padding-top: 15px;">
          ${membersHtml}
        </div>
      </div>
    `;
  }).join("");

  console.log("Generated HTML: ", html);

  contentEl.innerHTML = `
    <div class="comm-stats">
      <span>${filtered.length} üye</span>
      <span>${commKeys.length} farklı komite</span>
    </div>
    ${html}
  `;

  // Accordion Event Listeners
  const headers = contentEl.querySelectorAll('.comm-group-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const grid = header.nextElementSibling;
      const icon = header.querySelector('.comm-accordion-icon');

      if (grid.style.display === 'none' || !grid.style.display) {
        grid.style.display = 'grid'; // .comm-members-grid usually uses grid or flex
        icon.style.transform = 'rotate(0deg)';
      } else {
        grid.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
      }
    });
  });
}

const ROLE_LABELS = {
  elci: "Elçi",
  elci_yardimcisi: "Elçi Yardımcısı",
  genel_sekreter: "Genel Sekreter",
  insan_kaynaklari: "İnsan Kaynakları",
  komite_lideri: "Komite Lideri",
  departman_lideri: "Komite Lideri",
  lider: "Komite Lideri",
  uye: "Üye",
  mezun: "Mezun",
  admin: "Admin"
};

function memberRow(m, meta) {
  const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
  const initials = [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const roleName = ROLE_LABELS[(m.role || "").toLowerCase()] || "Üye";
  const uniDept = m.university_department || "Bölüm Belirtilmemiş";
  const classYear = m.class_ ? `${m.class_}. Sınıf` : "Sınıf Belirtilmemiş";

  return `
    <div class="comm-member-card">
      <div class="comm-card-header">
        <div class="comm-avatar" style="background: ${meta.color}22; border-color: ${meta.color}55; color: ${meta.color}">
          ${initials}
        </div>
        <div class="comm-member-info">
          <div class="comm-member-name">${fullName}</div>
          <div style="font-size: 11px; color: ${meta.color}; margin-top: 2px;">${roleName}</div>
        </div>
      </div>
      <div class="comm-member-meta">
        <span class="comm-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          ${uniDept} · ${classYear}
        </span>
      </div>
    </div>
  `;
}