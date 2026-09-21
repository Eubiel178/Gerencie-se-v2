import "server-only";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { google, calendar_v3 } from "googleapis";

import { db } from "@/db/client";
import { googleConnections } from "@/db/schema";
import { getUserTimezone } from "@/features/profile/get-user-timezone";
import { decryptToken, encryptToken } from "@/lib/security/token-encryption";

// Precisa dos plugins `utc`+`timezone` (não vem no dayjs "puro") pra
// converter um instante absoluto (o que o Google devolve) pro fuso de um
// usuário ESPECÍFICO — diferente de `new Date(x).getHours()`, que sempre
// lê no fuso do processo rodando o código, nunca no de quem realmente
// importa aqui.
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Integração com o Google Agenda — separada do login por completo (ver
 * `src/lib/auth.config.ts`, que só pede `openid email profile`).
 *
 * Escopos confirmados na documentação oficial do Google (ver
 * docs/GOOGLE_SETUP.md para as fontes): o menor conjunto que permite criar/ler/
 * editar/excluir eventos e listar os calendários do usuário pra ele
 * escolher qual sincronizar — nada de configurações, compartilhamento ou
 * outros dados do Google.
 */
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];

// Nome do cookie httpOnly de curta duração usado para proteção CSRF no
// fluxo de conexão do Google Agenda (rotas `connect`/`callback` em
// `src/app/api/google-calendar/`). Fica aqui — e não em um dos `route.ts`
// — porque um Route Handler do Next.js só pode exportar handlers HTTP
// (GET, POST, ...) e alguns campos de config; qualquer outro export
// quebra o build ("is not a valid Route export field").
export const GOOGLE_CALENDAR_STATE_COOKIE = "google_calendar_oauth_state";

const DEFAULT_EVENT_DURATION_MINUTES = 30;

export type GoogleConnectionRow = typeof googleConnections.$inferSelect;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Integração com o Google Agenda não configurada (faltam variáveis de ambiente GOOGLE_CALENDAR_*). Veja docs/GOOGLE_SETUP.md."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Gera a URL de consentimento do Google só para o Calendar — nunca a
 * mesma usada para login. `access_type: "offline"` + `prompt: "consent"`
 * são o que garante receber um refresh_token (confirmado na documentação
 * oficial do Google), inclusive numa reconexão. */
export function getGoogleCalendarAuthUrl(state: string): string {
  const client = getOAuth2Client();

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
    state,
  });
}

export async function exchangeCodeForGoogleCalendarTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  return tokens;
}

export async function fetchGoogleAccountEmail(
  accessToken: string
): Promise<string | null> {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  return data.email ?? null;
}

export async function getGoogleConnection(
  userId: string
): Promise<GoogleConnectionRow | null> {
  const [row] = await db
    .select()
    .from(googleConnections)
    .where(eq(googleConnections.userId, userId))
    .limit(1);

  return row ?? null;
}

export async function isGoogleCalendarConnected(
  userId: string
): Promise<boolean> {
  return (await getGoogleConnection(userId)) !== null;
}

export async function saveGoogleConnection(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  googleAccountEmail: string
): Promise<void> {
  if (!tokens.access_token) {
    throw new Error("O Google não retornou um access token.");
  }

  const existing = await getGoogleConnection(userId);

  // O Google só devolve refresh_token na PRIMEIRA autorização (ou quando
  // forçamos com prompt=consent, que sempre usamos) — mas por segurança,
  // se por algum motivo vier vazio numa reconexão, preservamos o anterior
  // em vez de apagar a capacidade de renovar o token. `existing.refreshToken`
  // já vem criptografado do banco — decifra antes de decidir o valor em
  // texto puro que será (re)criptografado logo abaixo.
  const refreshToken = tokens.refresh_token ?? (existing ? decryptToken(existing.refreshToken) : undefined);

  if (!refreshToken) {
    throw new Error(
      "O Google não retornou um refresh token. Tente conectar novamente."
    );
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 55 * 60 * 1000);

  // Nunca gravar token em texto puro — ver `src/lib/token-encryption.ts`.
  const encryptedAccessToken = encryptToken(tokens.access_token);
  const encryptedRefreshToken = encryptToken(refreshToken);

  if (existing) {
    await db
      .update(googleConnections)
      .set({
        googleAccountEmail,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      })
      .where(eq(googleConnections.userId, userId));
  } else {
    await db.insert(googleConnections).values({
      id: crypto.randomUUID(),
      userId,
      googleAccountEmail,
      calendarId: "primary",
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
    });
  }
}

