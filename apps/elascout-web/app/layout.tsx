import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { FirebaseAuthProvider } from "@/lib/firebase-auth-provider";
import "./globals.css";

import { Bebas_Neue, Outfit, Inter } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
      <body
        className={`min-h-screen bg-dark antialiased ${bebasNeue.variable} ${outfit.variable} ${inter.variable}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <SessionProvider>
          <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
