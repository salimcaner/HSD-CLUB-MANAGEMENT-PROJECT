import { hasAnyPerm } from "./acl.js";
import { clearUser } from "./store.js";

const NAV_ITEMS = [
  {
    label: "Ana Sayfa",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
    path: "/home",
    required: []
  },
  {
    label: "Topluluk",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.85"/></svg>`,
    path: "/community",
    required: []
  },
  {
    label: "Etkinlikler",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    path: "/events",
    required: []
  },
  {
    label: "Projeler",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="9" y="3" width="13" height="6" rx="1"/><rect x="2" y="13" width="13" height="6" rx="1"/><rect x="17" y="13" width="5" height="6" rx="1"/></svg>`,
    path: "/projects",
    required: []
  },
  {
    label: "Raporlar",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    path: "/reports",
    required: []
  },
  {
    label: "Takvim",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>`,
    path: "/calendar",
    required: ["calendar:read"]
  },
  {
    label: "Finans",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
    path: "/finance",
    required: ["finance:read"]
  },
  {
    label: "Üye İşlemleri",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.85"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
    path: "/members",
    required: ["members:read"]
  }
];

function buildNavLinks(user) {
  return NAV_ITEMS
    .filter(item => item.required.length === 0 || hasAnyPerm(user, item.required))
    .map(item => `
      <li class="nav-item">
        <a href="#${item.path}" class="nav-link" data-path="${item.path}" data-label="${item.label}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
          <span class="nav-indicator"></span>
        </a>
      </li>`)
    .join("");
}

export function renderNav(user) {
  const navLinks = buildNavLinks(user);
  let initials = "??";
  let fullName = "Bilinmeyen Kullanıcı";

  if (user) {
    if (user.first_name || user.last_name) {
      initials = (user.first_name?.[0] || "") + (user.last_name?.[0] || "");
      fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    } else if (user.full_name) {
      fullName = user.full_name;
      initials = user.full_name.split(" ").map(n => n[0]).join("").toUpperCase();
    } else if (user.name) {
      fullName = user.name;
      initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase();
    } else if (user.username) {
      fullName = user.username;
      initials = user.username.slice(0, 2).toUpperCase();
    }
  }

  return `
    <!-- ===== LAYOUT WRAPPER BAŞLANGIÇ ===== -->
    <div class="layout-wrapper">

      <!-- ===== SIDEBAR BAŞLANGIÇ ===== -->
      <aside class="sidebar">

        <!-- LOGO ALANI — kendi logonu buraya ekleyebilirsin -->
        <div class="sidebar-logo">
          <div class="logo-mark">
            <!-- Logo img etiketi: <img src="../picture/logobeyaz.png" alt="Logo" class="logo-img"> -->
            <div class="logo-placeholder">
              <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5"/><path d="M10 16l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="logo-text">
            <span class="logo-title">Kulüp</span>
            <span class="logo-sub">Yönetim</span>
          </div>
        </div>

        <!-- COLLAPSE BUTONU — her zaman görünür -->
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" title="Menüyü kapat/aç">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
          </svg>
        </button>

        <div class="sidebar-divider"></div>

        <!-- NAVİGASYON MENÜSÜ -->
        <nav class="sidebar-nav">
          <ul class="sidebar-menu">
            ${navLinks}
          </ul>
        </nav>

        <!-- ALT BÖLÜM -->
        <div class="sidebar-footer">
          <div class="sidebar-divider"></div>
          <div class="user-card">
            <div class="user-avatar">${initials}</div>
            <div class="user-details">
              <span class="user-name">${user.first_name} ${user.last_name}</span>
              <span class="user-role">${user.role}</span>
            </div>
            <button id="sidebarLogoutBtn" class="sidebar-logout-btn" title="Çıkış Yap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

      </aside>
      <!-- ===== SIDEBAR BİTİŞ ===== -->

      <!-- ===== SAĞ TARAF (TOPBAR) ===== -->
      <div class="main-area">

        <!-- ===== TOPBAR BAŞLANGIÇ ===== -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Menüyü aç/kapat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span class="topbar-page-title" id="pageTitle">Ana Sayfa</span>
          </div>

          <div class="topbar-right">

            <!-- Bildirim Butonu -->
            <button id="notifBtn" class="topbar-btn topbar-icon-btn topbar-notif" title="Bildirimler">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span class="notif-badge" id="notifBadge">3</span>
            </button>

            <!-- Profil Butonu -->
            <a href="#/profile" class="topbar-btn" title="Profil">
              <div class="topbar-avatar">${initials}</div>
            </a>

            <!-- Ayarlar Butonu -->
            <a href="#/settings" class="topbar-btn topbar-icon-btn" title="Ayarlar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </a>


          </div>
        </header>
        <!-- ===== TOPBAR BİTİŞ ===== -->

        <!-- Sayfa içeriği bu navbar'ın dışında, her sayfanın kendi dosyasında render edilecek -->
        <main id="page-content"></main>

      </div>
      <!-- ===== SAĞ TARAF BİTİŞ ===== -->

    </div>
    <!-- ===== LAYOUT WRAPPER BİTİŞ ===== -->
  `;
}

