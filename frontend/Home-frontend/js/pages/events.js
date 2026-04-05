import { getUser, getToken } from "../store.js";
import { hasPerm } from "../acl.js";

const API_URL = "http://127.0.0.1:8000/events"; // Backend Endpoint

const COMMITTEES = [
  "Yönetim Kurulu",
  "Proje Komitesi",
  "Pazarlama ve Sosyal Medya Komitesi",
  "Sponsorluk ve Organizasyon Komitesi",
  "Akademi Komitesi"
];

// --- Etkinlik Türleri ---
const EVENT_TYPES = [
  "Toplantı",
  "Oyun",
  "Seminer",
  "Webinar",
  "Akademi Eğitimi",
  "Sosyal Etkinlik"
];
// --- Frontend Default Images (High-Quality Type-Based Fallbacks) ---
const EVENT_TYPE_DEFAULTS = {
  "Toplantı": "../../picture/Ofisteki toplantı anı.png",
  "Oyun": "../../picture/Oyun denetleyicisi ve ödüller.png",
  "Seminer": "../../picture/ChatGPT Image 10 Mar 2026 15_09_02.png",
  "Webinar": "../../picture/Webinar sunumu ve etkileşimli konuşmalar.png",
  "Akademi Eğitimi": "../../picture/ChatGPT Image 10 Mar 2026 15_17_22.png",
  "Sosyal Etkinlik": "../../picture/ChatGPT Image 10 Mar 2026 15_18_51.png",
  "default": "https://images.unsplash.com/photo-1523580494863-6f30312248f5?q=80&w=1200&h=800&auto=format&fit=crop"
};

// --- State Variables ---
let currentSearch = "";
let currentCommittee = "";
let currentType = "";
let currentPeriod = ""; // "upcoming", "past"
let currentSort = "newest"; // "newest" or "oldest"
let selectedImageFile = null; // Modal'daki eklenecek resim dosyası nesnesi
let base64PreviewString = ""; // Moda'da resmin önizlemesini göstermek için
let editingEventId = null;
let eventsData = []; // Backend'den çekilen verilerin kopyası (frontend filtreleri için)
let isEventInitDone = false; // Event listener'lar eklendi mi?

// ==============================================================================
// 0. BACKEND API ETKİLEŞİM İŞLEMLERİ (FETCH)
// ==============================================================================

