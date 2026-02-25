//main dosyası Her şeyi başlatan dosya.
console.log("APP ÇALIŞTI");
import { renderNav, initNavEvents } from "./nav.js";
import { getUser } from "./store.js";
import { startRouter } from "./router.js";

const user = getUser();

if (user) {
  document.getElementById("sidebar").innerHTML = renderNav(user);//inner.HTML ile renderNav fonksiyonundan dönen HTML'i sidebar elementine ekliyoruz.
  initNavEvents();
}

startRouter();