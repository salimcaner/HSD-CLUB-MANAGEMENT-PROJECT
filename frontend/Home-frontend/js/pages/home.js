/*
“Hoş geldin {rol}”

Özet kutuları (kartlar):

Yaklaşan etkinlik sayısı

Aktif projeler

Bekleyen onaylar (Genel Sekreter / IK için)

Son raporlar (yetkisi varsa)

“Hızlı işlemler” butonları (permission’a göre):

Etkinlik ekle (events.create)

Proje ekle (projects.create)

Üye ekle (members.create)*/

export function renderHome(User) {
  return `<h1>Ana Sayfa</h1>
  <a href="#/events">Etkinlikler<a/>"`;
}
