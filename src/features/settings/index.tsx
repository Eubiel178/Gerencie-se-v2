import { ThemeToggle } from "@/design-system/theme/theme-toggle";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { PeoplePanel } from "@/features/connections/components/people-panel";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { ExportDataPanel } from "@/features/export/components/export-data-panel";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { ReplayTourButton } from "@/features/guided-tour/components/replay-tour-button";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { getGender } from "@/features/profile/get-gender";
import { getProfileOverview } from "@/features/profile/get-profile-overview";
import { EmailReminderToggle } from "@/features/tasks/components/reminder-scheduler/email-reminder-toggle";
import { NotificationsToggle } from "@/features/tasks/components/reminder-scheduler/notifications-toggle";
import { PushToggle } from "@/features/tasks/components/reminder-scheduler/push-toggle";
import { getEmailTaskRemindersEnabled } from "@/features/tasks/get-email-reminder-preference";
import { WeeklySummaryPanel } from "@/features/weekly-summary/components/weekly-summary-panel";
import { getWeeklySummaryEnabled } from "@/features/weekly-summary/get-preference";
import { auth, isGoogleAccountLinked, requireUserId } from "@/lib/auth";
import { getGoogleConnection, listUserCalendars } from "@/lib/integrations/google-calendar";
import styles from "@/styles/workspace.module.css";

import { AccountPanel } from "./components/account-panel";
import { CalendarStatusBannerFromUrl } from "./components/calendar-status-banner-from-url";
import { CompanionPreferencesPanel } from "./components/companion-preferences-panel";
import { ConnectionCard } from "./components/connection-card";
import { SettingsSections, type SettingsSection } from "./components/settings-sections";

export async function Settings() {
  const userId = await requireUserId();

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
        <section className={`${styles.settingPanel} ${styles.settingPanelNarrow}`}>
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
      description: "Como seu companheiro aparece, fala e ajuda",
      icon: "FaPaw",
      content: (
        <section className={styles.settingPanel}>
          <CompanionPreferencesPanel mascot={mascot} preferences={assistantPreferences} />
        </section>
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
              compartilhar tarefas, rotina, hábitos ou objetivos
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

  return (
    <section className={styles.page}>
      <div><h1 className={styles.title}>Configurações</h1><p className={styles.subtitle}>Ajuste sua experiência e as integrações que usa no dia a dia.</p></div>
      <CalendarStatusBannerFromUrl />
      <SettingsSections sections={sections} />
    </section>
  );
}
