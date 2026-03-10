import { getUser, getToken } from "../store.js";

const API_URL = "http://localhost:8000";

// --- Global State for Charts ---
let committeeData = {
  labels: ['Yönetim Kurulu', 'Proje Komitesi', 'Pazarlama ve Sosyal Medya Komitesi', 'Sponsorluk ve Organizasyon Komitesi', 'Akademi Komitesi', 'Mezun'],
  counts: [0, 0, 0, 0, 0, 0]
};
let pieChartInstance = null;
let socialBarChartInstance = null;
let allEventsList = [];

// --- Dashboard Verilerini Çekme ve Çizme ---
async function fetchRecentActivities() {
  const listEl = document.getElementById("home-activity-list");
  const metricCards = document.querySelectorAll('.metric-info');
  if (!listEl) return;

  try {
    const token = getToken();
    const commonHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

    // 1. Tüm verileri paralel olarak başlat
    const [statsRes, committeeRes, activitiesRes, countdownRes, socialStatsRes, eventsRes] = await Promise.all([
      fetch(`${API_URL}/dashboard/stats`, { headers: commonHeaders }),
      fetch(`${API_URL}/dashboard/committees`, { headers: commonHeaders }),
      fetch(`${API_URL}/dashboard/activities`, { headers: commonHeaders }),
      fetch(`${API_URL}/dashboard/countdown`, { headers: commonHeaders }),
      fetch(`${API_URL}/social-media/stats`, { headers: commonHeaders }),
      fetch(`${API_URL}/events/?limit=100`, { headers: commonHeaders })
    ]);

    // 2. Verileri tek seferde çözümle
    let stats = { total_members: 0, meeting_count: 0, academy_count: 0, total_events: 0 };
    if (statsRes.ok) {
      stats = await statsRes.json();
    }

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      allEventsList = eventsData.data || [];
    }

    // 4. Metric Cards (Sayaçlar) Güncelle
    metricCards.forEach(card => {
      const p = card.querySelector('p');
      const h3 = card.querySelector('h3.counter-number');
      if (!p || !h3) return;

      const label = p.innerText.trim().toLowerCase();
      let targetValue = 0;

      if (label.includes('toplantı')) targetValue = stats.meeting_count || 0;
      else if (label.includes('akademi')) targetValue = stats.academy_count || 0;
      else if (label.includes('topluluk') || label.includes('etkinlik')) targetValue = stats.total_events || 0;
      else if (label.includes('üye')) targetValue = stats.total_members || 0;

      h3.setAttribute('data-target', targetValue);
      animateSingleCounter(h3, targetValue);
    });

    // 5. Komite Dağılımı (Pie Chart)
    if (committeeRes.ok) {
      const commData = await committeeRes.json();
      committeeData.labels = commData.labels;
      committeeData.counts = commData.counts;

      if (pieChartInstance) {
        pieChartInstance.data.labels = committeeData.labels;
        pieChartInstance.data.datasets[0].data = committeeData.counts;
        pieChartInstance.update();
      }
    }

    // 6. Son Aktiviteler
    if (activitiesRes.ok) {
      const actData = await activitiesRes.json();
      const activities = actData.activities || [];

      if (activities.length === 0) {
        listEl.innerHTML = `<li style="text-align:center; padding: 20px 0; color:var(--text-muted); font-size:14px;">Henüz aktivite bulunmuyor.</li>`;
      } else {
        listEl.innerHTML = activities.map(act => {
          const timeAgo = getTimeAgo(new Date(act.created_at));
          return `
            <li class="activity-item">
              <div class="activity-dot ${act.iconClass}"></div>
              <div class="activity-content">
                <p><strong>${act.title}:</strong> ${act.desc}</p>
                <span class="activity-time">${timeAgo}</span>
              </div>
            </li>
          `;
        }).join("");
      }
    }

    // 7. Geri Sayım (Countdown) Güncelleme
    if (countdownRes.ok) {
      const countdownData = await countdownRes.json();
      if (countdownData.success) {
        localStorage.setItem('countdown_event_name', countdownData.title);
        localStorage.setItem('countdown_event_datetime', countdownData.event_date);
        initCountdown(); // Tekrar başlat
      }
    }

    // 8. Sosyal Medya Bar Chart (İstatistiklerden Aylık Dağılım)
    if (socialStatsRes.ok) {
      const socialData = await socialStatsRes.json();
      const posts = socialData.data.posts || [];

      // Aylara göre grupla
      const monthlyCounts = new Array(12).fill(0);
      const monthlyInteractions = new Array(12).fill(0);

      posts.forEach(post => {
        if (post.post_date) {
          const date = new Date(post.post_date);
          const monthIdx = date.getMonth();
          monthlyCounts[monthIdx]++;
          monthlyInteractions[monthIdx] += (post.likes || 0) + (post.comments || 0) + (post.views || 0);
        }
      });

      // Sadece veri olan ayları veya son 6 ayı gösterebiliriz. Şimdilik ilk 6 ay kalsın veya dinamik yapalım.
      if (socialBarChartInstance) {
        socialBarChartInstance.data.datasets[0].data = monthlyCounts.slice(0, 6);
        // Tooltip için etkileşim verisini dataset'e ekleyelim (gizli olarak)
        socialBarChartInstance.data.datasets[0].interactions = monthlyInteractions.slice(0, 6);
        socialBarChartInstance.update();
      }
    }
  } catch (error) {
    console.error("Dashboard verileri yüklenirken hata:", error);
    listEl.innerHTML = `<li style="text-align:center; padding: 20px 0; color:var(--danger); font-size:14px;">Veriler yüklenemedi.</li>`;
  }
}

