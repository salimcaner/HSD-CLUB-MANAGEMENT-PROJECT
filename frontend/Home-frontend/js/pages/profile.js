/*Görünenler

Ad Soyad (demo ise “—” olabilir)

Email (varsa)

Rol (Elçi, Komite Lideri vs.)

Komite(ler) (committeeIds)

Sahip olduğu permission listesi (istersen gizli/kapalı; debug için iyi)

Butonlar

“Çıkış Yap” (store.clearUser + login’e yönlendir)

Bu sayfa backend gelince kullanıcı profilini API’den çekebilir. Şimdilik store’dan okur. */
export function renderProfile() {
  return `
    <section class="page profile-page">
      <h1>Pro<span>fil</span></h1>
    </section>
  `;
}