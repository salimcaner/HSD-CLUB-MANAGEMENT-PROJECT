import { getToken } from "../store.js";

const API_URL = "http://localhost:8000";

// Rol hiyerarşisi ve Türkçe etiketler
const ROLE_ORDER = ["elci", "elci_yardimcisi", "genel_sekreter", "insan_kaynaklari", "lider", "uye", "mezun", "admin"];

const ROLE_META = {
  elci: { label: "Elçi", color: "#a78bfa", icon: "👑" },
  elci_yardimcisi: { label: "Elçi Yardımcısı", color: "#818cf8", icon: "🌟" },
  genel_sekreter: { label: "Genel Sekreter", color: "#60a5fa", icon: "📋" },
  insan_kaynaklari: { label: "İnsan Kaynakları", color: "#34d399", icon: "🤝" },
  lider: { label: "Komite Lideri", color: "#fb923c", icon: "🎯" },
  uye: { label: "Üye", color: "#94a3b8", icon: "👤" },
  mezun: { label: "Mezun", color: "#64748b", icon: "🎓" },
  admin: { label: "Admin", color: "#f472b6", icon: "⚙️" },
};

export function renderCommunity() {
  return `
    <link rel="stylesheet" href="/frontend/Home-frontend/css/community.css">
    <section class="community-page">
      <div class="comm-header">
        <div>
          <h1>Topluluk</h1>
          <p class="comm-subtitle">Tüm üyeler — rol sırasına göre</p>
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

async function fetchAndRender() {
  const token = getToken();
  const contentEl = document.getElementById("communityContent");
  try {
    const res = await fetch(`${API_URL}/users/`, {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) throw new Error("Yüklenemedi");
    const members = await res.json();
    console.log("Fetched Community Members: ", members);
    window._commAllMembers = members;
    renderList(members, "");
  } catch (e) {
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

  // Role göre grupla ve sırala
  const grouped = {};
  filtered.forEach(m => {
    const role = (m.role || "uye").toLowerCase();
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(m);
  });

  // Rol sırasına göre render
  const roleKeys = ROLE_ORDER.filter(r => grouped[r]?.length > 0);

  const html = roleKeys.map(role => {
    const meta = ROLE_META[role] || { label: role, color: "#94a3b8", icon: "👤" };
    const membersHtml = grouped[role]
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      .map(m => memberRow(m, meta))
      .join("");

    return `
      <div class="comm-group">
        <div class="comm-group-header">
          <span class="comm-role-icon">${meta.icon}</span>
          <span class="comm-role-label" style="color: ${meta.color}">${meta.label}</span>
          <span class="comm-role-count">${grouped[role].length} kişi</span>
          <div class="comm-role-line" style="background: ${meta.color}"></div>
        </div>
        <div class="comm-members-grid">
          ${membersHtml}
        </div>
      </div>
    `;
  }).join("");

  console.log("Generated HTML: ", html);

  contentEl.innerHTML = `
    <div class="comm-stats">
      <span>${filtered.length} üye</span>
      <span>${roleKeys.length} farklı rol</span>
    </div>
    ${html}
  `;
}

function memberRow(m, meta) {
  const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
  const initials = [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const joinDate = m.created_at
    ? new Date(m.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
    : "—";
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