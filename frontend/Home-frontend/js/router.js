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

//const LOGIN_URL = "../../../login-frontend/login.html";

const ROUTES = {
  "/home":      { load: () => import("./pages/home.js"),      required: [] },
  "/community": { load: () => import("./pages/community.js"), required: [] },
  "/events":    { load: () => import("./pages/events.js"),    required: [] },
  "/projects":  { load: () => import("./pages/projects.js"),  required: [] },
  "/reports":   { load: () => import("./pages/reports.js"),   required: [] },
  "/calendar":  { load: () => import("./pages/calendar.js"),  required: [] },
  "/finance":   { load: () => import("./pages/finance.js"),   required: ["finance:read"] },
  "/members":   { load: () => import("./pages/members.js"),   required: ["members:read"] },
  "/profile":   { load: () => import("./pages/profile.js"),   required: [] },
  "/settings":  { load: () => import("./pages/settings.js"),  required: [] },
};

function getPathFromHash() {
  const hash = location.hash || "#/home";
  const path = hash.startsWith("#") ? hash.slice(1) : hash;
  return path.startsWith("/") ? path : `/${path}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

//function redirectToLogin() {
// Nereye dönmesi gerektiğini de parametreyle taşıyalım
// const returnTo = encodeURIComponent(location.href);
//window.location.href = `${LOGIN_URL}?returnTo=${returnTo}`;
//}

export async function router() {
  const appEl = document.getElementById("page-content") || document.querySelector(".main-area");
  const user = getUser();

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

  // Sadece bu sayfanın modülünü yükle
  const mod = await route.load();

  appEl.innerHTML = mod.renderHome
    ? mod.renderHome(user)
    : mod[`render${capitalize(path.slice(1))}`]?.(user) ?? "";

  const initFnName = `init${capitalize(path.slice(1))}`;
  if (typeof mod[initFnName] === "function") {
    if (path === "/finance") {
      mod[initFnName](user);
    } else {
      mod[initFnName]();
    }
  }
}
export function startRouter() {
  window.addEventListener("hashchange", router);
  window.addEventListener("load", router);
}
