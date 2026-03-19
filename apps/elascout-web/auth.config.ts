import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — no Node.js-only imports.
 * Used by middleware.ts which runs on Cloudflare's edge runtime.
 * Providers are added in auth.ts (full config).
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
