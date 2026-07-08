/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEEDANCE_API_KEY?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
