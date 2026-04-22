const isLocal = window.location.hostname === "127.0.0.1" 
             || window.location.hostname === "localhost";
export const BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";
