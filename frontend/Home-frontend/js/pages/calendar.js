import { getToken } from "../store.js";
import { hasPerm } from "../acl.js";

const API_URL = "http://localhost:8000";
const LS_KEY = "cal_events_v1";

// ── Kategori tanımları ──────────────────────────
export const CATEGORY = {
  yonetim: { label: "Yönetim Kurulu", color: "#f59e0b" },
  proje: { label: "Proje Komitesi", color: "#7c3aed" },
  pazarlama: { label: "Pazarlama ve Sosyal Medya Komtiesi", color: "#ec4899" },
  sponsorluk: { label: "Sponsorluk ve Organizasyon Komitesi", color: "#3b82f6" },
  akademi: { label: "Akademi Komitesi", color: "#10b981" },
  mezun: { label: "Mezunlar Komitesi", color: "#94a3b8" },
};

let currentDate = new Date();
let localEvents = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
let projectItems = [];
let currentUser = null;

// ──────────────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────────────
export function renderCalendar(user) {
  currentUser = user;

  const legendHtml = Object.entries(CATEGORY).map(([key, cat]) =>
    `<span class="legend-item">
       <span class="cal-dot" style="background:${cat.color}"></span>${cat.label}
     </span>`
  ).join("");

  return `
    <section class="calendar-page">

      <div class="cal-header">
        <div>
          <h1>Takvim</h1>
          <p class="cal-subtitle">Etkinlikler, toplantılar, raporlar ve projeler</p>
        </div>
      </div>

      <div class="cal-nav">
        <button class="cal-nav-btn" id="calPrevBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="cal-month-label" id="calMonthLabel"></span>
        <button class="cal-nav-btn" id="calNextBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="cal-today-btn" id="calTodayBtn">Bugün</button>
      </div>

      <div class="cal-grid-wrap">
        <div class="cal-day-names">
          <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div>
          <div>Cum</div><div>Cmt</div><div>Paz</div>
        </div>
        <div class="cal-grid" id="calGrid"></div>
      </div>

      <div class="cal-legend">${legendHtml}</div>

    </section>

    <!-- DAY DRAWER -->
    <div class="cal-drawer-overlay" id="calDrawerOverlay">
      <div class="cal-drawer" id="calDrawer">
        <div class="cal-drawer-header">
          <span id="calDrawerTitle"></span>
          <button class="cal-modal-close" id="calDrawerClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div id="calDrawerBody"></div>
      </div>
    </div>

    <!-- CALENDAR EVENT DETAIL MODAL -->
    <div class="cal-modal-overlay" id="calDetailOverlay" style="z-index: 2000;">
      <div class="cal-modal">
        <div class="cal-modal-header">
          <h2>Etkinlik <span style="color:var(--cal-accent)">Detayı</span></h2>
          <button class="cal-modal-close" id="calDetailCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="cal-modal-body" id="calDetailBody" style="color:var(--cal-text);">
          <!-- Dinamik olarak JS tarafından doldurulacak -->
        </div>
      </div>
    </div>

    <div id="calToast" class="cal-toast" style="display:none;"></div>
  `;
}

// ──────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────
export async function initCalendar() {
  await loadEvents();
  renderGrid();
  bindNav();
  bindModal();
}

