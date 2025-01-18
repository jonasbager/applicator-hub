/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_CLERK_AFTER_SIGN_IN_URL: string
  readonly VITE_CLERK_AFTER_SIGN_UP_URL: string
  readonly VITE_CLERK_AFTER_SIGN_OUT_URL: string
  readonly VITE_CLERK_SIGN_IN_URL: string
  readonly VITE_CLERK_SIGN_UP_URL: string
  readonly VITE_SITE_URL: string
  readonly VITE_LOGO_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
