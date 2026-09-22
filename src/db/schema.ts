import { relations, sql } from "drizzle-orm";
import { boolean, customType, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// O driver `postgres` mapeia `bytea` <-> `Buffer` nativamente — só falta
// dizer ao Drizzle que tipo de coluna SQL essa é (não existe um builder
// pronto pra binário no `pg-core`, ao contrário de `text`/`integer`).
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Tabelas exigidas pelo Auth.js (login). O pacote `@auth/drizzle-adapter`
 * só exporta um helper `defineTables()` por um subpath interno não público
 * (`./lib/pg`, fora do `exports` do package.json), então replicamos aqui
 * exatamente a forma que o adapter espera internamente — mesmos nomes de
 * propriedade (`userId`, `providerAccountId`, `sessionToken`, etc.), só o
 * nome da coluna SQL segue nosso padrão snake_case. Esse schema é passado
 * explicitamente pro `DrizzleAdapter(db, { usersTable, accountsTable, ... })`
 * em `src/lib/auth.ts`.
 */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),

  // Avatar enviado pelo próprio usuário (Configurações → Conta) — mesmo
  // padrão de `taskAttachments`: binário guardado direto como `bytea` no
  // Postgres, sem storage externo. `image` continua sendo a URL usada
  // pra exibir (aponta pra `/api/profile/avatar/[userId]` quando o
  // usuário tem um avatar próprio); estas duas colunas só guardam o
  // conteúdo servido por trás dessa rota.
  avatarContent: bytea("avatar_content"),
  avatarMimeType: text("avatar_mime_type"),

  // Login por e-mail/senha (Credentials Provider) — ausente para usuários
  // que só entraram via Google.
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

/**
 * Token de recuperação de senha — dedicada, e não a `verification_token`
 * acima (que é gerenciada pelo `DrizzleAdapter` do Auth.js para os
 * próprios fluxos dele, ex. login por link mágico, que este app não usa
 * hoje). Um nome próprio evita qualquer confusão futura se um provider
 * baseado em e-mail for adicionado depois.
 *
 * O token em si já é a chave primária (256 bits de aleatoriedade — ver
 * `src/lib/password-reset.ts` — imprevisível o bastante pra não precisar
 * de um `id` separado). Uma linha é consumida (apagada) assim que usada
 * com sucesso, então "existir" já significa "ainda válido, ainda não
 * usado" — não precisa de uma coluna `used` à parte.
 */
