// In local dev, VITE_API_BASE_URL is empty so Vite's proxy handles /api → localhost:8089
// In production, set VITE_API_BASE_URL to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export default API_BASE_URL;
