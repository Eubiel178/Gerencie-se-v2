import { requireUserId } from "@/lib/require-user-id";
import { isGoogleAccountLinked } from "@/lib/auth";
import { getGoogleConnection, listUserCalendars } from "@/lib/google-calendar";

import { ThemeToggle } from "@/design-system/theme/theme-toggle";

import { PreferencesPanel } from "@/features/assistant/components/preferences-panel";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { NotificationsToggle } from "@/features/tasks/components/reminder-scheduler/notifications-toggle";
import { PeoplePanel } from "@/features/connections/components/people-panel";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { MascotSettings } from "@/features/focus/components/mascot-settings";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

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
  const [isGoogleLogin, connection, assistantPreferences, connections, mascot] = await Promise.all([
    isGoogleAccountLinked(userId),
    getGoogleConnection(userId),
    getAssistantPreferencesFetcher().getPreferences(),
    getConnectionFetcher().loadAll(),
    getMascotFetcher().getMascot(),
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
        <div className={styles.panelHeader}>
          <h2>Aparência</h2>
          <p className={styles.panelText}>
            Escolha entre o tema do sistema, claro ou escuro.
          </p>
        </div>

        <ThemeToggle />
      </section>

      <section id="assistente" className={styles.settingPanel}>
        <div className={styles.panelHeader}>
          <h2>Assistente</h2>
          <p className={styles.panelText}>
            O JARVIS aparece discretamente na tela com sugestões baseadas
            no que você tem pendente.
          </p>
        </div>

        <PreferencesPanel preferences={assistantPreferences} />
      </section>

      <section className={styles.settingPanel}>
        <div className={styles.panelHeader}>
          <h2>Lembretes</h2>
        </div>

        <NotificationsToggle />
      </section>

      <section className={styles.settingPanel}>
        <div className={styles.panelHeader}>
          <h2>Pessoas</h2>
          <p className={styles.panelText}>
            Conecte alguém (ex.: parceiro(a), família) para poder
            compartilhar tarefas, rotina, hábitos ou metas específicos.
            Hidratação, Corrida, Saúde e Ciclo Menstrual continuam sempre
            privados, sem opção de compartilhar.
          </p>
        </div>

        <PeoplePanel connections={connections} />
      </section>

      <section className={styles.settingPanel}>
        <div className={styles.panelHeader}>
          <h2>Mascote</h2>
          <p className={styles.panelText}>
            Escolha o nome e a personalidade do mascote que te acompanha
            no Foco.
          </p>
        </div>

        <MascotSettings mascot={mascot} />
      </section>

      <section id="conta" className={styles.settingPanel}>
        <h2>Conta</h2>

        <p className={styles.panelText}>
          {isGoogleLogin
            ? "Você está conectado com Google"
            : "Você acessa com e-mail e senha."}
        </p>
      </section>

      <section className={styles.settingPanel}>
        <div className={styles.panelHeaderTight}>
          <h2>Integrações</h2>
          <h3>Google Agenda</h3>

          <p className={styles.panelText}>
            {connection
              ? "Suas tarefas marcadas para sincronizar aparecem no calendário selecionado abaixo."
              : "Conecte sua agenda para sincronizar suas tarefas. Isso é opcional e independente do seu login — mesmo quem entra com Google não tem a agenda conectada automaticamente."}
          </p>
        </div>

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