export const passwordResetTokens = pgTable("password_reset_token", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

/**
 * Código de 6 dígitos que confirma a posse do e-mail de uma conta criada
 * por e-mail/senha (ver `registerAction`/`verifyEmailAction`). Uma linha
 * por usuário (PK = `userId`, não um token aleatório): o código só
 * precisa ser único NO CONTEXTO da própria conta (comparado sempre junto
 * com o `userId` da sessão já autenticada, nunca localizado pelo código
 * sozinho), diferente do `passwordResetTokens` acima, cujo token PRECISA
 * ser imprevisível globalmente (é ele quem identifica a conta, embutido
 * num link, sem sessão nenhuma por trás). Contas via Google nunca passam
 * por aqui — o provedor já confirma a posse do e-mail (ver `profile()`
 * em `auth.config.ts`).
 */
export const emailVerificationCodes = pgTable("email_verification_code", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  // Zerado a cada novo código gerado (reenvio); incrementado a cada
  // tentativa errada. Nunca trava a conta (mesma filosofia de
  // `loginAttempts` abaixo — um contador de bloqueio pode trancar o
  // próprio dono fora por engano) — só exige pedir um código novo depois
  // de `MAX_VERIFICATION_ATTEMPTS` (ver `email-verification.ts`), o que
  // já é uma ação que a própria pessoa consegue fazer sozinha.
  attempts: integer("attempts").notNull().default(0),
  // Controle no servidor, não só no botão do cliente: evita que chamadas
  // diretas ao Server Action disparem vários e-mails em sequência.
  lastSentAt: timestamp("last_sent_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Rastreia tentativas de login por senha malsucedidas, só para decidir
 * quando avisar o dono da conta por e-mail — nunca para bloquear login
 * (decisão consciente: um contador com bloqueio pode trancar o próprio
 * usuário fora da conta por engano; ver `src/lib/login-attempt-guard.ts`
 * para a lógica de janela/limiar/cooldown). Uma linha por usuário, só
 * para quem tem senha (login local) — login via Google não passa por
 * `authorize()`, não gera tentativa aqui.
 */
export const loginAttempts = pgTable("login_attempt", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  failedCount: integer("failed_count").notNull().default(0),
  // Início da janela atual de tentativas (reinicia quando passa muito
  // tempo desde a última tentativa, ou logo após um alerta ser enviado —
  // ver `recordFailedAttempt`). Nulo = nenhuma tentativa falha registrada.
  windowStartedAt: timestamp("window_started_at", { mode: "date" }),
  lastAlertSentAt: timestamp("last_alert_sent_at", { mode: "date" }),
});

/**
 * Conexão com o Google Agenda — completamente separada da tabela `account`
 * (que é só identidade de login). Uma linha por usuário: se ele desconectar
 * e conectar de novo, sobrescrevemos em vez de acumular lixo.
 */
export const googleConnections = pgTable("google_connection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  googleAccountEmail: text("google_account_email").notNull(),
  calendarId: text("calendar_id").notNull().default("primary"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  connectedAt: timestamp("connected_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Convite/vínculo de colaboração entre duas contas (ex.: casal, família).
 * Uma linha serve tanto pro convite pendente quanto pro vínculo aceito -
 * só o `status` muda. `addresseeId` começa nulo se o e-mail convidado
 * ainda não tinha conta; é preenchido depois, no login/cadastro de quem
 * tiver aquele e-mail (ver `src/features/connections/actions.ts`), sem
 * precisar de token por link - o match é sempre por e-mail.
 */
export const connections = pgTable("connection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  requesterId: text("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addresseeId: text("addressee_id").references(() => users.id, { onDelete: "cascade" }),
  addresseeEmail: text("addressee_email").notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  respondedAt: timestamp("responded_at", { mode: "date" }),
});

export const tasks = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Compartilhamento opcional com UMA conta conectada (ver `connections`)
  // - dono continua sendo `userId`; quem está aqui só ganha permissão de
  // ver/editar/concluir, nunca de excluir (ver `LocalTask`).
  sharedWithUserId: text("shared_with_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  tag: text("tag").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),

  // Data/hora agendada da tarefa — sem isso não há o que representar como
  // evento de calendário. Só é obrigatória no formulário quando o usuário
  // marca "Sincronizar com Google Agenda"; para uma tarefa comum (não
  // sincronizada) continua opcional, preservando o comportamento simples
  // de lista de tarefas que já existia. Guardado como texto (formato do
  // `<input type="datetime-local">`, ex. "2026-10-01T14:30"), no mesmo
  // padrão que `event.start`/`event.end` já usam — evita conversões de
  // fuso horário indesejadas entre o que o usuário digitou e o que é lido
  // de volta.
  scheduledAt: text("scheduled_at"),

  // Sincronização opcional com o Google Agenda (por tarefa).
  googleEventId: text("google_event_id").unique(),
  syncEnabled: boolean("sync_enabled").notNull().default(false),
  syncStatus: text("sync_status", {
    enum: ["NONE", "PENDING", "SYNCED", "ERROR"],
  })
    .notNull()
    .default("NONE"),
  syncError: text("sync_error"),
  // "updated" que o Google reportou da última vez que lemos o evento —
  // usado pra decidir, no polling Google→App, se o evento mudou desde a
  // última sincronização (evita sobrescrever a tarefa à toa a cada poll).
  googleEventUpdatedAt: timestamp("google_event_updated_at", { mode: "date" }),

  priority: text("priority", { enum: ["baixa", "media", "alta", "critica"] })
    .notNull()
    .default("media"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { mode: "date" }),
  // Estado atual de início da tarefa. Pode voltar a nulo quando a pessoa
  // desfaz o início; o XP recebido por começar continua sendo histórico.
  startedAt: timestamp("started_at", { mode: "date" }),
  workStatus: text("work_status", { enum: ["pending", "in_progress", "paused"] })
    .notNull()
    .default("pending"),
  // Quando esta tarefa foi pausada pela ÚLTIMA vez - direto na task, não
  // só na sessão de execução (`execution_session.paused_at`), porque só
  // UMA sessão fica rastreada no cliente por vez (a ativa/pausada mais
  // recente). Sem isso, o card de uma tarefa pausada há mais tempo (que
  // não é mais a sessão rastreada, porque outra tarefa foi iniciada
  // depois) perdia a informação de "há quanto tempo" - o badge "Pausada"
  // ficava sem contexto, ou pior, mostrava o horário da sessão ERRADA
  // (achado relatado: "perdi a data que foi pausada"). Mesmo raciocínio
  // de `completedAt` já existir na própria task, não numa tabela à parte.
  pausedAt: timestamp("paused_at", { mode: "date" }),

  // Vínculo opcional com um objetivo (nulo = tarefa avulsa).
  goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),

  // Recorrência simples (não é um motor de RRULE): ao concluir uma tarefa
  // recorrente, criamos a próxima ocorrência deslocando `scheduledAt` em vez
  // de gerar todas as instâncias futuras de uma vez.
  recurrence: text("recurrence", { enum: ["none", "daily", "weekly"] })
    .notNull()
    .default("none"),

  // Minutos de antecedência para lembrete (ex.: [1440, 5, 0] = 1 dia antes,
  // 5 min antes, na hora). Guardado como JSON porque é uma lista pequena e
  // só é lida no navegador do próprio usuário — não precisa de tabela
  // própria. `null` = sem lembrete configurado.
  reminderOffsetsMinutes: text("reminder_offsets_minutes"),
});

/**
 * "Quebrar tarefa em passos menores" (Modo Assistido) — mesmo desenho
 * de `goalSteps`: sem dono próprio, acesso sempre decidido pela tarefa
 * (dono OU colaborador). Nunca gerado automaticamente (nunca inventa
 * passos sozinho); só o que o usuário mesmo adicionar.
 */
export const taskSteps = pgTable("task_step", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
});

/**
 * Anexos de tarefa. Conteúdo guardado como `bytea` direto no Postgres —
 * sem storage externo (S3, blob, etc.), mesma base de dados que já
 * guarda todo o resto do app. É exatamente por essa escolha que existe
 * um teto de tamanho por arquivo (ver `MAX_ATTACHMENT_SIZE_BYTES` em
 * `src/lib/upload-limits.ts`).
 */
export const taskAttachments = pgTable("task_attachment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  // Quem enviou o anexo — pode ser o dono da tarefa ou um colaborador
  // (tarefa compartilhada). Usado em `LocalTaskAttachment.deleteAttachment`
  // pra decidir quem pode remover.
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  content: bytea("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const events = pgTable("event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  start: text("start").notNull(),
  end: text("end"),
  url: text("url"),
  backgroundColor: text("background_color"),
});

/** Rotina diária: horários fixos que se repetem todo dia (ex. "07:00 —
 * Acordar"). Pode opcionalmente apontar para uma tarefa real do dia. */
export const routineItems = pgTable("routine_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: text("shared_with_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  time: text("time").notNull(), // "HH:MM"
  title: text("title").notNull(),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Um registro por item de rotina por dia concluído — mesmo padrão de
 * `habit_log` (ver comentário lá): "feito hoje" é sempre calculado a
 * partir daqui, nunca guardado como campo solto em `routine_item`. */
export const routineItemLogs = pgTable(
  "routine_item_log",
  {
    // Não é chave primária: a chave real é a composta abaixo
    // (routineItemId, date) — só um identificador estável da linha.
    id: text("id")
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    routineItemId: text("routine_item_id")
      .notNull()
      .references(() => routineItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    completedAt: timestamp("completed_at", { mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // Nunca dois registros do mesmo item no mesmo dia (idempotente ao
    // marcar/desmarcar duas vezes seguidas) — mesmo raciocínio de
    // `habit_log`, inclusive o compartilhamento: dono e colaborador
    // compartilham o MESMO registro do dia, quem marcar primeiro "trava".
    primaryKey({ columns: [table.routineItemId, table.date] }),
  ]
);

export const goals = pgTable("goal", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: text("shared_with_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  deadline: text("deadline"), // "YYYY-MM-DD", opcional
  priority: text("priority", { enum: ["baixa", "media", "alta", "critica"] })
    .notNull()
    .default("media"),
  archived: boolean("archived").notNull().default(false),
  completedAt: timestamp("completed_at", { mode: "date" }),
  completionOverride: boolean("completion_override"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Progresso do objetivo = etapas concluídas / total de etapas — calculado,
 * nunca guardado, pra nunca ficar dessincronizado. */
export const goalSteps = pgTable("goal_step", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const habits = pgTable("habit", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: text("shared_with_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  frequency: text("frequency", { enum: ["daily", "weekly"] })
    .notNull()
    .default("daily"),
  // Só usado quando frequency = "weekly" (ex.: 3x por semana).
  targetPerWeek: integer("target_per_week"),
  goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Um registro por hábito por dia concluído — sequência/porcentagem são
 * calculadas a partir daqui, nunca guardadas. */
export const habitLogs = pgTable(
  "habit_log",
  {
    // Não é chave primária: a chave real é a composta abaixo
    // (habitId, date). Guardado só como identificador estável da linha
    // (ex.: usado num `DELETE ... WHERE id = ...` depois de já ter
    // localizado o registro pela chave composta).
    id: text("id")
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    completedAt: timestamp("completed_at", { mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // Nunca dois registros do mesmo hábito no mesmo dia (idempotente ao
    // marcar/desmarcar duas vezes seguidas). Esta é a ÚNICA chave
    // primária da tabela — Postgres não aceita duas (ver `id` acima).
    primaryKey({ columns: [table.habitId, table.date] }),
  ]
);

export const focusSessions = pgTable(
  "focus_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Sessões de foco representam instantes reais (início/fim), nunca um
    // horário "solto". `withTimezone` mantém o instante estável entre o
    // servidor, a API e o navegador; a conversão para o horário da pessoa
    // acontece somente na apresentação (ver `format-focus-session-started-at`).
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    endedAt: timestamp("ended_at", { mode: "date", withTimezone: true }),
    plannedDurationSeconds: integer("planned_duration_seconds").notNull(),
    actualDurationSeconds: integer("actual_duration_seconds"),
    status: text("status", { enum: ["running", "completed", "cancelled"] })
      .notNull()
      .default("running"),
    xpEarned: integer("xp_earned").notNull().default(0),
    // Opcional - preenchido só quando a sessão começou a partir do botão
    // "Focar nesta tarefa" (ver `src/features/tasks/components/tasks-list/card`).
    // `onDelete: "set null"` de propósito: apagar a tarefa depois nunca
    // deve apagar o histórico da sessão de foco em si, só perder essa
    // referência.
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  },
  (table) => [
    // Garante no banco o que `LocalFocusSession.start()` já assume: no
    // máximo UMA sessão "running" por usuário. Sem isto, duas chamadas de
    // `start()` bem próximas (duplo-clique, duas abas) liam a mesma sessão
    // órfã expirada antes de qualquer uma terminar de finalizá-la, e as
    // duas inseriam sua própria sessão nova — XP da sessão órfã creditado
    // 2x, e duas sessões "running" ao mesmo tempo (achado numa revisão de
    // código). Índice PARCIAL (só sobre linhas com `status = 'running'`):
    // várias sessões "completed"/"cancelled" do mesmo usuário continuam
    // permitidas, só nunca duas "running" simultâneas.
    uniqueIndex("focus_session_one_running_per_user")
      .on(table.userId)
      .where(sql`${table.status} = 'running'`),
  ]
);

/** Uma linha por usuário — nível/mascote não têm histórico, só estado
 * atual. Humor do mascote é calculado a partir da atividade recente, não
 * guardado aqui (ver `src/features/mascot`). */
export const mascotStates = pgTable("mascot_state", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Chunchumaru"),
  personality: text("personality", {
    enum: ["afetuoso", "sarcastico", "engracado", "motivador", "zen"],
  })
    .notNull()
    .default("afetuoso"),
  // Personagem do mascote que anda pela tela (PixiJS, ver
  // src/features/mascot-pet) — só existem esses hoje (ver
  // characterIdForSpecies e public/mascot/pet/CREDITS.txt). Coluna `text`
  // simples (não um enum nativo do Postgres): adicionar espécie nova é só
  // atualizar esta lista de tipos, sem migração.
  species: text("species", {
    enum: [
      "gato",
      "cachorro",
      "passaro",
      "urso",
      "raposa",
      "panda",
      "golden",
      "akita",
      "dogue-alemao",
      "gato-preto",
      "gato-angora",
      "gato-tabby",
      "gato-laranja",
      "gato-lilas",
      "gato-siames",
    ],
  })
    .notNull()
    .default("panda"),
  totalXp: integer("total_xp").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Preferências gerais do usuário que não pertencem a nenhum domínio
 * específico — evita criar uma tabela nova a cada preferência simples. */
export const userPreferences = pgTable("user_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // Fuso IANA (ex. "America/Sao_Paulo") capturado do NAVEGADOR na primeira
  // vez que o usuário abre o app depois desta feature existir (ver
  // `src/features/profile/actions.ts` → `saveUserTimezoneAction` e o
  // componente que a chama em `src/components/header`). Nulo até essa
  // primeira captura acontecer.
  //
  // Por que existe: rodando localmente, o fuso do processo Node sempre
  // batia com o do usuário (mesma máquina) — mas hospedado (Vercel), o
  // servidor roda em UTC, então usar o fuso do processo pra montar/ler
  // eventos do Google Agenda passaria a interpretar toda hora agendada
  // como se fosse UTC, gerando um deslocamento de horas em todo evento
  // sincronizado. Ver `src/lib/google-calendar.ts` (`getUserTimezone`,
  // usado em vez de `Intl.DateTimeFormat().resolvedOptions().timeZone`
  // do servidor).
  timezone: text("timezone"),
  hydrationDailyGoalMl: integer("hydration_daily_goal_ml").notNull().default(2000),
  assistantEnabled: boolean("assistant_enabled").notNull().default(true),
  assistantReducedPresence: boolean("assistant_reduced_presence").notNull().default(false),
  // Fala automática do Companion (balão espontâneo com TTS) na página de
  // Tarefas — ligado por padrão, mas o TTS em si só toca depois que o
  // navegador "desbloqueia" áudio (algum gesto do usuário na página, ver
  // `src/lib/speech/audio-unlock.ts`) por causa das restrições de autoplay.
  // Desligar isso NUNCA remove o balão escrito, só o áudio.
  assistantAutoSpeechEnabled: boolean("assistant_auto_speech_enabled").notNull().default(true),
  // Marca quando o convite único "quer que eu fale às vezes?" já foi
  // respondido (ver `speech-onboarding-prompt.tsx`) — nunca mais
  // reaparece depois disso, independente da resposta. Não é uma permissão
  // de navegador de verdade (TTS de saída não pede uma) — é só uma
  // pergunta de produto, uma vez, num momento real (primeira fala
  // espontânea do Companion), nunca fingindo um prompt nativo.
  assistantAutoSpeechPromptShown: boolean("assistant_auto_speech_prompt_shown").notNull().default(false),
  // Só usado pra decidir quais links da navegação fazem sentido mostrar
  // (ex.: Ciclo Menstrual) — nunca exposto/usado fora disso.
  gender: text("gender", { enum: ["feminino", "masculino", "nao_informado"] })
    .notNull()
    .default("nao_informado"),
  // Desligado por padrão de propósito: e-mail é uma ação que sai do app,
  // nunca deve começar a disparar sozinho sem o usuário pedir (ver
  // `features/weekly-summary`).
  weeklySummaryEnabled: boolean("weekly_summary_enabled").notNull().default(false),
  // Segundo canal (além do push, `push_subscription`) pra lembrete de
  // tarefa — mesmo raciocínio de `weeklySummaryEnabled` (desligado por
  // padrão, e-mail nunca começa a disparar sozinho). Só cobre tarefas
  // porque é a única entidade com lógica de vencimento pronta
  // (`computeDueReminders`) — objetivos/eventos não têm isso ainda.
  emailTaskReminders: boolean("email_task_reminders").notNull().default(false),
  // Marcado quando o usuário fecha ou pula o checklist de primeiro acesso
  // (ver `features/onboarding`) — nunca reaparece depois disso, mesmo que
  // algum item continue incompleto.
  onboardingDismissed: boolean("onboarding_dismissed").notNull().default(false),
  // Marcado quando o usuário termina ou pula o tour guiado (balões
  // apontando pra navegação/busca/checklist/mascote no Dashboard - ver
  // `features/guided-tour`) - mesmo raciocínio de `onboardingDismissed`
  // (nunca reaparece sozinho), só que separado porque são dois fluxos
  // independentes: dá pra pular o tour e ainda ver o checklist, ou vice-versa.
  guidedTourDismissed: boolean("guided_tour_dismissed").notNull().default(false),
  // Limite de interrupções (Modo Assistido): quantas mensagens contextuais
  // já foram auto-abertas HOJE (ver MAX_DAILY_INSIGHTS em
  // `local-assistant-preferences.ts`) — zera sozinho quando a data muda,
  // sem precisar de um job/cron pra resetar.
  assistantDailyInsightCount: integer("assistant_daily_insight_count").notNull().default(0),
  assistantDailyInsightDate: text("assistant_daily_insight_date"),
  // Repetir a MESMA mensagem de novo (ex.: em cada `router.refresh()`
  // enquanto a mesma condição persiste) nunca consome cota — só uma
  // mensagem com texto diferente da última conta como nova interrupção.
  assistantLastInsightText: text("assistant_last_insight_text"),
  // Cota PRÓPRIA e separada da acima — o balão espontâneo do Companion na
  // página de Tarefas (ver `companion-phrasing.ts`) não compete pela MESMA
  // cota dos insights do Widget (deadline/streak/sobrecarga etc.). Widget
  // e Companion são disparados por sistemas completamente diferentes; uma
  // cota compartilhada faz o Companion parecer quebrado sempre que o
  // Widget já avisou de algo antes no dia (achado em teste manual: usuário
  // clicou "Começar" e nada apareceu, porque o Widget já tinha usado as 5
  // interrupções do dia com avisos sem relação nenhuma com a tarefa
  // clicada).
  //
  // DUAS cotas, não uma só (evolução do design original de cota única):
  // eventos MEANINGFUL (começou/concluiu tarefa, prazo perto/vencido) são
  // raros e importantes por natureza - não podem ser bloqueados só porque
  // o Companion já comentou algo CASUAL (saudação, sessão longa,
  // ociosidade) antes no dia. `assistant_companion_daily_count/date`
  // (nome mantido do design anterior) virou a cota CASUAL especificamente;
  // `assistant_companion_meaningful_*` é a cota nova, maior, só pros
  // eventos que realmente importam.
  assistantCompanionDailyCount: integer("assistant_companion_daily_count").notNull().default(0),
  assistantCompanionDailyDate: text("assistant_companion_daily_date"),
  assistantCompanionMeaningfulCount: integer("assistant_companion_meaningful_count").notNull().default(0),
  assistantCompanionMeaningfulDate: text("assistant_companion_meaningful_date"),
  assistantCompanionLastText: text("assistant_companion_last_text"),
  // Limite explícito de espaço ("fique quieto por um tempo") — diferente
  // das cotas acima (que só reduzem VOLUME). Enquanto `now < quietUntil`,
  // interações CASUAIS ficam totalmente suprimidas e as MEANINGFUL só
  // saem no tom mais discreto disponível (ver `companion-moves.ts`).
  // Nasce SÓ de uma resposta explícita a uma pergunta do próprio
  // Companion ("quer que eu fale menos por um tempo?") — nunca inferido
  // silenciosamente a partir de fechamentos manuais do balão (fechar
  // continua significando só "fechar esta mensagem", ver
  // `use-tasks-companion.ts`). Expira sozinho, sem botão de cancelar.
  // Representa um INSTANTE real comparado direto contra `Date.now()`
  // (nunca um horário "solto") — `withTimezone` obrigatório aqui, mesmo
  // raciocínio de `focusSession.startedAt/endedAt` acima: sem isso, o
  // valor grava/lê usando o fuso LOCAL do processo Node como se fosse
  // UTC, deslocando o instante real pelo offset da máquina (bug real
  // encontrado em teste: expirava/comparava errado por causa disso).
  assistantCompanionQuietUntil: timestamp("assistant_companion_quiet_until", { mode: "date", withTimezone: true }),
});

export const hydrationLogs = pgTable("hydration_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // "YYYY-MM-DD"
  amountMl: integer("amount_ml").notNull(),
  loggedAt: timestamp("logged_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const runningSessions = pgTable("running_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  durationSeconds: integer("duration_seconds").notNull(),
  distanceMeters: integer("distance_meters").notNull(),
  // "manual" = usuário digitou distância/tempo; "gps" = calculado a partir
  // de coordenadas do navegador durante uma corrida ativa.
  source: text("source", { enum: ["manual", "gps"] }).notNull().default("manual"),
});

/** Uma linha por conquista já desbloqueada (ver `features/achievements`)
 * — nunca guarda o ESTADO da condição (isso é sempre recalculado, ver
 * comentário de `mascotStates`), só QUANDO cada uma foi desbloqueada pela
 * primeira vez. Existir aqui é o que diferencia "acabou de desbloquear
 * agora" (dispara o toast + XP) de "já tinha desbloqueado antes". */
export const achievementUnlocks = pgTable(
  "achievement_unlock",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.userId, table.achievementId] })]
);

/** Lista pessoal de leitura. Recomendações/tendências (livros populares)
 * NÃO ficam aqui — são dados mockados em código (ver
 * `src/features/reading/recommendations.ts`), claramente identificados como
 * mock, até existir uma fonte externa real. */
export const readingItems = pgTable("reading_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  status: text("status", {
    enum: ["want_to_read", "reading", "finished"],
  })
    .notNull()
    .default("want_to_read"),
  progressPercent: integer("progress_percent").notNull().default(0),
  totalPages: integer("total_pages"),
  currentPage: integer("current_page"),
  dailyReadingGoal: integer("daily_reading_goal"),
  // Preenchido só quando o status muda para "finished" — marca o instante
  // real da conclusão do livro, usada como timestamp do Histórico. Nulo
  // enquanto o livro não for concluído (inclui livros que já estavam
  // concluídos antes desta coluna existir).
  finishedAt: timestamp("finished_at", { mode: "date" }),
  addedAt: timestamp("added_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Cuidados preventivos (check-ups, vacinas, exames de rotina) — só
 * lembretes e organização, nunca diagnóstico. */
export const healthCheckups = pgTable("health_checkup", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  intervalDays: integer("interval_days"),
  lastDoneAt: text("last_done_at"), // "YYYY-MM-DD"
  notes: text("notes"),
});

/**
 * Inscrição de notificação push do navegador (Web Push) — uma linha por
 * combinação usuário+dispositivo/navegador (a mesma pessoa pode ter o app
 * instalado no celular E aberto no PC, cada um com seu próprio `endpoint`).
 * `p256dh`/`auth` são as chaves públicas que o navegador gerou para
 * cifrar a mensagem — sem elas o envio (`web-push`) não consegue montar
 * a requisição. Nenhuma tem valor fora do par (endpoint, chaves): revogar
 * o acesso é só apagar a linha, nunca precisa "desativar" nada do lado do
 * navegador.
 */
export const pushSubscriptions = pgTable("push_subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Marca que o lembrete de UM offset de UMA tarefa já foi enviado por push
 * — existir aqui é o que impede reenviar o mesmo lembrete a cada vez que
 * o cron roda (ver `/api/cron/send-push-reminders`). Sem dono próprio de
 * propósito: a chave primária composta (taskId, offsetMinutes) já garante
 * no máximo um envio por combinação, então uma segunda tentativa de
 * inserir é só descartada (`onConflictDoNothing`), nunca lida de volta.
 */
export const taskReminderSent = pgTable(
  "task_reminder_sent",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    offsetMinutes: integer("offset_minutes").notNull(),
    sentAt: timestamp("sent_at", { mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.offsetMinutes] })]
);

/** Cada linha é o início de um ciclo relatado pelo usuário. Duração média e
 * previsão do próximo ciclo são sempre calculadas a partir daqui (nunca
 * guardadas) e sempre apresentadas como estimativa, nunca certeza. */
export const menstrualCycleEntries = pgTable("menstrual_cycle_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(), // "YYYY-MM-DD"
  periodLengthDays: integer("period_length_days"),
  symptoms: text("symptoms"), // JSON: string[]
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Sessão de execução ("Começar comigo") — representa um momento ativo em
 * que o usuário está trabajando numa tarefa com acompanhamento do mascote.
 * Uma sessão pode estar ativa, pausada ou concluída. Possui passos
 * gerados por IA (ou determinísticos) e progresso rastreado.
 */
export const executionSessions = pgTable("execution_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["active", "paused", "completed", "abandoned"],
  })
    .notNull()
    .default("active"),
  currentStepIndex: integer("current_step_index").notNull().default(0),
  startedAt: timestamp("started_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Marca o início do trecho de execução ATUAL — igual a `startedAt` na
  // criação, mas é atualizado de novo a cada `resume()`. Existe pra não
  // reaproveitar `updatedAt` (que também muda em `updateStepIndex`, sem
  // relação com pausar/retomar) como base do tempo "Fazendo agora · X min"
  // exibido no TaskCard.
  resumedAt: timestamp("resumed_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  pausedAt: timestamp("paused_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Último check-in push enviado pra esta sessão (evita spam do cron).
  lastCheckinSentAt: timestamp("last_checkin_sent_at", { mode: "date" }),
});

export const executionSessionsRelations = relations(executionSessions, ({ one }) => ({
  user: one(users, {
    fields: [executionSessions.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [executionSessions.taskId],
    references: [tasks.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  googleConnection: one(googleConnections, {
    fields: [users.id],
    references: [googleConnections.userId],
  }),
  tasks: many(tasks),
  events: many(events),
  goals: many(goals),
  habits: many(habits),
  mascotState: one(mascotStates, {
    fields: [users.id],
    references: [mascotStates.userId],
  }),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  executionSessions: many(executionSessions),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  steps: many(goalSteps),
  tasks: many(tasks),
  habits: many(habits),
}));

export const goalStepsRelations = relations(goalSteps, ({ one }) => ({
  goal: one(goals, {
    fields: [goalSteps.goalId],
    references: [goals.id],
  }),
  user: one(users, {
    fields: [goalSteps.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [tasks.goalId],
    references: [goals.id],
  }),
  steps: many(taskSteps),
  executionSessions: many(executionSessions),
}));

export const taskStepsRelations = relations(taskSteps, ({ one }) => ({
  task: one(tasks, {
    fields: [taskSteps.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskSteps.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [habits.goalId],
    references: [goals.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));
