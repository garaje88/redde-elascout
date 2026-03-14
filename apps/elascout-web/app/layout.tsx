import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { FirebaseAuthProvider } from "@/lib/firebase-auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElaScout — Athlete Intelligence Platform",
  description:
    "Plataforma de gestión, evaluación y análisis de deportistas de alto rendimiento.",
  icons: {
    icon: "/assets/images/ElaScout-Favicon-64.png",
    apple: "/assets/images/ElaScout-Icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-dark font-sans antialiased">
        <SessionProvider>
          <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
