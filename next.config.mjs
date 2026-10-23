import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev(process.env.TEST_DB_PATH ? { persist: { path: process.env.TEST_DB_PATH } } : undefined);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
