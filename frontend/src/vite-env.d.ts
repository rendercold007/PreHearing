/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Backend base URL, e.g. https://api.example.com/api. Optional — defaults to the
    // local dev server (see api/config.ts).
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
