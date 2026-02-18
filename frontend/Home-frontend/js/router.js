/*URL hash’i okur: #/events gibi

Hangi sayfa modülü çalışacak belirler

Route guard yapar:

events.read yoksa → 403 ekranı

Fonksiyonlar:

startRouter()

render403()

renderNotFound()*/

import { getUser } from "./store.js";
import { hasAnyPerm } from "./acl.js";

import { renderHome } from "./pages/home.js";
import { renderCommunity } from "./pages/community.js";
import { renderEvents } from "./pages/events.js";
import { renderProjects } from "./pages/projects.js";
import { renderReports } from "./pages/reports.js";
import { renderCalendar } from "./pages/calendar.js";
import { renderFinance } from "./pages/finance.js";
import { renderMembers } from "./pages/members.js";
import { renderProfile } from "./pages/profile.js";
import { renderSettings } from "./pages/settings.js";

const LOGIN_URL = "../../../login-frontend/login.html";

const ROUTES = {
    "/login" : {render: renderLogin},
    "/home":      { render: renderHome, required: []},
    "/community": { render: renderCommunity, required: [] },

    "/events":    { render: renderEvents,   required: []},
    "/projects":  { render: renderProjects, required: []},
    "/reports":   { render: renderReports,  required: []},
    "/calendar":  { render: renderCalendar, required: ["calendar.read"] },
    "/finance":   { render: renderFinance,  required: ["finance.read"] },
    "/members":   { render: renderMembers,  required: ["members.read"] },

    "/profile":   { render: renderProfile,  required: [] }, 
    "/settings":  { render: renderSettings, required: [] }
};

function getPathFromHash() {
  const hash = location.hash || "#/home";
  const path = hash.startsWith("#") ? hash.slice(1) : hash;
  return path.startsWith("/") ? path : `/${path}`;
}

function renderNotFound(appEl) {
  appEl.innerHTML = `
    <h2>404</h2>
    <p>Sayfa bulunamadı.</p>
    <a href="#/home">Ana Sayfa</a>
  `;
}

function renderForbidden(appEl) {
  appEl.innerHTML = `
    <h2>403</h2>
    <p>Bu sayfaya erişim yetkin yok.</p>
    <a href="#/home">Ana Sayfa</a>
  `;
}

function redirectToLogin() {
  // Nereye dönmesi gerektiğini de parametreyle taşıyalım
  const returnTo = encodeURIComponent(location.href);
  window.location.href = `${LOGIN_URL}?returnTo=${returnTo}`;
}

export function router() {
  const appEl = document.getElementById("app");
  const user = getUser();
if (!user) {
    redirectToLogin();
    return;
  }

  const path = getPathFromHash();
  const route = ROUTES[path];

  if (!route) {
    renderNotFound(appEl);
    return;
  }

  const required = route.required || [];
  if (required.length > 0 && !hasAnyPerm(user, required)) {
    renderForbidden(appEl);
    return;
  }

  appEl.innerHTML = route.render(user);
}

export function startRouter() {
  window.addEventListener("hashchange", router);
  window.addEventListener("load", router);
}