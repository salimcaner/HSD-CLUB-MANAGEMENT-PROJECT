/*Backend olmadığı için demo giriş burada olur.

İçerik:

Rol seçme (dropdown)

“Giriş yap” butonu

Seçilen role göre user objesi üret:

role

permissions[]

committeeIds[] (komite lideri için)

Sonra:

store.setUser(user)

location.hash = "#/home"

Gerçek backend gelince bu dosya API çağıracak.*/

const User = {
    id: "1",
    role: "UYE",
    first_name: "Sümeyye",
    last_name: "Köse",
    departmen: "Proje"
}

localStorage.setItem("USer", JSON.stringify(user));