// Event Listesi Yükleme (GET)
async function fetchEventsFromBackend() {
  try {
    const token = getToken();
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    // Arama textini URL parametresi olarak ekle 
    let url = `${API_URL}?limit=100`;
    if (currentSearch) {
      url += `&search_name=${encodeURIComponent(currentSearch)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers
    });

    if (response.ok) {
      const data = await response.json();
      eventsData = data.data || [];
    } else {
      console.error("Etkinlikler getirilirken hata. HTTP:", response.status);
      showToast("Etkinlikler yüklenirken ağ hatası oluştu.", "error");
    }
  } catch (error) {
    console.error("Fetch Events Error:", error);
    showToast("Sunucuya bağlanılamadı.", "error");
  }
}

// Yeni Etkinlik Gönderme (POST)
async function createEventBackend(formData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData // Content-Type multipart/form-data otomatik ayarlanır!
    });

    if (response.ok) {
      showToast("Etkinlik başarıyla oluşturuldu!", "success");
      return true;
    } else {
      const errData = await response.json();
      showToast(`Hata: ${errData.detail || 'Etkinlik oluşturulamadı.'}`, "error");
      return false;
    }
  } catch (error) {
    console.error("Create Event Error:", error);
    showToast("Etkinlik kaydedilirken sunucu hatası oluştu.", "error");
    return false;
  }
}

// Etkinlik Güncelleme (PUT)
async function updateEventBackend(eventId, formData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/${eventId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      showToast("Etkinlik başarıyla güncellendi!", "success");
      return true;
    } else {
      const errData = await response.json();
      showToast(`Hata: ${errData.detail || 'Etkinlik güncellenemedi.'}`, "error");
      return false;
    }
  } catch (error) {
    console.error("Update Event Error:", error);
    showToast("Etkinlik güncellenirken sunucu hatası oluştu.", "error");
    return false;
  }
}

// Etkinlik Silme (DELETE)
async function deleteEventBackend(eventId) {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/${eventId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      showToast("Etkinlik başarıyla silindi.", "success");
      return true;
    } else {
      const errData = await response.json();
      showToast(`Silemezsiniz: ${errData.detail || 'Hata'}`, "error");
      return false;
    }
  } catch (error) {
    console.error("Delete Event Error:", error);
    showToast("Sunucuyla iletişim hatası.", "error");
    return false;
  }
}


// ==============================================================================
// 1. RENDER (Arayüz Çizimi)
// ==============================================================================
export function renderEvents(user) {
  const isAuthorized = hasPerm(user, "events:create");
  const committeeOptions = COMMITTEES.map(c => `<option value="${c}">${c}</option>`).join("");

  return `
    <link rel="stylesheet" href="../css/events.css">
    
    <div class="events-page">
      <div class="events-header">
        <div class="events-title-block">
          <h1>Etkinlikler</h1>
        </div>
        ${isAuthorized ? `
          <div class="header-actions">
            <button class="btn btn-primary" id="addEventBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Etkinlik Ekle
            </button>
          </div>
        ` : ""}
      </div>

      <div class="events-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="searchInput" placeholder="Etkinlik adına göre ara...">
          </div>

          <select class="filter-select" id="committeeFilter">
            <option value="">Tüm Komiteler (Yerel)</option>
            ${committeeOptions}
          </select>

          <select class="filter-select" id="typeFilter">
            <option value="">Tüm Türler</option>
            ${EVENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}
          </select>

          <select class="filter-select" id="periodFilter">
            <option value="">Tüm Dönemler</option>
            <option value="upcoming">Gelecek Etkinlik</option>
            <option value="past">Geçmiş Etkinlik</option>
          </select>

          <select class="filter-select" id="sortFilter">
            <option value="newest">Tarih (Yeniden Eskiye)</option>
            <option value="oldest">Tarih (Eskiden Yeniye)</option>
          </select>
        </div>

        <div class="toolbar-right">
          <!-- Buton buradaydı, başlığa taşındı -->
        </div>
      </div>

      <div id="eventsContainer" class="events-grid">
        <!-- JS ile Doldurulacak -->
      </div>
    </div>

    ${isAuthorized ? buildModalHtml(committeeOptions) : ""}

    <div class="modal-overlay" id="eventDetailOverlay">
      <div class="modal">
        <div class="modal-header">
          <h2 id="eventDetailTitle">Etkinlik Detayı</h2>
          <button class="modal-close" id="detailCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="eventDetailBody">
          <!-- Dinamik olarak JS tarafından doldurulacak -->
        </div>
      </div>
    </div>

    <div class="toast-container" id="toastContainer"></div>
  `;
}

// ==============================================================================
// 1.1 Modal HTML
// ==============================================================================
function buildModalHtml(committeeOptions) {
  return `
    <div class="modal-overlay" id="eventModalOverlay">
      <div class="modal">
        <div class="modal-header">
          <h2 id="eventModalTitle">Etkinlik Ekle</h2>
          <button class="modal-close" id="modalCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Etkinlik Adı *</label>
            <input type="text" id="evTitle" placeholder="Örn: Kulüp Tanışma Toplantısı">
          </div>
          <div class="form-group">
            <label>Açıklama *</label>
            <textarea id="evDesc" placeholder="Etkinliğin detayları..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tarih & Saat *</label>
              <input type="datetime-local" id="evDateTime">
            </div>
            <div class="form-group">
               <label>Konum *</label>
               <input type="text" id="evLocation" placeholder="Mekan adı veya Link">
            </div>
          </div>
          <div class="form-group">
            <label>İlgili Komite *</label>
            <select id="evCommittee">
              <option value="">Komite Seçiniz...</option>
              ${committeeOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Etkinlik Türü *</label>
            <select id="evType">
              <option value="">Tür Seçiniz...</option>
              ${EVENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}
            </select>
          </div>
          <div class="form-group" id="evParticipantGroup" style="display: none;">
            <label id="evParticipantLabel">Katılımcı Sayısı <span style="font-size:11px; color:#888;">(Opsiyonel)</span></label>
            <input type="number" id="evParticipantCount" placeholder="Örn: 50" min="0">
          </div>
          <div class="form-group">
            <label>Etkinlik Görseli <span style="font-size:11px; color:#888;">(Opsiyonel)</span></label>
             <input type="file" id="evImage" accept="image/*" style="display:block; width:100%; border:none; padding:5px 0;">
            <div id="imagePreview" style="margin-top:10px; display:none;">
              <div class="image-preview-wrap">
                <img src="" style="max-height:100px; border-radius:6px; background:#111; object-fit:cover;">
                <button class="remove-image-btn" id="removeImageBtn" title="Resmi Kaldır">&times;</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modalCancelBtn">İptal</button>
          <button class="btn btn-primary" id="modalSaveBtn">Kaydet</button>
        </div>
      </div>
    </div>
  `;
}

// ==============================================================================
// 2. INIT & EVENT LISTENERS
// ==============================================================================
export async function initEvents() {
  const user = getUser();
  const isAuthorized = hasPerm(user, "events:create");

  // Önce arka plandan verileri yükle
  await fetchEventsFromBackend();
  renderEventList();

  let searchTimeout = null;
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      currentSearch = e.target.value;
      // Backend araması için 500ms gecikme
      searchTimeout = setTimeout(async () => {
        await fetchEventsFromBackend();
        renderEventList();
      }, 500);
    });
  }

  const evDateTimeInput = document.getElementById("evDateTime");
  if (evDateTimeInput) {
    evDateTimeInput.addEventListener("change", () => {
      updateParticipantRequirement();
    });
  }

  const committeeFilter = document.getElementById("committeeFilter");
  if (committeeFilter) {
    committeeFilter.addEventListener("change", (e) => {
      currentCommittee = e.target.value;
      renderEventList();
    });
  }

  const typeFilter = document.getElementById("typeFilter");
  if (typeFilter) {
    typeFilter.addEventListener("change", (e) => {
      currentType = e.target.value;
      renderEventList();
    });
  }

  const periodFilter = document.getElementById("periodFilter");
  if (periodFilter) {
    periodFilter.addEventListener("change", (e) => {
      currentPeriod = e.target.value;
      renderEventList();
    });
  }

  const sortFilter = document.getElementById("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderEventList();
    });
  }

  if (!isEventInitDone) {
    document.body.addEventListener("click", async (e) => {
      if (isAuthorized) {
        const addBtn = e.target.closest("#addEventBtn");
        const closeBtn = e.target.closest("#modalCloseBtn");
        const cancelBtn = e.target.closest("#modalCancelBtn");
        const saveBtn = e.target.closest("#modalSaveBtn");
        const overlay = e.target.closest("#eventModalOverlay");
        const overlayDirect = e.target.id === "eventModalOverlay";

        if (addBtn) {
          editingEventId = null;
          const titleEl = document.getElementById("eventModalTitle");
          if (titleEl) titleEl.innerText = "Etkinlik Ekle";
          showModal();
        }
        if (closeBtn || cancelBtn || (overlayDirect && !e.target.closest(".modal"))) {
          hideModal();
        }
        if (saveBtn) await handleFormSubmit(user);

        const editBtn = e.target.closest(".edit-event-btn");
        if (editBtn) {
          e.stopPropagation();
          const id = editBtn.getAttribute("data-id");
          openEditModal(id);
          return;
        }

        const deleteBtn = e.target.closest(".delete-event-btn");
        if (deleteBtn) {
          e.stopPropagation();
          const id = deleteBtn.getAttribute("data-id");
          if (confirm("Bu etkinliği silmek istediğinize emin misiniz? Geri alınamaz.")) {
            const ok = await deleteEventBackend(id);
            if (ok) {
              await fetchEventsFromBackend();
              renderEventList();
            }
          }
          return;
        }
      }

      const clickedCard = e.target.closest(".event-card-clickable");
      if (clickedCard) {
        const id = clickedCard.getAttribute("data-id");
        showDetailModal(id);
      }

        const removeBtn = e.target.closest("#removeImageBtn");
        if (removeBtn) {
          e.preventDefault();
          e.stopPropagation();
          clearImageSelection();
        }

        const detailCloseBtn = e.target.closest("#detailCloseBtn");
      if (detailCloseBtn || e.target.id === "eventDetailOverlay") {
        hideDetailModal();
      }
    });

    if (isAuthorized) {
      document.body.addEventListener("change", (e) => {
        if (e.target.id === "evImage") {
          const file = e.target.files[0];
          if (file) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = (evt) => {
              base64PreviewString = evt.target.result;
              const previewDiv = document.getElementById("imagePreview");
              if (previewDiv) {
                previewDiv.style.display = "block";
                const img = previewDiv.querySelector("img");
                if (img) img.src = base64PreviewString;
              }
            };
            reader.readAsDataURL(file);
          } else {
            selectedImageFile = null;
            base64PreviewString = "";
            const previewDiv = document.getElementById("imagePreview");
            if (previewDiv) previewDiv.style.display = "none";
          }
        }

      });
    }

    // İşaretle ki sayfaya tekrar girildiğinde olay dinleyicileri tekrar eklenmesin
    isEventInitDone = true;
  }
}

// ==============================================================================
// 3. İŞ KODLARI (Render ve Senkronizasyon)
// ==============================================================================

function renderEventList() {
  const container = document.getElementById("eventsContainer");
  if (!container) return;

  // eventsData (backend'den gelir) üzerinde frontend içi filtreleme:
  let filtered = [...eventsData];

  if (currentCommittee) {
    filtered = filtered.filter(ev => ev.committee === currentCommittee);
  }

  if (currentType) {
    filtered = filtered.filter(ev => ev.event_type === currentType);
  }

  if (currentPeriod) {
    const now = new Date();
    if (currentPeriod === "upcoming") {
      filtered = filtered.filter(ev => new Date(ev.event_date) >= now);
    } else if (currentPeriod === "past") {
      filtered = filtered.filter(ev => new Date(ev.event_date) < now);
    }
  }

  filtered.sort((a, b) => {
    const dA = new Date(a.event_date);
    const dB = new Date(b.event_date);
    return currentSort === "newest" ? dB - dA : dA - dB;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding-top:40px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>Aradığınız kriterlere uygun etkinlik bulunamadı.</p>
      </div>`;
  } else {
    const sessionUser = getUser();
    const isSuperUser = ["ADMIN", "GENEL_SEKRETER", "ELCI"].includes((sessionUser.role || "").toUpperCase());

    container.innerHTML = filtered.map(ev => {
      const dateObj = new Date(ev.event_date);
      const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      // Sahibi veya admin mi?
      // Not: created_by db de text/UUID tutuluyor. Eğer user id si numeric string yapmıyorsanız dikkat.
      const canManageEvent = isSuperUser || (hasPerm(sessionUser, "events:create") && String(ev.created_by) === String(sessionUser.id));

      return `
        <div class="event-card event-card-clickable" data-id="${ev.id}">
          ${dateObj >= new Date()
          ? `<span class="period-badge upcoming">Gelecek Etkinlik</span>`
          : `<span class="period-badge past">Geçmiş Etkinlik</span>`
          }
          ${ev.image_url
          ? `<img src="${ev.image_url}" class="event-card-image" alt="Event Cover">`
          : `<img src="${EVENT_TYPE_DEFAULTS[ev.event_type] || EVENT_TYPE_DEFAULTS['default']}" class="event-card-image" alt="Event Cover">`
          }
          <div class="event-card-body">
            <h3 class="event-card-title">${ev.title}</h3>
            <p class="event-card-desc">${ev.description}</p>
            <div class="event-meta">
              <div class="event-meta-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                   <line x1="16" y1="2" x2="16" y2="6"></line>
                   <line x1="8" y1="2" x2="8" y2="6"></line>
                   <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                ${formattedDate} - ${timeStr}
              </div>
              <div class="event-meta-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${ev.location}
              </div>
            </div>
            <span class="event-committee-badge">${ev.committee}</span>
            ${ev.event_type ? `<span class="event-committee-badge" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); margin-left:8px;">${ev.event_type}</span>` : ""}
          </div>
          <div class="event-card-footer">
            <div class="event-creator-info">
              Ekleyen Görevli: <strong>${ev.profiles ? (ev.profiles.first_name + ' ' + ev.profiles.last_name) : 'Bilinmiyor'}</strong> <br/>
              <span style="opacity:0.6; font-size:10px;">Oluşturulma: ${new Date(ev.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
            ${canManageEvent ? `
              <div class="event-card-actions">
                <button class="icon-btn-simple edit edit-event-btn" data-id="${ev.id}" title="Düzenle">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="icon-btn-simple delete delete-event-btn" data-id="${ev.id}" title="Sil">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path>
                  </svg>
                </button>
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");
  }
}

async function handleFormSubmit(user) {
  const title = document.getElementById("evTitle").value.trim();
  const desc = document.getElementById("evDesc").value.trim();
  const dateTimeParam = document.getElementById("evDateTime").value; // "YYYY-MM-DDTHH:MM" formatında
  const location = document.getElementById("evLocation").value.trim();
  const committee = document.getElementById("evCommittee").value;
  const event_type = document.getElementById("evType")?.value;
  const participant_count = document.getElementById("evParticipantCount")?.value;


  if (!title || !dateTimeParam || !committee || !event_type || !location || !desc) {
    showToast("Lütfen tüm (*) alanları doldurun.", "error");
    return;
  }

  // Frontend verisini ISO stringe çevir
  const isoUtcDate = new Date(dateTimeParam).toISOString();

  // BACKEND İÇİN FORM DATA OLUŞTURUYORUZ
  const form = new FormData();
  form.append("title", title);
  form.append("description", desc);
  form.append("event_date", isoUtcDate);
  form.append("location", location);
  form.append("committee", committee);
  form.append("event_type", event_type);
  if (participant_count) {
    form.append("participant_count", participant_count);
  }

  if (selectedImageFile) {
    form.append("image", selectedImageFile);
  }

  showToast("Kaydediliyor...", "info"); // Kısa bilgilendirme

  if (editingEventId) {
    const success = await updateEventBackend(editingEventId, form);
    if (success) {
      editingEventId = null;
      hideModal();
      await fetchEventsFromBackend(); // veritabanından tekrar çek resim güncellendi
      renderEventList();
    }
  } else {
    const success = await createEventBackend(form);
    if (success) {
      hideModal();
      await fetchEventsFromBackend();
      renderEventList();
    }
  }
}

function openEditModal(idString) {
  const ev = eventsData.find(e => String(e.id) === idString);
  if (!ev) return;

  editingEventId = ev.id;

  document.getElementById("evTitle").value = ev.title;
  document.getElementById("evDesc").value = ev.description;

  // Date'ı local datetime-locale formatlamak lazim => YYYY-MM-DDTHH:MM
  const dObj = new Date(ev.event_date);
  const localIso = new Date(dObj.getTime() - (dObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  document.getElementById("evDateTime").value = localIso;

  document.getElementById("evLocation").value = ev.location || "";
  document.getElementById("evCommittee").value = ev.committee || "";
  document.getElementById("evType").value = ev.event_type || "";
  document.getElementById("evParticipantCount").value = ev.participant_count || "";

  // Sadece geçmiş etkinliklerde katılımcı sayısını göster
  updateParticipantRequirement();

  // Resim Göstergesi
  selectedImageFile = null;
  base64PreviewString = ev.image_url || "";
  const previewDiv = document.getElementById("imagePreview");
  if (base64PreviewString) {
    previewDiv.style.display = "block";
    const img = previewDiv.querySelector("img");
    if (img) img.src = base64PreviewString;
  } else {
    previewDiv.style.display = "none";
  }

  const titleEl = document.getElementById("eventModalTitle");
  if (titleEl) titleEl.innerText = "Etkinlik Düzenle";

  showModal();
}

function updateParticipantRequirement() {
  const dateTimeInput = document.getElementById("evDateTime");
  const participantGroup = document.getElementById("evParticipantGroup");
  const participantLabel = document.getElementById("evParticipantLabel");

  if (participantGroup && participantLabel) {
    // Her durumda göster ve opsiyonel olarak işaretle
    participantGroup.style.display = "block"; 
    participantLabel.innerHTML = `Katılımcı Sayısı <span style="font-size:11px; color:#888;">(Opsiyonel)</span>`;
  }
}

function showDetailModal(idString) {
  const ev = eventsData.find(e => String(e.id) === idString);
  if (!ev) return;

  const dateObj = new Date(ev.event_date);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const bodyHtml = `
    <img src="${ev.image_url || EVENT_TYPE_DEFAULTS[ev.event_type] || EVENT_TYPE_DEFAULTS['default']}" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin-bottom:16px; border: 1px solid rgba(255,255,255,0.1)">
    <h3 style="font-size:22px; margin-top:0; margin-bottom:8px; color:var(--text-main);">${ev.title}</h3>
    <div style="display:flex; gap:12px; margin-bottom:16px; font-size:13px; color:var(--text-muted);">
      <span style="display:flex; align-items:center; gap:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ${formattedDate} - ${formattedTime}
      </span>
      <span style="display:flex; align-items:center; gap:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        ${ev.location || "Belirtilmemiş"}
      </span>
    </div>
    <span class="event-committee-badge" style="margin-bottom:16px; display:inline-block;">${ev.committee}</span>
    ${ev.event_type ? `<span class="event-committee-badge" style="margin-bottom:16px; margin-left:8px; display:inline-block; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2);">${ev.event_type}</span>` : ""}
    <p style="font-size:15px; line-height:1.6; color:var(--text-main); margin-bottom:24px;">${ev.description || "Açıklama bulunmuyor."}</p>
    <div style="font-size:12px; color:var(--text-dim); border-top:1px solid var(--border-light); padding-top:16px;">
      Ekleyen Görevli (ID): <strong style="color:var(--text-muted);">${ev.profiles ? (ev.profiles.first_name + ' ' + ev.profiles.last_name) : ev.created_by}</strong><br>
      Kayıt Tarihi: ${new Date(ev.created_at).toLocaleString("tr-TR")}
    </div>
  `;

  document.getElementById("eventDetailBody").innerHTML = bodyHtml;
  document.getElementById("eventDetailOverlay").classList.add("open");
}

function hideDetailModal() {
  document.getElementById("eventDetailOverlay").classList.remove("open");
  const modalBody = document.getElementById("eventDetailBody");
  if (modalBody) modalBody.innerHTML = "";
}

function clearImageSelection() {
  selectedImageFile = null;
  base64PreviewString = "";
  const evImageInput = document.getElementById("evImage");
  if (evImageInput) evImageInput.value = "";
  
  const previewDiv = document.getElementById("imagePreview");
  if (previewDiv) previewDiv.style.display = "none";
}

function showModal() {
  updateParticipantRequirement();
  document.getElementById("eventModalOverlay").classList.add("open");
}

function hideModal() {
  document.getElementById("eventModalOverlay").classList.remove("open");
  document.getElementById("evTitle").value = "";
  document.getElementById("evDesc").value = "";
  document.getElementById("evDateTime").value = "";
  document.getElementById("evLocation").value = "";
  document.getElementById("evCommittee").value = "";
  if (document.getElementById("evType")) document.getElementById("evType").value = "";
  document.getElementById("evParticipantCount").value = "";
  
  // Katılımcı sayısı alanını opsiyonel olarak sıfırla
  updateParticipantRequirement();

  clearImageSelection();
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${type === 'success' ? '✅' : type === 'info' ? '🔄' : '❌'}
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
