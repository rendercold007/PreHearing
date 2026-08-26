// Single source of truth for the backend base URL. Set VITE_API_BASE_URL at build time
// to point the frontend at a deployed backend; falls back to the local dev server so a
// fresh checkout works with no configuration.
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
