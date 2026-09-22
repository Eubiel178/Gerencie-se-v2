import type { MascotPersonality } from "@/features/focus/domain";

// Abaixo disso a navegação vira um menu por trás de um clique (a
// sidebar com os `data-tour="nav"`/`data-tour="search"`/etc. não existe
// no DOM - ver `Header`), então o tour não tem pra onde apontar e nunca
// aparece (ver `computeInitialSteps` em `components/guided-tour/index.tsx`).
// Exportado (não só um literal local) porque `ReplayTourButton`
// precisa do MESMO valor pra decidir se mostra "Ver tutorial
// novamente" - sem isso, o botão ficava visível no mobile prometendo
// algo que o motor do tour se recusa a fazer (achado relatado: "o
// botão de ver tutorial no mobile ainda existe" - clicar nele marcava
// no banco e navegava, mas nada aparecia na tela).
export const GUIDED_TOUR_MOBILE_BREAKPOINT_PX = 720;

export interface GuidedTourStep {
  id: string;
  /** Rota que este passo precisa - `undefined` = mesma rota do passo
   * anterior (nenhuma navegação). Quando definida e diferente da rota
   * atual, o tour navega pra lá sozinho antes de apontar pro alvo (ver
   * `GuidedTour`) - é o que faz o tour atravessar páginas de verdade
   * (Dashboard -> Tarefas -> Foco), não só ficar preso numa tela só. */
  path?: string;
  /** Seletor do elemento real na tela (ver os `data-tour="..."`
   * espalhados pelo Header/Dashboard/Tarefas/Foco) - `null` = passo
   * "solto", sem apontar pra nada (boas-vindas/fim). Se o elemento não
   * aparecer a tempo (ex.: navegação falhou, ou usuário caiu direto
   * numa rota inesperada), o passo é pulado automaticamente - ver
   * `GuidedTour`. */
  target: string | null;
  title: string;
  body: string;
  /** Só `true` no passo do mascote - o ÚNICO momento em que o tour se
   * apresenta como o próprio Companion falando (avatar + balão), em vez
   * do tooltip de tutorial padrão (contador de passo, título genérico) -
   * ver `GuidedTour`. */
  speaksAsCompanion?: boolean;
}

// Só a introdução do mascote varia por personalidade (pedido explícito:
// não duplicar o tour inteiro por personalidade, só deixar a arquitetura
// já existente influenciar naturalmente ONDE ela já se aplicaria de
// qualquer forma - o Companion se apresentando é exatamente isso). Texto
// curto e em primeira pessoa, nunca um manual de funcionalidades.
const MASCOT_STEP_INTRO: Record<MascotPersonality, string> = {
  afetuoso: "Oi, eu sou seu companheiro por aqui! Ando pela tela, comemoro junto quando você termina algo, e fico do seu lado quando você começa a executar uma tarefa de verdade. Pode trocar meu nome, espécie e jeito de ser quando quiser, em Configurações.",
  sarcastico: "Sou eu, seu companheiro. Ando por aqui, solto um comentário quando você termina algo e fico de olho quando você começa uma tarefa pra valer. Se meu jeito não for a sua praia, dá pra trocar - nome, espécie, personalidade - em Configurações.",
  engracado: "Opa! Eu sou seu companheiro por aqui - ando pela tela, comemoro com você quando termina algo e fico por perto quando você parte pra uma tarefa de verdade. Nome, espécie e personalidade dá pra trocar em Configurações, se bater vontade de bagunçar tudo.",
  motivador: "Eu sou seu companheiro nessa jornada! Ando pela tela, celebro cada conquista sua e fico com você quando começa a executar uma tarefa de verdade. Pode ajustar meu nome, espécie e personalidade em Configurações quando quiser.",
  zen: "Eu sou seu companheiro por aqui. Ando devagar pela tela, reconheço suas conquistas no seu tempo e fico por perto quando você começa a executar uma tarefa. Nome, espécie e personalidade dá pra ajustar em Configurações.",
};

export function buildGuidedTourSteps(mascotName: string, mascotPersonality: MascotPersonality): GuidedTourStep[] {
  return [
    {
      id: "welcome",
      path: "/home",
      target: null,
      title: "Bem-vindo ao Gerencie-se!",
      body: "Um tour rápido antes de você começar. Leva menos de um minuto, e dá pra pular a qualquer momento.",
    },
    {
      id: "nav",
      target: '[data-tour="nav"]',
      title: "Navegação e busca rápida",
      body: "Tarefas, hábitos, objetivos, foco e o resto ficam organizados por área aqui. E de qualquer tela, Ctrl+K abre a busca e a captura rápida de tarefas, sem precisar abrir formulário nenhum.",
    },
    {
      id: "checklist",
      target: '[data-tour="checklist"]',
      title: "Primeiros passos",
      body: "Esse checklist te guia pelas primeiras ações - criar uma tarefa, um hábito, personalizar o mascote. Vá no seu ritmo.",
    },
    {
      id: "mascot",
      target: '[data-tour="mascot"]',
      title: mascotName,
      body: MASCOT_STEP_INTRO[mascotPersonality],
      speaksAsCompanion: true,
    },
    {
      id: "new-task",
      path: "/home/tasks",
      target: '[data-tour="new-task"]',
      title: "Criar uma tarefa",
      body: "Comece por aqui para adicionar uma tarefa. Você poderá definir prioridade, prazo e lembrete no formulário, apenas quando precisar.",
    },
    {
      id: "done",
      target: null,
      title: "Pronto!",
      body: "Você já conhece o essencial. O resto é ir explorando no seu tempo - bom trabalho.",
    },
  ];
}
