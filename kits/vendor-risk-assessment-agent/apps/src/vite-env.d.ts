/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LAMATIC_PROJECT_ENDPOINT: string;
  readonly VITE_LAMATIC_PROJECT_ID: string;
  readonly VITE_LAMATIC_PROJECT_API_KEY: string;
  readonly VITE_LAMATIC_FLOW_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
