import { getToken } from "../store.js";
import { BASE_URL } from "../config.js";

const NOTES_KEY = "calendar_notes_v1";
const API_URL = BASE_URL;

export const CATEGORY = {
  yonetim: { label: "Yönetim Kurulu", color: "#f59e0b" },
  proje: { label: "Proje Komitesi", color: "#7c3aed" },
  pazarlama: { label: "Pazarlama ve Sosyal Medya Komitesi", color: "#ec4899" },
  sponsorluk: { label: "Sponsorluk ve Organizasyon Komitesi", color: "#3b82f6" },
  akademi: { label: "Akademi Komitesi", color: "#10b981" },
  mezun: { label: "Mezunlar Komitesi", color: "#94a3b8" },
  not: { label: "Not", color: "#06b6d4" }
};

let currentDate = new Date();
let selectedCalendarDate = new Date().toISOString().slice(0, 10);
let editingNoteId = null;
let notes = loadNotes();
let events = [];

export function renderCalendar(user) {
  const canManageNotes = canUserManageNotes(user);
  const legendHtml = Object.entries(CATEGORY).map(([_, cat]) =>
    `<span class="legend-item">
       <span class="cal-dot" style="background:${cat.color}"></span>${cat.label}
     </span>`
  ).join("");

  return `
    <section class="calendar-page">
      <div class="cal-header">
        <div>
          <h1>Takvim</h1>
          <p class="cal-subtitle">Etkinlikler ve günlük notlar</p>
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

    <div class="cal-drawer-overlay" id="calDrawerOverlay">
      <div class="cal-drawer" id="calDrawer">
        <div class="cal-drawer-header">
          <span id="calDrawerTitle"></span>
          <div class="cal-drawer-actions">
            ${canManageNotes ? `
              <div style="position:relative; display:flex;">
                <button class="cal-drawer-add-btn" id="calDrawerAddBtn" title="Yeni Ekle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <div id="calDrawerAddDropdown" class="cal-drawer-add-dropdown">
                  <button class="cal-drawer-add-btn-option" data-type="Not">Not Ekle</button>
                </div>
              </div>
            ` : ""}
            <button class="cal-modal-close" id="calDrawerClose" title="Kapat">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div id="calDrawerBody"></div>
      </div>
    </div>

    <div class="cal-modal-overlay" id="calNoteModalOverlay" style="z-index: 2000;">
      <div class="cal-modal">
        <div class="cal-modal-header">
          <h2 id="calNoteModalTitle">Not Ekle</h2>
          <button class="cal-modal-close" id="calNoteModalCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="cal-modal-body">
          <div class="cal-form-group">
            <label>Başlık *</label>
            <input type="text" id="calNoteTitleInput" placeholder="Not başlığı">
          </div>
          <div class="cal-form-group">
            <label>Not *</label>
            <textarea id="calNoteBodyInput" rows="5" placeholder="Notunuzu yazın..."></textarea>
          </div>
        </div>
        <div class="cal-modal-footer">
          <button class="cal-btn cal-btn-ghost" id="calNoteCancelBtn">İptal</button>
          <button class="cal-btn cal-btn-primary" id="calNoteSaveBtn">Kaydet</button>
        </div>
      </div>
    </div>

    <div id="calToast" class="cal-toast" style="display:none;"></div>
  `;
}

export async function initCalendar() {
  notes = loadNotes();
  await loadEvents();
  renderGrid();
  bindNav();
  bindModal();
}

function canUserManageNotes(user) {
  if (!user?.role) return false;
  const role = String(user.role).toLocaleLowerCase("tr-TR");
  return role !== "uye" && role !== "üye";
}

function loadNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

async function loadEvents() {
  try {
    const token = getToken();
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const response = await fetch(`${API_URL}/events/?limit=100`, { headers });

    if (!response.ok) {
      events = [];
      return;
    }

    const data = await response.json();
    events = (data.data || [])
      .filter(ev => ev.event_date)
      .map(ev => ({
        id: `event-${ev.id}`,
        kind: "etkinlik",
        category: committeeToCategory(ev.committee),
        title: ev.title || ev.event_type || "Etkinlik",
        body: ev.description || "",
        date: String(ev.event_date).slice(0, 10),
        time: ev.event_date,
        eventType: ev.event_type || "Etkinlik",
        location: ev.location || "",
        committee: ev.committee || ""
      }));
  } catch (error) {
    console.warn("Etkinlikler yüklenemedi:", error);
    events = [];
  }
}

