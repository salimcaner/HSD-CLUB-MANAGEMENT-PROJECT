import { buildPermissions } from "./acl.js";
const USER_KEY = "user"; // `login.js` sets 'user'
const TOKEN_KEY = "access_token";

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    // Give the user their active permissions based on their role
    if (user.role) {
      user.permissions = buildPermissions(user.role);
    }
    return user;
  } catch (e) {
    console.error("User parse error", e);
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken() && !!getUser();
}