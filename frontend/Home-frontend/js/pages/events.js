import { getUser } from "../store.js";
import { hasPerm } from "../acl.js";

// ==============================================================================
// BACKEND ENTEGRASYON NOTLARI:
// Eğer uygulamanız backend'e bağlı ise, tüm veriyi localStorage veya mock objelerden değil
// fetch API veya axios aracılığıyla (REST servisinize) atacağınız HTTP requestleriyle almalısınız.
// ÖRNEK (Fetch API ile Tüm etkinlikleri çekmek GET):
/*
  const API_URL = "http://localhost:3000/api/events";
  
  async function loadEventsFromDB() {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token") // Kullanıcı yetkilendirmesi
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Etkinlikler alınamadı:", error);
    }
  }
*/
//
// Etkinlik Ekleme (POST) 
/*
  async function addEventToDB(eventData) {
    try {
      const response = await fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(eventData)
      });
      return await response.json();
    } catch (error) {
      console.error("Etkinlik kaydedilemedi:", error);
    }
  }
*/
// ==============================================================================

// --- Komite Seçenekleri ---
const COMMITTEES = [
  "Yönetim Kurulu",
  "Proje Komitesi",
  "Pazarlama ve Sosyal Medya Komitesi",
  "Sponsorluk ve Organizasyon Komitesi",
  "Akademi Komitesi"
];

// --- Mock Data (Geçici Veritabanı) ---
let mockEvents = [
  {
    id: "evt_101",
    title: "Yaza Merhaba Partisi",
    description: "Tüm kulüp üyelerinin katılacağı yaza merhaba partisinde canlı müzik, dj performansları ve yarışmalar bizleri bekliyor.",
    date: "2026-06-15",
    time: "19:00",
    location: "Kampüs Bahçesi / Açık Alan",
    committee: "Sponsorluk ve Organizasyon Komitesi",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    created_by_name: "Ayşe Yılmaz",
    created_at: "2026-03-01T14:30:00Z"
  },
  {
    id: "evt_102",
    title: "Yapay Zeka ve Kariyer Semineri",
    description: "Sektörün önde gelen uzmanlarıyla birlikte geleceğin yapay zeka teknolojilerini tartışacağız. Networking arası mevcuttur.",
    date: "2026-04-22",
    time: "14:00",
    location: "Üniversite Konferans Salonu",
    committee: "Akademi Komitesi",
    image: "https://images.unsplash.com/photo-1591453006520-22709280d908?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    created_by_name: "Mehmet Demir",
    created_at: "2026-03-05T09:15:00Z"
  },
  {
    id: "evt_103",
    title: "Sosyal Medya Yönetimi Atölyesi",
    description: "Sosyal medya analitikleri, içerik planlaması ve etkileşim artırma yollarını öğreneceğimiz pratik bir etkinlik.",
    date: "2026-04-10",
    time: "10:30",
    location: "Fakülte Laboratuvarı - Sınıf C",
    committee: "Pazarlama ve Sosyal Medya Komitesi",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    created_by_name: "Zeynep Kaya",
    created_at: "2026-03-07T11:45:00Z"
  }
];

// --- State Variables ---
let currentSearch = "";
let currentCommittee = "";
let currentSort = "newest"; // "newest" or "oldest"
let base64ImageString = ""; // Modal'daki geçici resim
let editingEventId = null;

