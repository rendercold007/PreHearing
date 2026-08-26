/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Backend base URL, e.g. https://api.example.com/api. Optional — defaults to the
    // local dev server (see api/config.ts).
    readonly VITE_API_BASE_URL?: string;
    // Google OAuth "Web application" client ID. When unset, the Google button is hidden.
    // Must match the backend's GOOGLE_CLIENT_ID.
    readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
