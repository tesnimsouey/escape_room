// Hand-written bindings for this project (matches wrangler.jsonc).
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD: string;
  INVESTIGATION_MINUTES: string;
  GRACE_MINUTES: string;
}
