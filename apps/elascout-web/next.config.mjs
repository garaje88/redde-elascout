import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

// Enable Cloudflare bindings in local `next dev` (no-op in production build)
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;
