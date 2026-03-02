//main dosyası Her şeyi başlatan dosya.
console.log("APP ÇALIŞTI");
import { renderNav, initNavEvents } from "./nav.js";
import { getUser } from "./store.js";
import { startRouter } from "./router.js";


const user = getUser();

if (user) {
  // Navigasyonu bas (Sidebar sabit kalır)
  document.getElementById("sidebar").innerHTML = renderNav(user);
  initNavEvents();
  
  // Router'ı başlat (Hangi sayfada olduğumuzu o belirleyecek)
  startRouter(); 
} else {
  // Kullanıcı yoksa login'e yönlendir
  window.location.href = "/login.html";
}