// ==============================================================================
// 1. RENDER (Arayüz Çizimi)
// ==============================================================================
export function renderEvents(user) {
  // Yönetici Yetkisi Kontrolü (Mock yetki kontrolü - isterseniz farklı koşul koyabilirsiniz)
  // Profilinden veya `user.role` verisinden yönetim/admin yetkisine bakılır.
  const isAuthorized = hasPerm(user, "events:create");

  const committeeOptions = COMMITTEES.map(c => `<option value="${c}">${c}</option>`).join("");

  return `
    <!-- Stil bağlama -->
    <link rel="stylesheet" href="../css/events.css">
    
    <div class="events-page">
      <!-- Üst Başlık -->
      <div class="events-header">
        <div class="events-title-block">
          <h1>Etkin<span>likler</span></h1>
        </div>
      </div>

      <!-- Araç Çubuğu (Arama, Filtreleme ve Aksiyon) -->
      <div class="events-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="searchInput" placeholder="Etkinlik adına göre ara...">
          </div>

          <select class="filter-select" id="committeeFilter">
            <option value="">Tüm Komiteler</option>
            ${committeeOptions}
          </select>

          <select class="filter-select" id="sortFilter">
            <option value="newest">Tarih (En Yeni)</option>
            <option value="oldest">Tarih (En Eski)</option>
          </select>
        </div>

        <div class="toolbar-right">
          ${isAuthorized ? `
            <button class="btn btn-primary" id="addEventBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Etkinlik Ekle
            </button>
          ` : ""}
        </div>
      </div>

      <!-- Etkinlik Kartları Listesi -->
      <div id="eventsContainer" class="events-grid">
        <!-- JS ile Doldurulacak -->
      </div>
    </div>

    <!-- Etkinlik Ekleme Modalı (Sadece yetkisi olanlar için oluşturulur) -->
    ${isAuthorized ? buildModalHtml(committeeOptions) : ""}

    <!-- Etkinlik Detay Modalı (Herkes Görebilir) -->
    <div class="modal-overlay" id="eventDetailOverlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Etkinlik <span style="color:var(--accent)">Detayı</span></h2>
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
          <h2>Etkinlik <span>Ekle</span></h2>
          <button class="modal-close" id="modalCloseBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Etkinlik Adı</label>
            <input type="text" id="evTitle" placeholder="Örn: Kulüp Tanışma Toplantısı">
          </div>
          <div class="form-group">
            <label>Açıklama</label>
            <textarea id="evDesc" placeholder="Etkinliğin detayları..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tarih</label>
              <input type="date" id="evDate">
            </div>
            <div class="form-group">
              <label>Saat</label>
              <input type="time" id="evTime">
            </div>
          </div>
          <div class="form-group">
            <label>Konum</label>
            <input type="text" id="evLocation" placeholder="Mekan adı veya Zoom linki">
          </div>
          <div class="form-group">
            <label>İlgili Komite</label>
            <select id="evCommittee">
              <option value="">Komite Seçiniz...</option>
              ${committeeOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Etkinlik Görseli (Opsiyonel)</label>
            <input type="file" id="evImage" accept="image/*" style="display:block; width:100%; border:none; padding:5px 0;">
            <div id="imagePreview" style="margin-top:10px; display:none;">
               <img src="" style="max-height:100px; border-radius:6px; background:#111;">
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
export function initEvents() {
  const user = getUser();
  const isAuthorized = hasPerm(user, "events:create");

  renderEventList();

  // Toolbar Arama (Mevcut metne göre anında çalışır)
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase();
      renderEventList();
    });
  }

  // Komite Filtresi
  const committeeFilter = document.getElementById("committeeFilter");
  if (committeeFilter) {
    committeeFilter.addEventListener("change", (e) => {
      currentCommittee = e.target.value;
      renderEventList();
    });
  }

  // Tarih Sıralaması
  const sortFilter = document.getElementById("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderEventList();
    });
  }
  // Tüm Kullanıcılar İçin Click Dinleyicisi
  document.body.addEventListener("click", (e) => {
    // Ekle/Kaydet/Sil Modal Logic (Admin limitli)
    if (isAuthorized) {
      const addBtn = e.target.closest("#addEventBtn");
      const closeBtn = e.target.closest("#modalCloseBtn");
      const cancelBtn = e.target.closest("#modalCancelBtn");
      const saveBtn = e.target.closest("#modalSaveBtn");
      const overlay = e.target.closest("#eventModalOverlay");
      const overlayDirect = e.target.id === "eventModalOverlay";

      if (addBtn) {
        editingEventId = null;
        const titleSpan = document.querySelector("#eventModalOverlay h2 span");
        if(titleSpan) titleSpan.innerText = "Ekle";
        showModal();
      }
      if (closeBtn || cancelBtn || (overlayDirect && !e.target.closest(".modal"))) {
        hideModal();
      }
      if (saveBtn) handleFormSubmit(user);
      
      // Düzenleme İşlemi
      const editBtn = e.target.closest(".edit-event-btn");
      if (editBtn) {
        e.stopPropagation();
        const id = editBtn.getAttribute("data-id");
        openEditModal(id);
        return;
      }

      // Silme İşlemi
      const deleteBtn = e.target.closest(".delete-event-btn");
      if (deleteBtn) {
        e.stopPropagation(); 
        const id = deleteBtn.getAttribute("data-id");
        if(confirm("Bu etkinliği silmek istediğinize emin misiniz?")) {
           deleteEvent(id);
        }
        return; // Detay modülünün açılmasını önler
      }
    }

    // Detay Modal Logic (Herkes için)
    const clickedCard = e.target.closest(".event-card-clickable");
    if (clickedCard) {
      const id = clickedCard.getAttribute("data-id");
      showDetailModal(id);
    }
    
    const detailCloseBtn = e.target.closest("#detailCloseBtn");
    const detailOverlay = e.target.closest("#eventDetailOverlay");
    const detailOverlayDirect = e.target.id === "eventDetailOverlay";
    if (detailCloseBtn || (detailOverlayDirect && !e.target.closest(".modal"))) {
      hideDetailModal();
    }
  });

  // Yetkili Kullanıcılar İçin Ekstra Dinleyiciler
  if (isAuthorized) {
    // Delegated Event Listener for file upload preview
    document.body.addEventListener("change", (e) => {
      if (e.target.id === "evImage") {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            base64ImageString = evt.target.result;
            const previewDiv = document.getElementById("imagePreview");
            if (previewDiv) {
              previewDiv.style.display = "block";
              const img = previewDiv.querySelector("img");
              if (img) img.src = base64ImageString;
            }
          };
          reader.readAsDataURL(file);
        } else {
          base64ImageString = "";
          const previewDiv = document.getElementById("imagePreview");
          if (previewDiv) previewDiv.style.display = "none";
        }
      }
    });
  }
}

// ==============================================================================
// 3. İŞ KODLARI
// ==============================================================================

// Listeyi Filtrele & Sırala ve DOM'a Yazdır
function renderEventList() {
  const container = document.getElementById("eventsContainer");
  if (!container) return;

  let filtered = [...mockEvents];

  // Arama filtresi (Sadece alfabetik olarak başlıyorsa filtrele)
  if (currentSearch) {
    filtered = filtered.filter(ev => 
      ev.title.toLowerCase().startsWith(currentSearch)
    );
  }

  // Komite filtresi
  if (currentCommittee) {
    filtered = filtered.filter(ev => ev.committee === currentCommittee);
  }

  // Sıralama (newest = en ileri tarih (gelecek) / oldest = en eski tarih (geçmiş))
  filtered.sort((a, b) => {
    const dA = new Date(a.date + "T" + (a.time || "00:00"));
    const dB = new Date(b.date + "T" + (b.time || "00:00"));
    return currentSort === "newest" ? dB - dA : dA - dB;
  });

  // HTML'i çiz
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
    const isSuperUser = ["ADMIN", "GENEL_SEKRETER", "ELCI"].includes(sessionUser.role?.toUpperCase());

    container.innerHTML = filtered.map(ev => {
      // Tarih Formatlaması (ör: "15 Haziran 2026")
      const dateObj = new Date(ev.date);
      const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const canManageEvent = isSuperUser || (hasPerm(sessionUser, "events:create") && ev.created_by_name === sessionUser.name);

      return `
        <div class="event-card event-card-clickable" data-id="${ev.id}">
          ${ev.image 
            ? `<img src="${ev.image}" class="event-card-image" alt="Event Cover">` 
            : `<div class="event-card-image-placeholder">Resim Yok</div>`
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
                ${formattedDate} ${ev.time ? " - " + ev.time : ""}
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
          </div>
          <div class="event-card-footer">
            <div class="event-creator-info">
              Oluşturan: ${ev.created_by_name} <br/>
              <span style="opacity:0.6; font-size:10px;">${new Date(ev.created_at).toLocaleDateString("tr-TR")}</span>
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

// Yeni etkinlik oluştur veya güncelle
function handleFormSubmit(user) {
  const title = document.getElementById("evTitle").value.trim();
  const desc = document.getElementById("evDesc").value.trim();
  const date = document.getElementById("evDate").value;
  const time = document.getElementById("evTime").value;
  const location = document.getElementById("evLocation").value.trim();
  const committee = document.getElementById("evCommittee").value;

  if (!title || !date || !committee) {
     showToast("Lütfen Etkinlik Adı, Tarih ve Komite alanlarını doldurun.", "error");
     return;
  }

  if (editingEventId) {
    const eventIndex = mockEvents.findIndex(e => e.id === editingEventId);
    if (eventIndex > -1) {
      mockEvents[eventIndex].title = title;
      mockEvents[eventIndex].description = desc;
      mockEvents[eventIndex].date = date;
      mockEvents[eventIndex].time = time;
      mockEvents[eventIndex].location = location;
      mockEvents[eventIndex].committee = committee;
      if (base64ImageString !== mockEvents[eventIndex].image) {
        mockEvents[eventIndex].image = base64ImageString;
      }
      showToast("Etkinlik başarıyla güncellendi!", "success");
    }
    editingEventId = null;
  } else {
    // Oluşturanın bilgisini "user" objesinden (app.js'den gelen storage) alırız:
    const creatorName = user.name || "Anonim Admin";

    const newEvent = {
      id: "evt_" + Date.now(),
      title: title,
      description: desc,
      date: date,
      time: time,
      location: location,
      committee: committee,
      image: base64ImageString, // Base64 hali mock için. Backend'e genelde multipart FormData yollanır.
      created_by_name: creatorName,
      created_at: new Date().toISOString()
    };

    // Mock listeye ekle
    mockEvents.push(newEvent);
    showToast("Etkinlik başarıyla oluşturuldu!", "success");
  }

  hideModal();
  renderEventList();
}

function openEditModal(id) {
  const ev = mockEvents.find(e => e.id === id);
  if (!ev) return;

  editingEventId = id;

  document.getElementById("evTitle").value = ev.title;
  document.getElementById("evDesc").value = ev.description;
  document.getElementById("evDate").value = ev.date;
  document.getElementById("evTime").value = ev.time || "";
  document.getElementById("evLocation").value = ev.location || "";
  document.getElementById("evCommittee").value = ev.committee;
  
  base64ImageString = ev.image || "";
  const previewDiv = document.getElementById("imagePreview");
  if (base64ImageString) {
    previewDiv.style.display = "block";
    const img = previewDiv.querySelector("img");
    if (img) img.src = base64ImageString;
  } else {
    previewDiv.style.display = "none";
  }

  const modalTitleSpan = document.querySelector("#eventModalOverlay h2 span");
  if (modalTitleSpan) modalTitleSpan.innerText = "Düzenle";

  showModal();
}

// Etkinlik silme logic
function deleteEvent(id) {
  mockEvents = mockEvents.filter(ev => ev.id !== id);
  renderEventList();
  showToast("Etkinlik silindi.", "success");
}

// Detay Modal Toggle (Aç/Kapat & Doldur)
function showDetailModal(id) {
  const ev = mockEvents.find(e => e.id === id);
  if (!ev) return;

  const dateObj = new Date(ev.date);
  const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const bodyHtml = `
    ${ev.image ? `<img src="${ev.image}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px;">` : ""}
    <h3 style="font-size:22px; margin-top:0; margin-bottom:8px; color:#fff;">${ev.title}</h3>
    <div style="display:flex; gap:12px; margin-bottom:16px; font-size:13px; color:var(--text-muted);">
      <span style="display:flex; align-items:center; gap:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ${formattedDate} ${ev.time ? " - " + ev.time : ""}
      </span>
      <span style="display:flex; align-items:center; gap:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        ${ev.location || "Belirtilmemiş"}
      </span>
    </div>
    <span class="event-committee-badge" style="margin-bottom:16px; display:inline-block;">${ev.committee}</span>
    <p style="font-size:15px; line-height:1.6; color:var(--text-main); margin-bottom:24px;">${ev.description || "Açıklama bulunmuyor."}</p>
    <div style="font-size:12px; color:var(--text-dim); border-top:1px solid var(--border-light); padding-top:16px;">
      Oluşturan: <strong style="color:var(--text-muted);">${ev.created_by_name}</strong><br>
      Tarih: ${new Date(ev.created_at).toLocaleDateString("tr-TR")}
    </div>
  `;

  document.getElementById("eventDetailBody").innerHTML = bodyHtml;
  document.getElementById("eventDetailOverlay").classList.add("open");
}

function hideDetailModal() {
  document.getElementById("eventDetailOverlay").classList.remove("open");
  document.getElementById("eventDetailBody").innerHTML = "";
}

// Ekle Modal Toggle (Aç/Kapat & Temizle)
function showModal() {
  document.getElementById("eventModalOverlay").classList.add("open");
}

function hideModal() {
  document.getElementById("eventModalOverlay").classList.remove("open");
  // Form inputları temizlenir
  document.getElementById("evTitle").value = "";
  document.getElementById("evDesc").value = "";
  document.getElementById("evDate").value = "";
  document.getElementById("evTime").value = "";
  document.getElementById("evLocation").value = "";
  document.getElementById("evCommittee").value = "";
  document.getElementById("evImage").value = "";
  
  base64ImageString = "";
  document.getElementById("imagePreview").style.display = "none";
}

// Toast (Ufak alt bildirimler)
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${type === 'success' ? '✅' : '❌'}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // 3 saniye sonra bildirim silinsin
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