// Münferit sayaç animasyonu
function animateSingleCounter(element, target) {
  element.innerText = '0';
  const speed = 200;
  const inc = Math.max(1, target / speed);

  const updateCount = () => {
    const count = +element.innerText;
    if (count < target) {
      element.innerText = Math.ceil(count + inc);
      setTimeout(updateCount, 10);
    } else {
      element.innerText = target;
    }
  };
  updateCount();
}

// Zaman Farkı Hesaplama (ör: '2 saat önce')
function getTimeAgo(dateObj) {
  const seconds = Math.floor((new Date() - dateObj) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " yıl önce";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " ay önce";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " gün önce";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " saat önce";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " dakika önce";

  return "Az önce";
}

export function renderHome(user) {
  let userName = "Kullanıcı";
  if (user) {
    if (user.first_name || user.last_name) {
      userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    } else if (user.full_name) {
      userName = user.full_name;
    } else if (user.name) {
      userName = user.name;
    } else if (user.username) {
      userName = user.username;
    } else if (user.email) {
      userName = user.email.split('@')[0];
    }
  }

  return `
    <section class="page home-page">
      <div class="home-header">
        <div class="home-welcome">
          <h1>Merhaba, <span>${userName}</span> 🎉</h1>
          <p>Kulüp Yönetim Sistemi'ne hoş geldin. İşte bugünkü genel bakış.</p>
        </div>
        <div class="home-actions">
          ${user && user.role !== 'UYE' ? `
          <button class="btn btn-primary" id="btn-add-social">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Sosyal Medya Paylaşımı Gir
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Fotoğraf Slider -->
      <div class="home-slider" id="home-slider">
        <button class="slider-arrow slider-arrow-left" id="slider-prev" aria-label="Önceki">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="slider-track" id="slider-track">
          <div class="slider-slide">
            <img src="../../picture/01ef3c03-756f-40a2-97ec-deb10a750c3f.jpg" alt="Fotoğraf 1" class="slider-img" data-index="1"/>
          </div>
          <div class="slider-slide">
            <img src="../../picture/WhatsApp_Image_2025-05-20_at_15_vYYXOVg.08.20.jpeg" alt="Fotoğraf 2" class="slider-img" data-index="2"/>
          </div>
          <div class="slider-slide">
            <img src="../../picture/WhatsApp_Image_2025-05-20_at_12.36.42.jpeg" alt="Fotoğraf 3" class="slider-img" data-index="3"/>
          </div>
          <div class="slider-slide">
            <img src="../../picture/mobil.png" alt="Fotoğraf 4" class="slider-img" data-index="4"/>
          </div>
        </div>
        <button class="slider-arrow slider-arrow-right" id="slider-next" aria-label="Sonraki">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
        <div class="slider-dots" id="slider-dots">
          <span class="slider-dot active" data-slide="0"></span>
          <span class="slider-dot" data-slide="1"></span>
          <span class="slider-dot" data-slide="2"></span>
          <span class="slider-dot" data-slide="3"></span>
        </div>
      </div>

      <!-- Özet Kartları -->
      <div class="metrics-grid" id="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(124, 58, 237, 0.15); color: #a78bfa;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div class="metric-info">
            <h3 class="counter-number" data-target="0">0</h3>
            <p>Toplantı Sayısı</p>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(34, 197, 94, 0.15); color: #4ade80;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
          <div class="metric-info">
            <h3 class="counter-number" data-target="0">0</h3>
            <p>Akademi Etkinliği</p>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div class="metric-info">
            <h3 class="counter-number" data-target="0">0</h3>
            <p>Topluluk Etkinliği</p>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div class="metric-info">
            <h3 class="counter-number" data-target="0">0</h3>
            <p>Aktif Üye</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <div class="chart-container pie-chart-container">
          <h2 class="section-title">Komite Dağılımı</h2>
          <div class="canvas-wrapper">
             <canvas id="committeePieChart"></canvas>
          </div>
        </div>
        <div class="chart-container bar-chart-container">
          <h2 class="section-title">Sosyal Medya Etkileşimi</h2>
          <div class="canvas-wrapper">
             <canvas id="socialMediaBarChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Alt Kısım: Son Aktiviteler ve Etkinlik Sayaçları -->
      <div class="bottom-grid">
        <div class="recent-activities-wrapper">
          <h2 class="section-title">Son Aktiviteler</h2>
          <ul class="activity-list" id="home-activity-list">
             <li style="text-align:center; padding: 20px 0; color:var(--text-muted); font-size:14px;">Aktiviteler yükleniyor...</li>
          </ul>
        </div>
        
        <div class="countdown-wrapper">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 class="section-title" style="margin-bottom: 0;">Sıradaki Etkinliğe Son</h2>
            ${user && user.permissions?.includes('events:create') ? `
            <button class="btn btn-primary" id="btn-enter-counter" style="padding: 6px 12px; font-size: 12px; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
              Sayaç Gir
            </button>
            ` : ''}
          </div>
          <div class="countdown-grid tilt-card" id="event-countdown">
            <div class="countdown-item">
              <div class="countdown-number" id="cd-days">00</div>
              <div class="countdown-label">Gün</div>
            </div>
            <div class="countdown-item">
              <div class="countdown-number" id="cd-hours">00</div>
              <div class="countdown-label">Saat</div>
            </div>
            <div class="countdown-item">
              <div class="countdown-number" id="cd-minutes">00</div>
              <div class="countdown-label">Dakika</div>
            </div>
            <div class="countdown-item">
              <div class="countdown-number pulse-infinite" id="cd-seconds">00</div>
              <div class="countdown-label">Saniye</div>
            </div>
          </div>
          <p class="countdown-event-name">Yapay Zeka Zirvesi 2026</p>
        </div>
      </div>
    </section>

    <!-- Sosyal Medya Ekle Modal -->
    <div class="modal-overlay" id="social-modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Sosyal Medya Paylaşımı <span>Ekle</span></h2>
          <button class="modal-close" id="btn-close-social-modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Platform Seçiniz</label>
            <select id="social-platform" class="form-control">
              <option value="instagram">Instagram</option>
              <option value="medium">Medium</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">Youtube</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tarih</label>
            <input type="date" id="social-date" class="form-control" />
          </div>
          <div class="form-group">
            <label>Paylaşım Sayısı / Etkileşim</label>
            <input type="number" id="social-count" class="form-control" placeholder="Örn: 50" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="btn-cancel-social" style="color:var(--text-dim); background:transparent;">İptal</button>
          <button class="btn btn-primary" id="btn-save-social">Kaydet</button>
        </div>
      </div>
    </div>

    <!-- Sayaç Gir Modal -->
    <div class="modal-overlay" id="counter-modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Etkinlik <span>Sayacı Oluştur</span></h2>
          <button class="modal-close" id="btn-close-counter-modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Gelecek Etkinliklerden Seç</label>
            <select id="counter-event-select" class="form-control">
              <option value="">-- Bir Etkinlik Seçin (Opsiyonel) --</option>
            </select>
          </div>
          <div class="form-divider" style="margin: 15px 0; border-top: 1px solid var(--border-light); position: relative;">
            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-mid); padding: 0 10px; font-size: 11px; color: var(--text-dim);">VEYA MANUEL GİR</span>
          </div>
          <div class="form-group">
            <label>Etkinlik Adı</label>
            <input type="text" id="counter-event-name" class="form-control" placeholder="Örn: Yapay Zeka Zirvesi 2026" />
          </div>
          <div class="form-group">
            <label>Tarih</label>
            <input type="date" id="counter-event-date" class="form-control" />
          </div>
          <div class="form-group">
            <label>Saat</label>
            <input type="time" id="counter-event-time" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="btn-cancel-counter" style="color:var(--text-dim); background:transparent;">İptal</button>
          <button class="btn btn-primary" id="btn-save-counter">Kaydet</button>
        </div>
      </div>
    </div>
    
    <!-- Toast Container -->
    <div id="toast-container" class="toast-container"></div>
  `;
}

export function initHome() {
  fetchRecentActivities();
  // Chart.js render işlemleri
  renderCharts();

  // Sosyal medya buton eventleri
  initSocialModal();
  // Tilt efektini uygula
  initTiltEffect();

  // Rakam artış efekti (Sayaçlar)
  initNumberCounters();

  // Geri sayım sayacını başlat
  initCountdown();

  // Sayaç modal eventleri
  initCounterModal();

  // Slider'ı başlat
  initHomeSlider();
}

/**
 * Ana sayfa görsel slider mantığı
 */
function initHomeSlider() {
  const track = document.getElementById('slider-track');
  const slides = document.querySelectorAll('.slider-slide');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  const dots = document.querySelectorAll('.slider-dot');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  let autoPlayInterval;

  const updateSlider = (index) => {
    // Sınır kontrolü
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    currentIndex = index;

    // Kaydırma işlemi
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Dot güncelleme
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  };

  const nextSlide = () => updateSlider(currentIndex + 1);
  const prevSlide = () => updateSlider(currentIndex - 1);

  // Otomatik oynatma başlat
  const startAutoPlay = () => {
    stopAutoPlay(); // Varsa temizle
    autoPlayInterval = setInterval(nextSlide, 2000); // 5 saniyede bir
  };

  const stopAutoPlay = () => {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
  };

  // Event listenerlar
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoPlay(); // Manuel müdahalede zamanlayıcıyı sıfırla
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoPlay();
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      updateSlider(idx);
      startAutoPlay();
    });
  });

  // Mouse gelince durdur, gidince başlat
  const sliderContainer = document.getElementById('home-slider');
  if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', stopAutoPlay);
    sliderContainer.addEventListener('mouseleave', startAutoPlay);
  }

  // Başlangıçta çalıştır
  startAutoPlay();
}

function initNumberCounters() {
  const metricsGrid = document.getElementById('metrics-grid');
  const counters = document.querySelectorAll('.counter-number');

  if (!metricsGrid || counters.length === 0) return;

  let hasRun = false;

  const countUp = () => {
    counters.forEach(counter => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;

        // Bölünen rakam = hız artışı. Ne kadar küçükse o kadar hızlı biter.
        const speed = 200; // Animation total duraction approx
        const inc = target / speed;

        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 10);
        } else {
          counter.innerText = target;
        }
      };
      updateCount();
    });
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasRun) {
        hasRun = true;
        countUp();
        obs.disconnect(); // Sadece bir kere çalışsın
      }
    });
  }, { threshold: 0.1 });

  observer.observe(metricsGrid);
}

let countdownInterval;

function initCountdown() {
  let targetDate;
  let targetName = "Yapay Zeka Zirvesi 2026";

  const savedDateTime = localStorage.getItem('countdown_event_datetime');
  const savedName = localStorage.getItem('countdown_event_name');

  if (savedDateTime && savedName) {
    targetDate = new Date(savedDateTime);
    targetName = savedName;
  } else {
    // Demo amaçlı 5 gün ileri
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    targetDate.setHours(18, 0, 0, 0);
  }

  const nameEl = document.querySelector('.countdown-event-name');
  if (nameEl) nameEl.textContent = targetName;

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!daysEl) return;

  // Varsa eski intervali temizle
  if (countdownInterval) clearInterval(countdownInterval);

  function update() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance < 0) {
      clearInterval(countdownInterval);
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = days < 10 ? '0' + days : days;
    hoursEl.textContent = hours < 10 ? '0' + hours : hours;
    minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
    secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

function initCounterModal() {
  const overlay = document.getElementById('counter-modal-overlay');
  const btnEnter = document.getElementById('btn-enter-counter');
  const btnClose = document.getElementById('btn-close-counter-modal');
  const btnCancel = document.getElementById('btn-cancel-counter');
  const btnSave = document.getElementById('btn-save-counter');

  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      overlay.classList.add('open');

      // Populate select with upcoming events
      const select = document.getElementById('counter-event-select');
      if (select) {
        select.innerHTML = '<option value="">-- Bir Etkinlik Seçin (Opsiyonel) --</option>';
        const now = new Date();
        const upcoming = allEventsList.filter(ev => new Date(ev.event_date) > now);

        upcoming.forEach(ev => {
          const opt = document.createElement('option');
          opt.value = ev.id;
          opt.textContent = ev.title;
          select.appendChild(opt);
        });
      }

      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 10);
      document.getElementById('counter-event-date').value = localISOTime;

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('counter-event-time').value = `${hours}:${minutes}`;

      const savedName = localStorage.getItem('countdown_event_name');
      if (savedName) {
        document.getElementById('counter-event-name').value = savedName;
      }
    });

    // Handle select change
    const eventSelect = document.getElementById('counter-event-select');
    if (eventSelect) {
      eventSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;

        const event = allEventsList.find(ev => ev.id == selectedId);
        if (event) {
          document.getElementById('counter-event-name').value = event.title;

          const evDate = new Date(event.event_date);
          const tzOffset = evDate.getTimezoneOffset() * 60000;
          const localDate = (new Date(evDate - tzOffset)).toISOString().slice(0, 10);
          document.getElementById('counter-event-date').value = localDate;

          const hours = String(evDate.getHours()).padStart(2, '0');
          const minutes = String(evDate.getMinutes()).padStart(2, '0');
          document.getElementById('counter-event-time').value = `${hours}:${minutes}`;
        }
      });
    }
  }

  if (btnClose) btnClose.addEventListener('click', () => overlay.classList.remove('open'));
  if (btnCancel) btnCancel.addEventListener('click', () => overlay.classList.remove('open'));

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const name = document.getElementById('counter-event-name').value;
      const date = document.getElementById('counter-event-date').value;
      const time = document.getElementById('counter-event-time').value;

      if (!name || !date || !time) {
        showToast("Lütfen tüm alanları doldurunuz.", "error");
        return;
      }

      localStorage.setItem('countdown_event_name', name);
      localStorage.setItem('countdown_event_datetime', `${date}T${time}:00`);

      showToast("Sayaç başarıyla güncellendi!", "success");
      overlay.classList.remove('open');

      initCountdown(); // Restart the countdown with new data
    });
  }
}

function initTiltEffect() {
  const tiltCards = document.querySelectorAll('.tilt-card, .metric-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 degrees tilt
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

function renderCharts() {
  // Chart.defaults ile genel tema ayarları
  const isLightMode = document.body.classList.contains('light-theme');
  Chart.defaults.color = isLightMode ? '#64748b' : '#8a8d91'; // --text-dim
  Chart.defaults.font.family = "'Figtree', sans-serif";

  // Sütun Grafik (Sosyal Medya Paylaşımı) - Her zaman renderlanır
  const ctxBar = document.getElementById('socialMediaBarChart');
  if (ctxBar) {
    socialBarChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
        datasets: [{
          label: 'Paylaşım Sayısı',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(124, 58, 237, 0.8)',
          hoverBackgroundColor: '#7c3aed',
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(28, 29, 33, 0.9)',
            titleColor: isLightMode ? '#0f172a' : '#fff',
            bodyColor: isLightMode ? '#475569' : '#e2e8f0',
            borderColor: isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y;

                // Etkileşim sayısını (katılımcı) ekle
                const interactions = context.dataset.interactions ? context.dataset.interactions[context.dataIndex] : 0;
                return [label, `Toplam Katılımcı: ${interactions}`];
              }
            }
          }
        }
      }
    });
  }

  // Pasta Grafik (Komite Dağılımı) - Scroll edince (Intersection Observer ile)
  const pieContainer = document.querySelector('.pie-chart-container');
  const ctxPie = document.getElementById('committeePieChart');

  if (ctxPie && pieContainer) {
    const renderPie = () => {
      if (pieChartInstance) return; // Zaten çizildiyse tekrar çizme
      pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
          labels: committeeData.labels,
          datasets: [{
            data: committeeData.counts,
            backgroundColor: [
              '#f59e0b', // turuncu
              '#7c3aed', // mor
              '#ec4899', // pembe
              '#3b82f6', // mavi
              '#10b981', // yeşil
              '#94a3b8'  // mavi-gri (Mezun)
            ],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 2500, // Daha belirgin bir çıkış
            easing: 'easeInOutCirc'
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 20, color: isLightMode ? '#475569' : '#e2e8f0' }
            },
            tooltip: {
              backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(28, 29, 33, 0.9)',
              titleColor: isLightMode ? '#0f172a' : '#fff',
              bodyColor: isLightMode ? '#475569' : '#e2e8f0',
              borderColor: isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 12,
              boxPadding: 6
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        // threshold %30'dan %10'a düşürüldü ki mobil cihazlarda da rahat tetiklensin
        if (entry.isIntersecting) {
          renderPie();
          obs.disconnect();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(pieContainer);
  }
}

function initSocialModal() {
  const overlay = document.getElementById('social-modal-overlay');
  const btnAdd = document.getElementById('btn-add-social');
  const btnClose = document.getElementById('btn-close-social-modal');
  const btnCancel = document.getElementById('btn-cancel-social');
  const btnSave = document.getElementById('btn-save-social');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      overlay.classList.add('open');
      document.getElementById('social-date').valueAsDate = new Date();
    });
  }

  if (btnClose) btnClose.addEventListener('click', () => overlay.classList.remove('open'));
  if (btnCancel) btnCancel.addEventListener('click', () => overlay.classList.remove('open'));

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const platform = document.getElementById('social-platform').value.toLowerCase();
      const count = document.getElementById('social-count').value;
      const dateString = document.getElementById('social-date').value;

      if (!count || count <= 0) {
        showToast("Lütfen geçerli bir sayı giriniz.", "error");
        return;
      }

      try {
        const token = getToken();
        // Backend likes, comments, views bekliyor. Şimdilik hepsine aynı değeri veya paylaştırarak girelim.
        // Ama kullanıcıdan 'Paylaşım Sayısı / Etkileşim' olarak tek değer alıyoruz.
        // Backend'deki create_social_post likes, comments, views istiyor.
        // Query param olarak gönderiyoruz.

        const params = new URLSearchParams({
          platform: platform,
          post_date: new Date(dateString).toISOString(),
          likes: count,
          comments: 0,
          views: 0
        });

        const response = await fetch(`${API_URL}/social-media/?${params.toString()}`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          showToast(`${platform} için veriler kaydedildi!`, "success");
          overlay.classList.remove('open');
          document.getElementById('social-count').value = '';
          // Refresh data
          fetchRecentActivities();
        } else {
          const err = await response.json();
          showToast(err.detail || "Bir hata oluştu.", "error");
        }
      } catch (error) {
        console.error("Sosyal medya kaydedilirken hata:", error);
        showToast("Bağlantı hatası.", "error");
      }
    });
  }
}

function showToast(message, type = "success") {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success'
    ? '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>'
    : '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

  toast.innerHTML = `${icon} <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
