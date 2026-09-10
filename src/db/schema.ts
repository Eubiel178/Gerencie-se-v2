import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

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

export const tasks = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  time: text("time").notNull(), // "HH:MM"
  title: text("title").notNull(),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const goals = pgTable("goal", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  deadline: text("deadline"), // "YYYY-MM-DD", opcional
  priority: text("priority", { enum: ["baixa", "media", "alta", "critica"] })
    .notNull()
    .default("media"),
  archived: boolean("archived").notNull().default(false),
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
    id: text("id")
      .primaryKey()
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
    // marcar/desmarcar duas vezes seguidas).
    primaryKey({ columns: [table.habitId, table.date] }),
  ]
);

export const focusSessions = pgTable("focus_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  endedAt: timestamp("ended_at", { mode: "date" }),
  plannedDurationSeconds: integer("planned_duration_seconds").notNull(),
  actualDurationSeconds: integer("actual_duration_seconds"),
  status: text("status", { enum: ["running", "completed", "cancelled"] })
    .notNull()
    .default("running"),
  xpEarned: integer("xp_earned").notNull().default(0),
});

/** Uma linha por usuário — nível/mascote não têm histórico, só estado
 * atual. Humor do mascote é calculado a partir da atividade recente, não
 * guardado aqui (ver `src/features/mascot`). */
export const mascotStates = pgTable("mascot_state", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Fofuxo"),
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
  hydrationDailyGoalMl: integer("hydration_daily_goal_ml").notNull().default(2000),
  assistantEnabled: boolean("assistant_enabled").notNull().default(true),
  assistantReducedPresence: boolean("assistant_reduced_presence").notNull().default(false),
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
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  steps: many(goalSteps),
  tasks: many(tasks),
  habits: many(habits),
}));

export const habitsRelations = relations(habits, ({ many }) => ({
  logs: many(habitLogs),
}));