export async function updateSelectedCalendar(
  userId: string,
  calendarId: string
): Promise<void> {
  await db
    .update(googleConnections)
    .set({ calendarId })
    .where(eq(googleConnections.userId, userId));
}

/** Revoga o token no Google e remove a conexão local. É best-effort do
 * lado do Google — mesmo que a revogação falhe (token já expirado, Google
 * fora do ar), a conexão é removida localmente de qualquer forma, porque o
 * que importa pro usuário é "minha conta não está mais conectada aqui". */
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  const connection = await getGoogleConnection(userId);

  if (connection) {
    try {
      const client = getOAuth2Client();
      await client.revokeToken(decryptToken(connection.accessToken));
    } catch {
      // Ignorado de propósito — ver comentário da função.
    }
  }

  await db.delete(googleConnections).where(eq(googleConnections.userId, userId));
}

async function getAuthorizedClient(userId: string) {
  const connection = await getGoogleConnection(userId);

  if (!connection) return null;

  const client = getOAuth2Client();

  client.setCredentials({
    access_token: decryptToken(connection.accessToken),
    refresh_token: decryptToken(connection.refreshToken),
    expiry_date: connection.expiresAt.getTime(),
  });

  // googleapis renova o access token sozinho quando expira (usando o
  // refresh_token) e emite este evento com o novo token — persistimos na
  // hora pra não perder a renovação quando o processo reiniciar. `tokens.*`
  // chega em texto puro do googleapis; sempre criptografamos antes de
  // gravar. `connection.accessToken`/`refreshToken` usados como fallback
  // já estão criptografados (vieram direto do banco), então não precisam
  // passar por `encryptToken` de novo.
  client.on("tokens", (tokens) => {
    void db
      .update(googleConnections)
      .set({
        accessToken: tokens.access_token ? encryptToken(tokens.access_token) : connection.accessToken,
        refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : connection.refreshToken,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : connection.expiresAt,
      })
      .where(eq(googleConnections.userId, userId));
  });

  return { client, connection };
}

export type GoogleCalendarOption = {
  id: string;
  summary: string;
  primary: boolean;
};

