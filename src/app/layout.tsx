import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";

import "@/design-system/tokens/tokens.css";
import "@/design-system/tokens/motion.css";
import "@/styles/global-style.css";

import { ThemeInit } from "@/design-system/theme/theme-init";
import { ServiceWorkerRegistration } from "@/features/pwa/service-worker-registration";
import { ToastProvider } from "@/providers/toast-context";

export const metadata: Metadata = {
  title: "Gerencie-se",
  description:
    "Produtividade, organização, foco e disciplina em um só lugar.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gerencie-se",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#14151f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {/* Aplica o tema salvo assim que o app monta no cliente — ver
            design-system/theme/theme-init.tsx pra entender por que isso
            não usa mais next/script com beforeInteractive. */}
        <ThemeInit />
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
