import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import "@/design-system/tokens/tokens.css";
import "@/design-system/tokens/motion.css";
import "@/styles/global-style.css";

import { themeInitScript } from "@/design-system/theme/theme-script";

export const metadata: Metadata = {
  title: "Gerencie-se",
  description:
    "Produtividade, organização, foco e disciplina em um só lugar.",
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
            tema errado. Ver design-system/theme/theme-script.ts. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