export async function listUserCalendars(
  userId: string
): Promise<GoogleCalendarOption[]> {
  const authorized = await getAuthorizedClient(userId);
  if (!authorized) return [];

  const calendar = google.calendar({ version: "v3", auth: authorized.client });
  const { data } = await calendar.calendarList.list();

  return (data.items ?? [])
    .filter((item): item is calendar_v3.Schema$CalendarListEntry & { id: string } => !!item.id)
    .map((item) => ({
      id: item.id,
      summary: item.summary ?? item.id,
      primary: !!item.primary,
    }));
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toGoogleDateTime(dateTimeLocal: string): string {
  // "2026-10-01T14:30" -> "2026-10-01T14:30:00" (Google exige segundos
  // quando "timeZone" é passado à parte, como fazemos aqui).
  return dateTimeLocal.length === 16 ? `${dateTimeLocal}:00` : dateTimeLocal;
}

function addMinutesLocal(dateTimeLocal: string, minutes: number): string {
  const date = new Date(dateTimeLocal);
  date.setMinutes(date.getMinutes() + minutes);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Formata um instante absoluto de volta pro formato de
 * `<input type="datetime-local">`, NO FUSO DE QUEM É DONO DO EVENTO —
 * usado ao ler de volta um evento que foi alterado no lado do Google.
 * Nunca usar `new Date(x).getHours()`/`formatDateForDatetimeLocalInput`
 * aqui: aquilo lê no fuso do processo que está rodando o código (do
 * servidor, não do usuário), que em produção não bate com o fuso de
 * ninguém de verdade. */
function toDateTimeLocalInput(instant: Date, timeZone: string): string {
  return dayjs(instant).tz(timeZone).format("YYYY-MM-DDTHH:mm");
}

export type TaskForCalendar = {
  title: string;
  description: string;
  scheduledAt: string;
};

export async function createCalendarEventForTask(
  userId: string,
  task: TaskForCalendar
): Promise<{ eventId: string; updatedAt: Date }> {
  const authorized = await getAuthorizedClient(userId);

  if (!authorized) {
    throw new Error("Google Agenda não conectado.");
  }

  const timeZone = await getUserTimezone(userId);
  const calendar = google.calendar({ version: "v3", auth: authorized.client });
  const start = toGoogleDateTime(task.scheduledAt);
  const end = toGoogleDateTime(addMinutesLocal(task.scheduledAt, DEFAULT_EVENT_DURATION_MINUTES));

  const { data } = await calendar.events.insert({
    calendarId: authorized.connection.calendarId,
    requestBody: {
      summary: task.title,
      description: task.description,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      // Marca o evento como criado por este app — não é usado para achar o
      // evento de volta (isso é feito pelo `googleEventId` salvo na
      // tarefa), só ajuda a identificar a origem se o usuário olhar os
      // detalhes do evento no Google.
      extendedProperties: { private: { gerenciSeTaskSync: "true" } },
    },
  });

  if (!data.id) {
    throw new Error("O Google não retornou o id do evento criado.");
  }

  return {
    eventId: data.id,
    updatedAt: data.updated ? new Date(data.updated) : new Date(),
  };
}

export async function updateCalendarEventForTask(
  userId: string,
  eventId: string,
  task: TaskForCalendar
): Promise<{ updatedAt: Date }> {
  const authorized = await getAuthorizedClient(userId);

  if (!authorized) {
    throw new Error("Google Agenda não conectado.");
  }

  const timeZone = await getUserTimezone(userId);
  const calendar = google.calendar({ version: "v3", auth: authorized.client });
  const start = toGoogleDateTime(task.scheduledAt);
  const end = toGoogleDateTime(addMinutesLocal(task.scheduledAt, DEFAULT_EVENT_DURATION_MINUTES));

  const { data } = await calendar.events.patch({
    calendarId: authorized.connection.calendarId,
    eventId,
    requestBody: {
      summary: task.title,
      description: task.description,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
    },
  });

  return { updatedAt: data.updated ? new Date(data.updated) : new Date() };
}

/** Exclui o evento correspondente no Google. Trata "já não existe mais"
 * (404/410) como sucesso — o objetivo (evento não existir mais) já está
 * satisfeito, então não faz sentido isso travar a exclusão da tarefa. */
export async function deleteCalendarEventForTask(
  userId: string,
  eventId: string
): Promise<void> {
  const authorized = await getAuthorizedClient(userId);
  if (!authorized) return;

  const calendar = google.calendar({ version: "v3", auth: authorized.client });

  try {
    await calendar.events.delete({
      calendarId: authorized.connection.calendarId,
      eventId,
    });
  } catch (error) {
    const status = (error as { code?: number; response?: { status?: number } })
      ?.response?.status;

    if (status !== 404 && status !== 410) {
      throw error;
    }
  }
}

export type GoogleEventSnapshot = {
  title: string;
  description: string;
  scheduledAt: string;
  updatedAt: Date;
} | null; // null = evento não existe mais no Google (excluído)

/** Busca o estado atual de um evento vinculado, para o polling
 * Google→App. Retorna `null` quando o evento foi excluído no Google (404
 * ou 410) — quem chama decide o que fazer com a tarefa nesse caso (ver
 * `syncTasksFromGoogle` em `src/features/tasks/sync.ts`). */
export async function getCalendarEventSnapshot(
  userId: string,
  eventId: string
): Promise<GoogleEventSnapshot> {
  const authorized = await getAuthorizedClient(userId);
  if (!authorized) return null;

  const calendar = google.calendar({ version: "v3", auth: authorized.client });

  try {
    const { data } = await calendar.events.get({
      calendarId: authorized.connection.calendarId,
      eventId,
    });

    if (data.status === "cancelled") {
      return null;
    }

    const startDateTime = data.start?.dateTime ?? data.start?.date;

    if (!startDateTime) {
      return null;
    }

    const timeZone = await getUserTimezone(userId);

    return {
      title: data.summary ?? "",
      description: data.description ?? "",
      scheduledAt: toDateTimeLocalInput(new Date(startDateTime), timeZone),
      updatedAt: data.updated ? new Date(data.updated) : new Date(),
    };
  } catch (error) {
    const status = (error as { code?: number; response?: { status?: number } })
      ?.response?.status;

    if (status === 404 || status === 410) {
      return null;
    }

    throw error;
  }
}
