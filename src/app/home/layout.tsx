import { auth } from "@/lib/auth";

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
import styles from "./home-layout.module.css";

// As tarefas e eventos são dados dinâmicos e específicos de cada usuário —
// não fazem sentido pré-renderizados estaticamente no build. Isso também
// evita que uma falha de API no momento do build derrube o `next build`
// inteiro (o build só falharia se a API estivesse fora do ar em tempo de
// requisição real, e aí o `error.tsx` entra em ação).
export const dynamic = "force-dynamic";

const HomeLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, gender, mascot, showGuidedTour, activeFocusSession] = await Promise.all([
    auth(),
    getGender(),
    getMascotFetcher().getMascot(),
    shouldShowGuidedTour(),
    getFocusFetcher().getActive(),
  ]);
  const mascotCharacterId = characterIdForSpecies(mascot.species);

  return (
    // Provider de sessão de foco envolve a página inteira (não só a
    // barra lateral) de propósito: o painel completo (`Timer`, em
    // `/home/focus`, dentro de `children`) e o widget compacto
    // (`FocusMiniWidget`, logo abaixo) precisam consumir o MESMO estado
    // - ver comentário completo em `focus-session-context.tsx`.
    <FocusSessionProvider initialSession={activeFocusSession} userId={session?.user?.id ?? ""}>
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

        <Assistant />
        <TaskReminders />
        <CommandPalette />
        <MascotPet characterId={mascotCharacterId} />
        <GuidedTour active={showGuidedTour} mascotName={mascot.name} userId={session?.user?.id ?? ""} />
        <FocusMiniWidget />
      </div>
    </FocusSessionProvider>
  );
};

export default HomeLayout;