function renderGrid() {
  const grid = document.getElementById("calGrid");
  const label = document.getElementById("calMonthLabel");
  if (!grid || !label) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  label.textContent = new Date(year, month, 1)
    .toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  let startOffset = new Date(year, month, 1).getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const map = buildItemsByDate();

  let html = "";

  for (let i = startOffset - 1; i >= 0; i--) {
    html += `<div class="cal-cell cal-cell--faded"><span class="cal-day-num">${prevMonthDays - i}</span></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dayItems = map[dateStr] || [];
    const dotsHtml = [...new Set(dayItems.map(getItemColorKey))]
      .map(key => `<span class="cal-dot" style="background:${CATEGORY[key]?.color || "#aaa"}"></span>`)
      .join("") + (dayItems.length > 2 ? `<span class="cal-extra-count">+${dayItems.length - 2}</span>` : "");

    html += `
      <div class="cal-cell ${isToday ? "cal-cell--today" : ""}" data-date="${dateStr}">
        <span class="cal-day-num">${d}</span>
        <div class="cal-dots">${dotsHtml}</div>
      </div>`;
  }

  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const remaining = total - startOffset - daysInMonth;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-cell cal-cell--faded"><span class="cal-day-num">${i}</span></div>`;
  }

  grid.innerHTML = html;
  grid.querySelectorAll(".cal-cell[data-date]").forEach(cell =>
    cell.addEventListener("click", () => openDrawer(cell.dataset.date, map[cell.dataset.date] || []))
  );
}

function committeeToCategory(committee) {
  switch (committee) {
    case "Yönetim Kurulu": return "yonetim";
    case "Proje Komitesi": return "proje";
    case "Pazarlama ve Sosyal Medya Komitesi": return "pazarlama";
    case "Sponsorluk ve Organizasyon Komitesi": return "sponsorluk";
    case "Akademi Komitesi": return "akademi";
    case "Mezunlar Komitesi": return "mezun";
    default: return "proje";
  }
}

function getItemColorKey(item) {
  return item.kind === "not" ? "not" : item.category;
}

function buildItemsByDate() {
  const map = {};

  events.forEach(event => {
    if (!event.date) return;
    if (!map[event.date]) map[event.date] = [];
    map[event.date].push(event);
  });

  notes.forEach(note => {
    if (!note.date) return;
    if (!map[note.date]) map[note.date] = [];
    map[note.date].push({ ...note, kind: "not" });
  });

  return map;
}

const pad = n => String(n).padStart(2, "0");

function bindNav() {
  document.getElementById("calPrevBtn")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderGrid();
  });
  document.getElementById("calNextBtn")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderGrid();
  });
  document.getElementById("calTodayBtn")?.addEventListener("click", () => {
    currentDate = new Date();
    renderGrid();
  });
}

function bindModal() {
  const drawerDropdown = document.getElementById("calDrawerAddDropdown");

  document.getElementById("calDrawerAddBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    drawerDropdown?.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#calDrawerAddBtn") && !e.target.closest("#calDrawerAddDropdown")) {
      drawerDropdown?.classList.remove("open");
    }
  });

  document.querySelector(".cal-drawer-add-btn-option")?.addEventListener("click", () => {
    selectedCalendarDate = document.getElementById("calDrawerTitle")?.dataset.rawdate || new Date().toISOString().slice(0, 10);
    drawerDropdown?.classList.remove("open");
    openNoteModal();
  });

  document.getElementById("calNoteModalCloseBtn")?.addEventListener("click", closeNoteModal);
  document.getElementById("calNoteCancelBtn")?.addEventListener("click", closeNoteModal);
  document.getElementById("calNoteSaveBtn")?.addEventListener("click", saveNoteFromModal);
  document.getElementById("calNoteModalOverlay")?.addEventListener("click", e => {
    if (e.target === document.getElementById("calNoteModalOverlay")) closeNoteModal();
  });

  document.getElementById("calDrawerClose")?.addEventListener("click", closeDayDrawer);
  document.getElementById("calDrawerOverlay")?.addEventListener("click", e => {
    if (e.target === document.getElementById("calDrawerOverlay")) closeDayDrawer();
  });
}

function openDrawer(dateStr, dayItems) {
  const titleEl = document.getElementById("calDrawerTitle");
  const bodyEl = document.getElementById("calDrawerBody");
  if (!titleEl || !bodyEl) return;

  selectedCalendarDate = dateStr;
  titleEl.dataset.rawdate = dateStr;
  titleEl.textContent = new Date(dateStr + "T00:00:00")
    .toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  document.querySelectorAll(".cal-cell").forEach(c => c.classList.remove("selected"));
  document.querySelector(`.cal-cell[data-date="${dateStr}"]`)?.classList.add("selected");

  if (dayItems.length === 0) {
    bodyEl.innerHTML = `<p class="cal-drawer-empty">Bu tarih için öğe yok.</p>`;
  } else {
    bodyEl.innerHTML = dayItems.map(item => item.kind === "not" ? renderNoteItem(item) : renderEventItem(item)).join("");

    bodyEl.querySelectorAll(".cal-note-edit").forEach(btn => {
      btn.addEventListener("click", () => openNoteModal(btn.dataset.id));
    });
    bodyEl.querySelectorAll(".cal-note-delete").forEach(btn => {
      btn.addEventListener("click", () => deleteNote(btn.dataset.id));
    });
  }

  document.getElementById("calDrawerOverlay")?.classList.add("open");
}

