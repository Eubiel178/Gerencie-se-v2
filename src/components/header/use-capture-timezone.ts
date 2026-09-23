"use client";

import { useEffect } from "react";

import { saveUserTimezoneAction } from "@/features/profile/actions";

// Uma vez por carregamento de página (não por navegação client-side —
// `Header` faz parte do layout persistente, então isso não dispara de
// novo a cada troca de rota dentro do app) — informa ao servidor o fuso
// IANA de verdade do navegador. Ver comentário completo em
// `src/db/schema.ts` (coluna `timezone`) e `src/lib/google-calendar.ts`
// pro porquê disso existir: sincronizar com o Google Agenda precisa saber
// o fuso do USUÁRIO, não o do servidor (que em produção não é o mesmo).
export function useCaptureTimezone(): void {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return;

    void saveUserTimezoneAction(timezone);
  }, []);
}
