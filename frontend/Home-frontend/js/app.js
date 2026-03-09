//main dosyası Her şeyi başlatan dosya.
console.log("APP ÇALIŞTI");

// ── INIT TEMA (Sayfa yüklenirken hemen uygula)
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
    document.body.classList.add("light-theme");
}

import { renderNav, initNavEvents } from "./nav.js";
import { getUser, setUser } from "./store.js";
import { startRouter } from "./router.js";


let user = getUser();

if (user) {
  document.getElementById("root").innerHTML = renderNav(user);
  initNavEvents();
  startRouter();
}