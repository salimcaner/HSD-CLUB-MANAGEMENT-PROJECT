/*Gelir / gider listesi

Toplamlar

(finance.manage varsa) “Yeni kayıt ekle” formu

(finance.read varsa) sadece görüntüleme

Genelde sadece Elçi görür.
Diğer roller navbar’da bile çıkmaz. */
export function renderFinance() {
  return `
    <section class="page finance-page">
      <h1>Finans</h1>
    </section>
  `;
}