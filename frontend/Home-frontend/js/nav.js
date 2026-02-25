//navbar burada olacak.7
/*
Ana Sayfa

Topluluk

Etkinlikler

Projeler

Raporlar

Takvim

Finans

Üye İşlemleri

Her item’ın görünme şartı:

public mi?

yoksa requiredPerms var mı?

Fonksiyon:

renderNav(user) → sadece yetkisi olan linkleri basar.*/
// nav.js

import { hasAnyPerm } from "./acl.js";

const NAV_ITEMS = [
  {
    label: "Ana Sayfa",
    path: "/home",
    required: [] // herkes görebilir
  },
  {
    label: "Topluluk",
    path: "/community",
    required: []
  },
  {
    label: "Etkinlikler",
    path: "/events",
    required: [] // sayfa public, aksiyonlar içeride kontrol edilir
  },
  {
    label: "Projeler",
    path: "/projects",
    required: []
  },
  {
    label: "Raporlar",
    path: "/reports",
    required: []
  },
  {
    label: "Takvim",
    path: "/calendar",
    required: ["calendar:read"]
  },
  {
    label: "Finans",
    path: "/finance",
    required: ["finance:read"]
  },
  {
    label: "Üye İşlemleri",
    path: "/members",
    required: ["members:read"]
  }
];
function buildNavLinks(user) {
  return NAV_ITEMS
    .filter(item => {
      return item.required.length === 0 || hasAnyPerm(user, item.required);
    })
    .map(item => `
      <li class="nav-item">
        <a href="#${item.path}" class="nav-link">
          ${item.label}
        </a>
      </li>`
    )
    .join("");
}
export function renderNav(user) {

  const navLinks = buildNavLinks(user);

  return `
    <!-- ===== SIDEBAR NAVBAR BAŞLANGIÇ ===== -->
    <div class="sidebar-container">

      <!-- LOGO ALANI -->
      <div class="sidebar-logo">
        <h2>Kulüp Yönetim</h2>
      </div>

      <!-- NAVIGATION MENU -->
      <ul class="sidebar-menu">
        ${navLinks}
      </ul>

      <!-- ALT BÖLÜM (Profil / Çıkış) -->
      <div class="sidebar-footer">
        <div class="user-info">
          ${user.first_name} ${user.last_name}
        </div>

        <a href="#/profile" class="nav-link">Profil</a>
        <a href="#/settings" class="nav-link">Ayarlar</a>

        <button id="logoutBtn" class="logout-btn">
          Çıkış Yap
        </button>
      </div>

    </div>
    <!-- ===== SIDEBAR NAVBAR BİTİŞ ===== -->
  `;
}
export function initNavEvents() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearUser();
      //window.location.href = "../../../login-frontend/login.html";
      window.location.href = "../home";
    });
  }
}