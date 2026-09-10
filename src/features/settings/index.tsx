import { requireUserId } from "@/lib/require-user-id";
import { isGoogleAccountLinked } from "@/lib/auth";
import { getGoogleConnection, listUserCalendars } from "@/lib/google-calendar";

import { Paragraph, Wrapper } from "@/components";
import { ThemeToggle } from "@/design-system/theme/theme-toggle";

import { PreferencesPanel } from "@/features/assistant/components/preferences-panel";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";

import { CalendarStatusBanner } from "./components/calendar-status-banner";
import { ConnectionCard } from "./components/connection-card";
import styles from "@/styles/workspace.module.css";

interface SettingsProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function Settings({ searchParams }: SettingsProps) {
  const userId = await requireUserId();

  // Duas fontes de dado completamente separadas, de propósito: "Conta" é
  // sobre COMO o usuário faz login (Google ou e-mail/senha — tabela
  // `account` do Auth.js); "Integrações" é sobre o Google Agenda estar
  // conectado ou não (tabela própria `google_connection`). Uma nunca
  // implica a outra — por isso ficam em blocos visualmente distintos.
  const [isGoogleLogin, connection, assistantPreferences] = await Promise.all([
    isGoogleAccountLinked(userId),
    getGoogleConnection(userId),
    getAssistantPreferencesFetcher().getPreferences(),
  ]);
  const calendars = connection ? await listUserCalendars(userId) : [];

  const connected = typeof searchParams.google_calendar_connected === "string"
    ? searchParams.google_calendar_connected
    : undefined;
  const error = typeof searchParams.google_calendar_error === "string"
    ? searchParams.google_calendar_error
    : undefined;

  return (
    <section className={styles.page}>
      <div><h1 className={styles.title}>Configurações</h1><p className={styles.subtitle}>Ajuste sua experiência e as integrações que usa no dia a dia.</p></div>

      <CalendarStatusBanner connected={connected} error={error} />

      <div className={styles.settingGrid}>
      <section className={styles.settingPanel}>
        <Wrapper direction="column" gap="small">
          <h2>Aparência</h2>
          <Paragraph size="small" color="secondary">
            Escolha entre o tema do sistema, claro ou escuro.
          </Paragraph>
        </Wrapper>

        <ThemeToggle />
      </section>

      <section className={styles.settingPanel}>
        <Wrapper direction="column" gap="small">
          <h2>Assistente</h2>
          <Paragraph size="small" color="secondary">
            O JARVIS aparece discretamente na tela com sugestões baseadas
            no que você tem pendente.
          </Paragraph>
        </Wrapper>

        <PreferencesPanel preferences={assistantPreferences} />
      </section>

      <section className={styles.settingPanel}>
        <h2>Conta</h2>

        <Paragraph size="small" color="secondary">
          {isGoogleLogin
            ? "Você está conectado com Google"
            : "Você acessa com e-mail e senha."}
        </Paragraph>
      </section>

      <section className={styles.settingPanel}>
        <Wrapper direction="column">
          <h2>Integrações</h2>
          <h3>Google Agenda</h3>

          <Paragraph size="small" color="secondary">
            {connection
              ? "Suas tarefas marcadas para sincronizar aparecem no calendário selecionado abaixo."
              : "Conecte sua agenda para sincronizar suas tarefas. Isso é opcional e independente do seu login — mesmo quem entra com Google não tem a agenda conectada automaticamente."}
          </Paragraph>
        </Wrapper>

        <ConnectionCard
          isConnected={!!connection}
          googleAccountEmail={connection?.googleAccountEmail}
          selectedCalendarId={connection?.calendarId}
          calendars={calendars}
        />
      </section>
      </div>
    </section>
  );
}
