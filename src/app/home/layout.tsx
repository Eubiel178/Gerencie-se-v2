import { redirect } from "next/navigation";


import { Header } from "@/components";
import { Assistant } from "@/features/assistant";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import {
  ExecutionCompanionProvider,
} from "@/features/execution-companion";
import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";
import { FocusMiniWidget } from "@/features/focus/components/focus-mini-widget";
import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { FocusSessionProvider } from "@/features/focus/focus-session-context";
import { GuidedTour } from "@/features/guided-tour/components/guided-tour/lazy";
import { shouldShowGuidedTour } from "@/features/guided-tour/get-guided-tour-status";
import { MascotPet, characterIdForSpecies, mascotAvatarUrl } from "@/features/mascot-pet";
import { getGender } from "@/features/profile/get-gender";
import { CommandPalette } from "@/features/search/components/command-palette";
import { TaskReminders } from "@/features/tasks/components/reminder-scheduler";
import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email";

import styles from "./home-layout.module.css";

export const dynamic = "force-dynamic";

const HomeLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (session?.user?.id && !(await isEmailVerified(session.user.id))) {
    redirect("/verify-email");
  }

  const [gender, mascot, showGuidedTour, activeFocusSession, activeExecutionSession, assistantPreferences] =
    await Promise.all([
      getGender(),
      getMascotFetcher().getMascot(),
      shouldShowGuidedTour(),
      getFocusFetcher().getActive(),
      getExecutionSessionFetcher().getActiveOrPaused(),
      getAssistantPreferencesFetcher().getPreferences(),
    ]);
  const mascotCharacterId = characterIdForSpecies(mascot.species);
  // Mesmo padrão já usado em `features/dashboard/index.tsx` - nunca
  // inferido de outra forma, e `null` (conta Google sem esse campo, por
  // exemplo) é um caso normal, tratado no fraseado do Companion.
  const userFirstName = session?.user?.name?.split(" ")[0] ?? null;

  const intentionData = activeExecutionSession
    ? { taskId: activeExecutionSession.taskId }
    : null;

  return (
    <FocusSessionProvider initialSession={activeFocusSession} userId={session?.user?.id ?? ""}>
      <ExecutionCompanionProvider
        initialSession={activeExecutionSession}
        initialIntention={intentionData}
      >
        <div className={styles.shell}>
          <Header
            user={{
              name: session?.user?.name ?? null,
              email: session?.user?.email ?? null,
              image: session?.user?.image ?? null,
              gender,
            }}
          />

          <main className={styles.main}>{children}</main>

          <Assistant mascot={mascot} userImage={session?.user?.image ?? null} />
          <TaskReminders />
          <CommandPalette />
          <MascotPet
            characterId={mascotCharacterId}
            mascot={mascot}
            assistantEnabled={assistantPreferences.enabled}
            autoSpeechEnabled={assistantPreferences.autoSpeechEnabled}
            autoSpeechPromptShown={assistantPreferences.autoSpeechPromptShown}
            hasSeenExecutionIntro={assistantPreferences.executionIntroShown}
            userFirstName={userFirstName}
            userGender={gender}
          />
          <GuidedTour
            active={showGuidedTour}
            mascotName={mascot.name}
            mascotPersonality={mascot.personality}
            mascotAvatar={mascotAvatarUrl(mascot.species)}
            userId={session?.user?.id ?? ""}
          />
          <FocusMiniWidget />
        </div>
      </ExecutionCompanionProvider>
    </FocusSessionProvider>
  );
};

export default HomeLayout;
