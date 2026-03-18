import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mode?: "individual" | "organization";
      organizationId?: string;
      role?: "admin" | "coach" | "scout" | "viewer";
    } & DefaultSession["user"];
  }
}

async function refreshGoogleToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
    };
  } catch (error) {
    console.error("[auth] Error refreshing Google token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Login inicial: guarda tokens y tiempo de expiración
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + ((account.expires_in as number) ?? 3600) * 1000,
        };
      }
      // Token vigente — devolver sin cambios
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      // Token expirado — refrescar automáticamente
      return refreshGoogleToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      (session as any).idToken = token.idToken;
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
  session: {
    strategy: "jwt",
  },
});
