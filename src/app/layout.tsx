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
  // Preenchida só quando o Google Search Console pedir a verificação do
  // domínio pelo método "tag HTML" (o único viável num domínio *.vercel.app
  // — não dá pra fazer verificação por DNS aí, quem controla esse DNS é a
  // Vercel, não o dono do projeto). Cole o código que o Search Console
  // mostrar (só o valor do atributo `content`, sem a tag inteira) na
  // variável de ambiente `GOOGLE_SITE_VERIFICATION`. Sem essa variável
  // configurada, a tag simplesmente não é renderizada — nada quebra.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
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
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
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
