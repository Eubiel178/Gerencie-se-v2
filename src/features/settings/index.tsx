import { auth } from "@/lib/auth";
import { requireUserId } from "@/lib/require-user-id";
import { isGoogleAccountLinked } from "@/lib/auth";
import { getGoogleConnection, listUserCalendars } from "@/lib/google-calendar";

import { ThemeToggle } from "@/design-system/theme/theme-toggle";

import { PreferencesPanel } from "@/features/assistant/components/preferences-panel";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { NotificationsToggle } from "@/features/tasks/components/reminder-scheduler/notifications-toggle";
import { PushToggle } from "@/features/tasks/components/reminder-scheduler/push-toggle";
import { EmailReminderToggle } from "@/features/tasks/components/reminder-scheduler/email-reminder-toggle";
import { getEmailTaskRemindersEnabled } from "@/features/tasks/get-email-reminder-preference";
import { PeoplePanel } from "@/features/connections/components/people-panel";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { MascotSettings } from "@/features/focus/components/mascot-settings";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { WeeklySummaryPanel } from "@/features/weekly-summary/components/weekly-summary-panel";
import { getWeeklySummaryEnabled } from "@/features/weekly-summary/get-preference";
import { ExportDataPanel } from "@/features/export/components/export-data-panel";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { getProfileOverview } from "@/features/profile/get-profile-overview";
import { getGender } from "@/features/profile/get-gender";
import { ReplayTourButton } from "@/features/guided-tour/components/replay-tour-button";