export function initNavEvents() {
  function syncNavState(path) {
    // Topbar'daki sayfa başlığını güncelle
    const titleEl = document.getElementById("pageTitle");
    const currentItem = NAV_ITEMS.find(item => item.path === path);
    
    if (titleEl) {
      if (currentItem) {
        titleEl.textContent = currentItem.label;
      } else if (path === "/profile") {
        titleEl.textContent = "Profil";
      } else if (path === "/settings") {
        titleEl.textContent = "Ayarlar";
      } else {
        titleEl.textContent = "Ana Sayfa";
      }
    }

    // Seçili link işaretini (active sınıfı) güncelle
    document.querySelectorAll(".nav-link[data-path]").forEach(link => {
      if (link.dataset.path === path) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // İlk açılışta route bul ve senkronize et
  const currentPath = window.location.hash.replace("#", "") || "/home";
  syncNavState(currentPath);

  // Hash (Url / Sayfa) değiştiğinde tekrar senkronize et (Profil ve Ayarlar için)
  window.addEventListener("hashchange", () => {
    const newPath = window.location.hash.replace("#", "") || "/home";
    syncNavState(newPath);
  });

  // Sidebar Kapat/Aç (collapse butonu — sidebar içindeki ok)
  const collapseBtn = document.getElementById("sidebarCollapseBtn");
  const sidebar = document.querySelector(".sidebar");
  const mainArea = document.querySelector(".main-area");

  function setSidebarCollapsed(collapsed) {
    if (collapsed) {
      sidebar.classList.add("sidebar--collapsed");
      mainArea.style.marginLeft = "64px";
    } else {
      sidebar.classList.remove("sidebar--collapsed");
      mainArea.style.marginLeft = "var(--sidebar-width)";
    }
  }

  if (collapseBtn && sidebar) {
    collapseBtn.addEventListener("click", () => {
      const isCollapsed = sidebar.classList.contains("sidebar--collapsed");
      setSidebarCollapsed(!isCollapsed);
    });
  }

  // Sidebar toggle (mobil hamburger — topbar'daki buton)
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar--open");
    });
  }

  // Bildirim Butonu
  const notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      // TODO: Bildirim paneli/dropdown aç
      // Şimdilik badge'i sıfırla
      const badge = document.getElementById("notifBadge");
      if (badge) badge.style.display = "none";
    });
  }

  // Çıkış Yap (ortak logout fonksiyonu)
  async function handleLogout() {
    try {
      await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.warn("Logout isteği başarısız (sunucu kapalı olabilir):", e);
    } finally {
      clearUser();
      window.location.href = "../../login-frontend/login.html";
    }
  }

  // Topbar logout butonu
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Sidebar footer logout butonu
  const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", handleLogout);
  }
}