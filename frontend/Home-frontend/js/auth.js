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

import { buildPermissions } from "./acl.js";
const role = "ELCI";
const User = {
    id: "1",
    role: role,
    first_name: "first_name",
    last_name: "last_name",
    departmen: "Proje Departmanı",
    permissions: buildPermissions(role)
};

localStorage.setItem("User", JSON.stringify(User));