function renderNoteItem(note) {
  return `
    <div class="cal-drawer-item cal-note-item" data-id="${escapeAttr(note.id)}">
      <span class="cal-dot" style="background:${CATEGORY.not.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px"></span>
      <div class="cal-drawer-item-info">
        <strong>${escapeHtml(note.title)}</strong>
        <p>${escapeHtml(note.body)}</p>
        <span class="cal-drawer-type" style="border-left:3px solid ${CATEGORY.not.color}">Not</span>
      </div>
      <div class="cal-note-actions">
        <button class="cal-note-icon-btn cal-note-edit" data-id="${escapeAttr(note.id)}" title="Düzenle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="cal-note-icon-btn cal-note-delete" data-id="${escapeAttr(note.id)}" title="Sil">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderEventItem(event) {
  const category = CATEGORY[event.category] || CATEGORY.proje;
  const time = event.time
    ? new Date(event.time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return `
    <div class="cal-drawer-item cal-event-item" data-id="${escapeAttr(event.id)}">
      <span class="cal-dot" style="background:${category.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px"></span>
      <div class="cal-drawer-item-info">
        <strong>${escapeHtml(event.title)}</strong>
        ${event.body ? `<p>${escapeHtml(event.body)}</p>` : ""}
        ${event.location || time ? `<p>${escapeHtml([event.location, time].filter(Boolean).join(" · "))}</p>` : ""}
        <span class="cal-drawer-type" style="border-left:3px solid ${category.color}">${escapeHtml(event.eventType)}</span>
        ${event.committee ? `<span class="cal-drawer-type" style="border-left:3px solid ${category.color}">${escapeHtml(event.committee)}</span>` : ""}
      </div>
    </div>
  `;
}

function closeDayDrawer() {
  document.getElementById("calDrawerOverlay")?.classList.remove("open");
}

function openNoteModal(noteId = null) {
  editingNoteId = noteId;
  const titleInput = document.getElementById("calNoteTitleInput");
  const bodyInput = document.getElementById("calNoteBodyInput");
  const modalTitle = document.getElementById("calNoteModalTitle");
  const note = noteId ? notes.find(item => String(item.id) === String(noteId)) : null;

  if (modalTitle) modalTitle.textContent = note ? "Notu Düzenle" : "Not Ekle";
  if (titleInput) titleInput.value = note?.title || "";
  if (bodyInput) bodyInput.value = note?.body || "";

  document.getElementById("calNoteModalOverlay")?.classList.add("open");
  titleInput?.focus();
}

function closeNoteModal() {
  editingNoteId = null;
  document.getElementById("calNoteModalOverlay")?.classList.remove("open");
  const titleInput = document.getElementById("calNoteTitleInput");
  const bodyInput = document.getElementById("calNoteBodyInput");
  if (titleInput) titleInput.value = "";
  if (bodyInput) bodyInput.value = "";
}

function saveNoteFromModal() {
  const title = document.getElementById("calNoteTitleInput")?.value.trim();
  const body = document.getElementById("calNoteBodyInput")?.value.trim();
  const wasEditing = !!editingNoteId;

  if (!title || !body) {
    showToast("Başlık ve not alanı zorunludur.", "error");
    return;
  }

  if (editingNoteId) {
    notes = notes.map(note => String(note.id) === String(editingNoteId)
      ? { ...note, title, body, updatedAt: new Date().toISOString() }
      : note
    );
  } else {
    notes.push({
      id: `note-${Date.now()}`,
      title,
      body,
      date: selectedCalendarDate,
      createdAt: new Date().toISOString()
    });
  }

  saveNotes();
  closeNoteModal();
  refreshOpenDate();
  showToast(wasEditing ? "Not güncellendi." : "Not eklendi.", "success");
}

function deleteNote(noteId) {
  notes = notes.filter(note => String(note.id) !== String(noteId));
  saveNotes();
  refreshOpenDate();
  showToast("Not silindi.", "success");
}

function refreshOpenDate() {
  renderGrid();
  const map = buildItemsByDate();
  openDrawer(selectedCalendarDate, map[selectedCalendarDate] || []);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function showToast(msg, type = "success") {
  const t = document.getElementById("calToast");
  if (!t) return;
  t.textContent = msg;
  t.className = `cal-toast cal-toast--${type}`;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 3000);
}
