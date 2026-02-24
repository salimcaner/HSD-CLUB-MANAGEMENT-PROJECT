/*Liste + filtre

Komite filtresi

Etiket filtresi

Arama

Etkinlik kartları / tablo

Başlık, tarih, komite etiketi, tag’ler

Aksiyonlar (permission + scope)

+ Etkinlik Ekle (events.create)

Kart üzerinde:

Düzenle (events.update + scope)

Sil (events.delete + scope)

Etiket zorunluluğu burada:

Etkinlik türü seçince zorunlu tag kontrolü

Kaydetmeden önce validate*/
import { hasAnyPerm } from "../acl.js";
import { getUser } from "../store.js";

export function renderEvents() {

  const user = getUser();

  const canCreate = hasAnyPerm(user, ["events:create"]);

  return `
    <section class="page events-page">
      <h1>Etkinlikler</h1>

      ${canCreate ? `
        <button id="addEventBtn">Etkinlik Ekle</button>
      ` : ""}

      <div class="event-list">
        <p>Etkinlik listesi burada olacak</p>
      </div>
    </section>
  `;
}