import { CalendarStatusBanner } from "./components/calendar-status-banner";
import { ConnectionCard } from "./components/connection-card";
import { AccountPanel } from "./components/account-panel";
import { SettingsSections, type SettingsSection } from "./components/settings-sections";
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
  const [
    isGoogleLogin,
    connection,
    assistantPreferences,
    connections,
    mascot,
    weeklySummaryEnabled,
    session,
    profileOverview,
    gender,
    emailTaskRemindersEnabled,
  ] = await Promise.all([
    isGoogleAccountLinked(userId),
    getGoogleConnection(userId),
    getAssistantPreferencesFetcher().getPreferences(),
    getConnectionFetcher().loadAll(),
    getMascotFetcher().getMascot(),
    getWeeklySummaryEnabled(),
    auth(),
    getProfileOverview(),
    getGender(),
    getEmailTaskRemindersEnabled(),
  ]);
  const calendars = connection ? await listUserCalendars(userId) : [];

  const connected = typeof searchParams.google_calendar_connected === "string"
    ? searchParams.google_calendar_connected
    : undefined;
  const error = typeof searchParams.google_calendar_error === "string"
    ? searchParams.google_calendar_error
    : undefined;

  // Cada categoria é montada aqui (Server Component, com os dados já
  // buscados de uma vez só acima) e passada pronta pra `SettingsSections`
  // (Client Component) decidir qual mostrar — a navegação entre
  // categorias não busca dado de novo, só troca o que já existe de vista.
  const sections: SettingsSection[] = [
    {
      id: "conta",
      label: "Conta",
      description: isGoogleLogin ? "Login com Google" : "Login com e-mail e senha",
      icon: "FaUserCircle",
      content: (
        <section className={styles.settingPanel}>
          <h3>Conta</h3>

          <AccountPanel
            user={{
              name: session?.user?.name ?? null,
              email: session?.user?.email ?? null,
              image: session?.user?.image ?? null,
            }}
            gender={gender}
            overview={profileOverview}
          />

          <p className={styles.panelText}>
            {isGoogleLogin
              ? "Você está conectado com Google"
              : "Você acessa com e-mail e senha."}
          </p>

          {!isGoogleLogin && <ChangePasswordForm />}

          <div className={styles.settingAction}>
            <div className={styles.panelHeaderTight}>
              <h3>Tutorial</h3>
              <p className={styles.panelText}>Quer relembrar como usar o Gerencie-se?</p>
            </div>

            <ReplayTourButton />
          </div>
        </section>
      ),
    },
    {
      id: "aparencia",
      label: "Aparência",
      description: "Tema claro, escuro ou do sistema",
      icon: "FaPalette",
      content: (
        <section className={styles.settingPanel}>
          <div className={styles.panelHeader}>
            <h3>Aparência</h3>
            <p className={styles.panelText}>
              Escolha entre o tema do sistema, claro ou escuro.
            </p>
          </div>

          <ThemeToggle />
        </section>
      ),
    },
    {
      id: "mascote",
      label: "Mascote e assistente",
      description: "Espécie, nome, personalidade e sugestões",
      icon: "FaPaw",
      content: (
        <div className={styles.settingGrid}>
          <section className={styles.settingPanel}>
            <div className={styles.panelHeader}>
              <h3>Mascote</h3>
              <p className={styles.panelText}>
                Escolha o nome, a espécie e a personalidade do mascote
                que te acompanha no Foco e também como assistente pelo
                resto do app.
              </p>
            </div>

            <MascotSettings mascot={mascot} />
          </section>

          <section className={styles.settingPanel}>
            <div className={styles.panelHeader}>
              <h3>Assistente</h3>
              <p className={styles.panelText}>
                {mascot.name} aparece discretamente na tela com
                sugestões baseadas no que você tem pendente — é o mesmo
                mascote escolhido ao lado.
              </p>
            </div>

            <PreferencesPanel preferences={assistantPreferences} mascotName={mascot.name} />
          </section>
        </div>
      ),
    },
    {
      id: "notificacoes",
      label: "Notificações",
      description: "Lembretes e resumo semanal por e-mail",
      icon: "FaBell",
      content: (
        <div className={styles.settingGrid}>
          <section className={styles.settingPanel} data-tour="notifications-settings">
            <h3>Lembretes</h3>

            <div className={styles.stack}>
              <NotificationsToggle />

              <PushToggle />

              <div>
                <p className={styles.panelText}>Onde mais você quer receber?</p>
                <EmailReminderToggle enabled={emailTaskRemindersEnabled} />
              </div>
            </div>
          </section>

          <section className={styles.settingPanel}>
            <h3>Resumo semanal</h3>

            <WeeklySummaryPanel enabled={weeklySummaryEnabled} email={session?.user?.email ?? null} />
          </section>
        </div>
      ),
    },
    {
      id: "compartilhamento",
      label: "Compartilhamento",
      description: "Pessoas conectadas para compartilhar dados",
      icon: "FaUserFriends",
      content: (
        <section className={styles.settingPanel}>
          <div className={styles.panelHeader}>
            <h3>Pessoas</h3>
            <p className={styles.panelText}>
              Conecte alguém (ex.: parceiro(a), família) para poder
              compartilhar tarefas, rotina, hábitos ou metas
              específicos. Hidratação, Corrida, Saúde e Ciclo
              Menstrual continuam sempre privados, sem opção de
              compartilhar.
            </p>
          </div>

          <PeoplePanel connections={connections} />
        </section>
      ),
    },
    {
      id: "integracoes",
      label: "Integrações",
      description: "Google Agenda",
      icon: "FaPlug",
      content: (
        <section className={styles.settingPanel}>
          <div className={styles.panelHeaderTight}>
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
      ),
    },
    {
      id: "dados",
      label: "Dados",
      description: "Exportar seus dados",
      icon: "FaDatabase",
      content: (
        <section className={styles.settingPanel}>
          <h3>Exportar dados</h3>

          <ExportDataPanel />
        </section>
      ),
    },
  ];

  // Quando o usuário volta do fluxo de conexão do Google Agenda, o
  // redirect chega com `google_calendar_connected`/`google_calendar_error`
  // na URL mas sem `?section=` — sem isso ele cairia na lista de
  // categorias em vez de ver direto o resultado da conexão que acabou de
  // tentar.
  const defaultSectionId = connected !== undefined || error !== undefined ? "integracoes" : undefined;

  return (
    <section className={styles.page}>
      <div><h1 className={styles.title}>Configurações</h1><p className={styles.subtitle}>Ajuste sua experiência e as integrações que usa no dia a dia.</p></div>

      <CalendarStatusBanner connected={connected} error={error} />

      <SettingsSections sections={sections} defaultSectionId={defaultSectionId} />
    </section>
  );
}
