import type { Metadata, Viewport } from "next";

import { SessionProvider } from "next-auth/react";

import "@/design-system/tokens/tokens.css";
import "@/design-system/tokens/motion.css";
import "@/styles/global-style.css";

import { ThemeInit } from "@/design-system/theme/theme-init";
import { ServiceWorkerRegistration } from "@/features/pwa/service-worker-registration";
import { appUrl } from "@/lib/shared/app-url";
import { GoogleAnalytics } from "@/providers/google-analytics";
import { ToastProvider } from "@/providers/toast-context";

const siteUrl = appUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Gerencie-se",
  title: {
    default: "Gerencie-se | Organize tarefas, rotina e foco",
    template: "%s | Gerencie-se",
  },
  description:
    "Organize tarefas, rotina, hábitos e foco num só lugar. Um companheiro virtual acompanha sua execução e ajuda quando você trava ou se distrai.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Gerencie-se",
    title: "Gerencie-se | Organize tarefas, rotina e foco",
    description:
      "Organize tarefas, rotina, hábitos e foco num só lugar. Um companheiro virtual acompanha sua execução e ajuda quando você trava ou se distrai.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Gerencie-se",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Gerencie-se | Organize tarefas, rotina e foco",
    description:
      "Organize tarefas, rotina, hábitos e foco num só lugar. Um companheiro virtual acompanha sua execução e ajuda quando você trava ou se distrai.",
    images: ["/icon-512.png"],
  },
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gerencie-se",
  },
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
        <GoogleAnalytics>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </GoogleAnalytics>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
