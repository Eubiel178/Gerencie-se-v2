import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  GOOGLE_CALENDAR_STATE_COOKIE,
  getGoogleCalendarAuthUrl,
} from "@/lib/google-calendar";

/**
 * Início do fluxo de conexão do Google Agenda — totalmente separado do
 * login (`/api/auth/[...nextauth]`). Só é alcançado quando o usuário clica
 * em "Conectar Google Agenda" nas Configurações, nunca automaticamente.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Estado aleatório guardado num cookie httpOnly de curta duração —
  // protege contra CSRF no redirecionamento de volta do Google (o
  // callback só aceita o `code` se o `state` bater com o que está aqui).
  const state = crypto.randomUUID();

  let authUrl: string;

  try {
    authUrl = getGoogleCalendarAuthUrl(state);
  } catch {
    // Faltam as variáveis de ambiente GOOGLE_CALENDAR_* (Google Cloud não
    // configurado ainda — ver GOOGLE_SETUP.md). Isso nunca deve derrubar a
    // aplicação com um erro 500: o usuário só não consegue conectar a
    // Agenda agora, mas o resto do app continua funcionando normalmente.
    const settingsUrl = new URL("/home/settings", request.url);
    settingsUrl.searchParams.set("google_calendar_error", "not_configured");

    return NextResponse.redirect(settingsUrl);
  }

  const response = NextResponse.redirect(authUrl);

  response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
