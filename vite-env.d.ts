/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string;
  readonly VITE_POCKETBASE_EMAIL?: string;
  readonly VITE_POCKETBASE_PASSWORD?: string;
  readonly VITE_AUTH_REQUIRED?: string;
  readonly VITE_FORCE_HTTP?: string;
  readonly VITE_FORCE_PROXY?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