// ──────────────────────────────────────────────────
// LOAD EVENTS FROM BACKEND
// ──────────────────────────────────────────────────
async function loadEvents() {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/events/?limit=100`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    const events = data.data || [];

    // Etkinlikleri takvim öğesine dönüştür
    projectItems = events.map(ev => {
      // Komite ismini CATEGORY key'ine dönüştür
      let type = "proje"; // default
      switch (ev.committee) {
        case "Yönetim Kurulu": type = "yonetim"; break;
        case "Proje Komitesi": type = "proje"; break;
        case "Pazarlama ve Sosyal Medya Komitesi": type = "pazarlama"; break;
        case "Sponsorluk ve Organizasyon Komitesi": type = "sponsorluk"; break;
        case "Akademi Komitesi": type = "akademi"; break;
        case "Mezunlar Komitesi": type = "mezun"; break;
      }

      return {
        id: "ev-" + ev.id,
        title: ev.event_type || "Etkinlik",
        description: ev.description || "",
        date: ev.event_date || null,
        type: type,
        _readonly: true,
        rawEvent: ev
      };
    }).filter(e => e.date);
  } catch (e) {
    console.warn("Etkinlikler yüklenemedi:", e);
  }
}

// ──────────────────────────────────────────────────
// GRID
// ──────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById("calGrid");
  const label = document.getElementById("calMonthLabel");
  if (!grid || !label) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  label.textContent = new Date(year, month, 1)
    .toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  // İlk gün — Pazartesi'den başlat
  let startOffset = new Date(year, month, 1).getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();

  // Tüm öğeleri tarih map'ine aktar
  const map = {};
  [...localEvents, ...projectItems].forEach(ev => {
    if (!ev.date) return;
    const key = ev.date.slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  });

  let html = "";

  // Önceki ay boşlukları
  for (let i = startOffset - 1; i >= 0; i--)
    html += `<div class="cal-cell cal-cell--faded"><span class="cal-day-num">${prevMonthDays - i}</span></div>`;

  // Bu ayın günleri
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const items = map[dateStr] || [];

    // Renkli nokta grubu (en fazla 4 farklı kategori)
    const dotsHtml = [...new Set(items.map(e => e.type))]
      .slice(0, 4)
      .map(t => `<span class="cal-dot" style="background:${CATEGORY[t]?.color || '#aaa'}"></span>`)
      .join("");

    html += `
      <div class="cal-cell ${isToday ? "cal-cell--today" : ""}" data-date="${dateStr}">
        <span class="cal-day-num">${d}</span>
        <div class="cal-dots">${dotsHtml}</div>
      </div>`;
  }

  // Sonraki ay boşlukları
  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const remaining = total - startOffset - daysInMonth;
  for (let i = 1; i <= remaining; i++)
    html += `<div class="cal-cell cal-cell--faded"><span class="cal-day-num">${i}</span></div>`;

  grid.innerHTML = html;

  grid.querySelectorAll(".cal-cell[data-date]").forEach(cell =>
    cell.addEventListener("click", () => openDrawer(cell.dataset.date, map[cell.dataset.date] || []))
  );
}

const pad = n => String(n).padStart(2, "0");

// ──────────────────────────────────────────────────
// NAV
// ──────────────────────────────────────────────────
function bindNav() {
  document.getElementById("calPrevBtn")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1); renderGrid();
  });
  document.getElementById("calNextBtn")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1); renderGrid();
  });
  document.getElementById("calTodayBtn")?.addEventListener("click", () => {
    currentDate = new Date(); renderGrid();
  });
}

// ──────────────────────────────────────────────────
// ADD MODAL
// ──────────────────────────────────────────────────
function bindModal() {
  const overlay = document.getElementById("calModalOverlay");
  const close = () => overlay?.classList.remove("open");

  document.getElementById("calAddBtn")?.addEventListener("click", () => {
    document.getElementById("calItemDate").value = new Date().toISOString().slice(0, 10);
    document.getElementById("calItemTitle").value = "";
    document.getElementById("calItemDesc").value = "";
    overlay?.classList.add("open");
  });

  document.getElementById("calModalClose")?.addEventListener("click", close);
  document.getElementById("calModalCancel")?.addEventListener("click", close);
  overlay?.addEventListener("click", e => { if (e.target === overlay) close(); });

  document.getElementById("calModalSave")?.addEventListener("click", () => {
    const title = document.getElementById("calItemTitle").value.trim();
    const type = document.getElementById("calItemType").value;
    const desc = document.getElementById("calItemDesc").value.trim();
    const date = document.getElementById("calItemDate").value;
    const endDate = document.getElementById("calItemEndDate").value || null;

    if (!title || !date) { showToast("Başlık ve tarih zorunludur!", "error"); return; }

    const newItem = {
      id: "local-" + Date.now(),
      title, type, description: desc, date
    };

    localEvents.push(newItem);
    localStorage.setItem(LS_KEY, JSON.stringify(localEvents));
    renderGrid();
    close();
    showToast("Eklendi!", "success");
  });

  // Drawer kapat
  document.getElementById("calDrawerClose")?.addEventListener("click", closeDayDrawer);
  document.getElementById("calDrawerOverlay")?.addEventListener("click", e => {
    if (e.target === document.getElementById("calDrawerOverlay")) closeDayDrawer();
  });

  // Calendar Detail Modal kapat
  document.getElementById("calDetailCloseBtn")?.addEventListener("click", hideCalDetailModal);
  document.getElementById("calDetailOverlay")?.addEventListener("click", e => {
    if (e.target === document.getElementById("calDetailOverlay")) hideCalDetailModal();
  });
}

// ──────────────────────────────────────────────────
// DAY DRAWER
// ──────────────────────────────────────────────────
function openDrawer(dateStr, items) {
  const titleEl = document.getElementById("calDrawerTitle");
  const bodyEl = document.getElementById("calDrawerBody");
  if (!titleEl || !bodyEl) return;

  titleEl.textContent = new Date(dateStr + "T00:00:00")
    .toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (items.length === 0) {
    bodyEl.innerHTML = `<p class="cal-drawer-empty">Bu tarih için öğe yok.</p>`;
  } else {
    bodyEl.innerHTML = items.map(ev => {
      const cat = CATEGORY[ev.type] || { label: ev.type, color: "#aaa" };
      const isLocal = String(ev.id).startsWith("local-");
      const realId = String(ev.id).replace("ev-", "");
      return `
        <div class="cal-drawer-item ${!isLocal ? "clickable-cal-event" : ""}" ${!isLocal ? `data-id="${realId}" title="Detaya Git"` : ""} style="${!isLocal ? 'cursor:pointer;' : ''}">
          <span class="cal-dot" style="background:${cat.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px"></span>
          <div class="cal-drawer-item-info">
            <strong>${ev.title}</strong>
            ${ev.description ? `<p>${ev.description}</p>` : ""}
            <span class="cal-drawer-type" style="border-left:3px solid ${cat.color}">${cat.label}</span>
          </div>
          ${!ev._readonly && hasPerm(currentUser, "calendar:manage") ? `
          <button class="cal-drawer-delete" data-id="${ev.id}" title="Sil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            </svg>
          </button>` : ""}
        </div>`;
    }).join("");

    bodyEl.querySelectorAll(".cal-drawer-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        localEvents = localEvents.filter(e => e.id !== id);
        localStorage.setItem(LS_KEY, JSON.stringify(localEvents));
        renderGrid();
        closeDayDrawer();
        showToast("Silindi.", "success");
      });
    });

    bodyEl.querySelectorAll(".clickable-cal-event").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".cal-drawer-delete")) return;
        const id = item.dataset.id;
        showCalDetailModal(id);
      });
    });
  }

  document.getElementById("calDrawerOverlay")?.classList.add("open");
}

function closeDayDrawer() {
  document.getElementById("calDrawerOverlay")?.classList.remove("open");
}

// ──────────────────────────────────────────────────
// EVENT DETAIL MODAL
// ──────────────────────────────────────────────────
function showCalDetailModal(idString) {
  const evItem = projectItems.find(e => String(e.id).replace("ev-", "") === idString);
  if (!evItem || !evItem.rawEvent) return;

  const ev = evItem.rawEvent;
  const dateObj = new Date(ev.event_date);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  let displayImageUrl = ev.image_url;
  const isBackendDefault = displayImageUrl && (displayImageUrl.includes("dummyimage.com") || !displayImageUrl.includes("supabase"));

  const defaults = {
    "Yönetim Kurulu": "https://dummyimage.com/1200x800/000/fff&text=Yönetim+Kurulu",
    "Proje Komitesi": "https://dummyimage.com/1200x800/0b0b0b/7c3aed&text=Proje+Komitesi",
    "Pazarlama ve Sosyal Medya Komitesi": "https://dummyimage.com/1200x800/0b0b0b/ec4899&text=Pazarlama+Komitesi",
    "Sponsorluk ve Organizasyon Komitesi": "https://dummyimage.com/1200x800/0b0b0b/3b82f6&text=Sponsorluk+Komitesi",
    "Akademi Komitesi": "https://dummyimage.com/1200x800/0b0b0b/10b981&text=Akademi+Komitesi",
    "default": "https://dummyimage.com/1200x800/1c1d21/64748b&text=HSD+Etkinlik"
  };

  if (!displayImageUrl || isBackendDefault) {
    displayImageUrl = defaults[ev.committee] || defaults["default"];
  }

  const descHTML = ev.description ? ev.description.replace(/\\n/g, '<br>') : "Açıklama bulunmuyor.";

  const bodyHtml = `
    <img src="${displayImageUrl}" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px; border: 1px solid var(--cal-border)" onerror="this.src='https://dummyimage.com/1200x800/1c1d21/64748b&text=HSD+Etkinlik'">
    <h3 style="font-size:20px; margin-top:0; margin-bottom:8px; color:var(--cal-text);">${ev.title || ev.event_type || "Etkinlik"}</h3>
    <div style="display:flex; gap:12px; margin-bottom:16px; font-size:13px; color:var(--cal-muted);">
      <span style="display:flex; align-items:center; gap:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cal-accent)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ${formattedDate} - ${formattedTime}
      </span>
      <span style="display:flex; align-items:center; gap:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cal-accent)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        ${ev.location || "Belirtilmemiş"}
      </span>
    </div>
    <span class="cal-drawer-type" style="margin-bottom:16px; display:inline-block; border-left:3px solid var(--cal-accent)">${ev.committee}</span>
    ${ev.event_type ? `<span class="cal-drawer-type" style="margin-bottom:16px; margin-left:8px; display:inline-block; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2);">${ev.event_type}</span>` : ""}
    <p style="font-size:14px; line-height:1.6; color:var(--cal-text); margin-bottom:20px;">${descHTML}</p>
    <div style="font-size:12px; color:var(--cal-muted); border-top:1px solid var(--cal-border); padding-top:16px;">
      Ekleyen Görevli (ID): <strong style="color:var(--cal-text);">${ev.profiles ? (ev.profiles.first_name + ' ' + ev.profiles.last_name) : ev.created_by}</strong><br>
      Kayıt Tarihi: ${new Date(ev.created_at).toLocaleString("tr-TR")}
    </div>
  `;

  const bodyEl = document.getElementById("calDetailBody");
  if (bodyEl) bodyEl.innerHTML = bodyHtml;

  document.getElementById("calDetailOverlay")?.classList.add("open");
}

function hideCalDetailModal() {
  document.getElementById("calDetailOverlay")?.classList.remove("open");
  const modalBody = document.getElementById("calDetailBody");
  if (modalBody) modalBody.innerHTML = "";
}

// ──────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.getElementById("calToast");
  if (!t) return;
  t.textContent = msg;
  t.className = `cal-toast cal-toast--${type}`;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 3000);
}