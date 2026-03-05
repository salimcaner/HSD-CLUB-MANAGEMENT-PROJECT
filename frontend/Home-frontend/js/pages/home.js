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

export function renderHome() {
  return `
    <section class="page home-page">
      <h1>Ana Sayfa</h1>
      <p>Hoş geldiniz.</p>
    </section>
  `;
}
