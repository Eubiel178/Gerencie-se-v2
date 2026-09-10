import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";

import "@/design-system/tokens/tokens.css";
import "@/design-system/tokens/motion.css";
import "@/styles/global-style.css";

import { themeInitScript } from "@/design-system/theme/theme-script";
import { ServiceWorkerRegistration } from "@/features/pwa/service-worker-registration";

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
      <head>
        {/* Aplica o tema salvo antes da primeira pintura — evita flash do
            tema errado. Ver design-system/theme/theme-script.ts.
            `next/script` com `beforeInteractive` (em vez de uma tag
            <script> crua) porque só ele garante execução síncrona antes
            da hidratação nesta versão do Next — uma <script> renderizada
            direto pelo componente não é executada pelo navegador. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
