import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email/verification";

import { Header } from "@/components";
import { Assistant } from "@/features/assistant";
import { TaskReminders } from "@/features/tasks/components/reminder-scheduler";
import { CommandPalette } from "@/features/search/components/command-palette";
import { MascotPet, characterIdForSpecies } from "@/features/mascot-pet";
import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { FocusSessionProvider, FocusMiniWidget } from "@/features/focus";
import { getGender } from "@/features/profile/get-gender";
import { GuidedTour } from "@/features/guided-tour/components/guided-tour/lazy";
import { shouldShowGuidedTour } from "@/features/guided-tour/get-guided-tour-status";
import {
  ExecutionCompanionProvider,
} from "@/features/execution-companion";
import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";
import styles from "./home-layout.module.css";

export const dynamic = "force-dynamic";

const HomeLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (session?.user?.id && !(await isEmailVerified(session.user.id))) {
    redirect("/verify-email");
  }

  const [gender, mascot, showGuidedTour, activeFocusSession, activeExecutionSession] = await Promise.all([
    getGender(),
    getMascotFetcher().getMascot(),
    shouldShowGuidedTour(),
    getFocusFetcher().getActive(),
    getExecutionSessionFetcher().getActiveOrPaused(),
  ]);
  const mascotCharacterId = characterIdForSpecies(mascot.species);

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

          <Assistant mascot={mascot} />
          <TaskReminders />
          <CommandPalette />
          <MascotPet characterId={mascotCharacterId} />
          <GuidedTour active={showGuidedTour} mascotName={mascot.name} userId={session?.user?.id ?? ""} />
          <FocusMiniWidget />
        </div>
      </ExecutionCompanionProvider>
    </FocusSessionProvider>
  );
};

export default HomeLayout;
