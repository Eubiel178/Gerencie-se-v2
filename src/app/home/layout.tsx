import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email-verification";

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
  const session = await auth();

  // Gate: conta local (e-mail/senha) recém-criada, ainda sem confirmar o
  // código de 6 dígitos (ver `registerAction`/`verifyEmailAction`) nunca
  // passa daqui. Contas Google já chegam verificadas (`profile()` em
  // `auth.config.ts`), e toda conta que já existia antes desta feature
  // foi "adotada" como verificada numa migração de dados (ver
  // `drizzle/0028_...`) — só cadastros locais NOVOS ficam presos aqui.
  // Checado antes de disparar as outras buscas abaixo (mascote, tour,
  // foco): quem vai ser redirecionado nem precisa delas.
  if (session?.user?.id && !(await isEmailVerified(session.user.id))) {
    redirect("/verify-email");
  }

  const [gender, mascot, showGuidedTour, activeFocusSession] = await Promise.all([
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

        <Assistant mascot={mascot} />
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
