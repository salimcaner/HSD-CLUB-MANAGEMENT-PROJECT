//kişi kontrolü buradan sağlanacak
//getuser, setuser, clearuser gibi
import { buildPermissions } from "./acl.js";
const KEY = "app_user";

export function setUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser() {
 // const raw = localStorage.getItem(KEY);
  //return raw ? JSON.parse(raw) : null;
 const role = "UYE";

  return {
    first_name: "Test",
    last_name: "User",
    role: role,
    permissions: buildPermissions(role)
}}

export function clearUser() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  return !!getUser();
}