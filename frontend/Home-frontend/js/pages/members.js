/*Sekme 1: Üye Listesi (members.read)

Filtre: komite

Komite lideri → sadece kendi komitesi

Sekme 2: Üye Ekle (members.create)

ad/soyad/email/komite seç

Komite lideri: komite otomatik (kilitli)

Sekme 3: Üye Düzenle (members.update)

(Elçi gibi roller)

rol atama, komite değiştirme (istersen ayrı permission)

Sekme 4: Üye Sil (members.delete)

Sadece Elçi gibi üst roller */
export function renderMembers() {
  return `
    <section class="page members-page">
      <h1>Üye İşlemleri</h1>
    </section>
  `;
}