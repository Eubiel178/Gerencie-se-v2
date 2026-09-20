import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  GOOGLE_CALENDAR_STATE_COOKIE,
  exchangeCodeForGoogleCalendarTokens,
  fetchGoogleAccountEmail,
  saveGoogleConnection,
} from "@/lib/integrations/google-calendar";

/**
 * Volta do consentimento do Google especificamente para o Calendar — nunca
 * concede nada além do que este fluxo pediu (ver `CALENDAR_SCOPES` em
 * `src/lib/google-calendar.ts`). Não usa nada do NextAuth: é um fluxo OAuth
 * próprio, porque o NextAuth não suporta autorização incremental de
 * escopos (login e Calendar têm que ser consentimentos separados).
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const expectedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((entry) => entry.startsWith(`${GOOGLE_CALENDAR_STATE_COOKIE}=`))
    ?.split("=")[1];

  const settingsUrl = new URL("/home/settings", request.url);

  if (oauthError) {
    // Ex.: usuário clicou em "Cancelar" na tela de consentimento do
    // Google (`access_denied`). Nunca é tratado como falha do sistema —
    // simplesmente não conectamos, e o app continua funcionando normal.
    settingsUrl.searchParams.set("google_calendar_error", "access_denied");
  } else if (!code || !state || !expectedState || state !== expectedState) {
    settingsUrl.searchParams.set("google_calendar_error", "invalid_state");
  } else {
    try {
      const tokens = await exchangeCodeForGoogleCalendarTokens(code);

      if (!tokens.access_token) {
        throw new Error("Sem access_token na resposta do Google.");
      }

      const email = await fetchGoogleAccountEmail(tokens.access_token);

      if (!email) {
        throw new Error("Não foi possível obter o e-mail da conta Google.");
      }

      await saveGoogleConnection(session.user.id, tokens, email);

      settingsUrl.searchParams.set("google_calendar_connected", "1");
    } catch {
      // Nunca vaza detalhes internos (nem o erro em si) pra URL/usuário —
      // só uma mensagem genérica; o essencial é não deixar a integração
      // "meio conectada" quando algo falha no meio do caminho.
      settingsUrl.searchParams.set("google_calendar_error", "connect_failed");
    }
  }

  const response = NextResponse.redirect(settingsUrl);
  // O cookie de estado é de uso único — some depois desta tentativa, com
  // sucesso ou sem.
  response.cookies.delete(GOOGLE_CALENDAR_STATE_COOKIE);

  return response;
}
