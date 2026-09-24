import type { MascotPersonality } from "@/features/focus/domain";

// Abaixo disso a navegação vira um menu por trás de um clique (a sidebar
// de desktop com os `data-tour="nav"`/`data-tour="search"`/etc. não existe
// no DOM — ver `Header`). O tour NÃO desliga nesse viewport: o motor
// (`components/guided-tour/index.tsx`) abre o painel de navegação mobile
// sozinho pro passo apontar pros alvos que só existem dentro dele
// (`MOBILE_NAV_PANEL_TARGETS`), e `ReplayTourButton` mostra o "Rever
// tutorial" também no mobile. Exportado porque o motor do tour usa o MESMO
// valor pra detectar o viewport (tanto na montagem dos passos quanto na
// hora de decidir se abre/fecha o painel ao apontar pra um passo).
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
// curto e em primeira pessoa, nunca um manual de funcionalidades - mas
// cobre os 3 pontos pedidos: fica durante a execução, reage ao que
// acontece, aparece se a pessoa travar/se distrair. `spoken` é sempre
// IDÊNTICO ao `written` (balão e voz nunca divergem - mesma decisão de
// `companion-phrasing.ts`): o tour usa o mesmo texto pra falar e pra
// mostrar, sem segunda redação pra "soar natural" (pronúncia é cuidada
// pela camada `toSpeechText` em `lib/speech/speak-text.ts`).
export const MASCOT_STEP_INTRO: Record<
  MascotPersonality,
  { written: string; spoken: string }
> = {
  afetuoso: {
    written:
      "Oi! Eu vou te fazer companhia por aqui. Quando você começar uma tarefa, posso ficar com você, acompanhar a execução e ajudar se você travar ou se distrair. E se quiser, dá pra mudar meu nome, aparência e personalidade depois.",
    spoken:
      "Oi! Eu vou te fazer companhia por aqui. Quando você começar uma tarefa, posso ficar com você, acompanhar a execução e ajudar se você travar ou se distrair. E se quiser, dá pra mudar meu nome, aparência e personalidade depois.",
  },

  sarcastico: {
    written:
      "Então, aparentemente somos uma dupla agora. Quando você começar uma tarefa, eu fico por perto, acompanho o progresso da execução e apareço se você travar ou acabar se perdendo pelo caminho. Se não gostar da minha cara ou do meu jeito, dá pra mudar depois.",
    spoken:
      "Então, aparentemente somos uma dupla agora. Quando você começar uma tarefa, eu fico por perto, acompanho o progresso da execução e apareço se você travar ou acabar se perdendo pelo caminho. Se não gostar da minha cara ou do meu jeito, dá pra mudar depois.",
  },

  engracado: {
    written:
      "Opa! Parece que agora somos uma dupla. Quando você começar uma tarefa, eu acompanho a execução, comemoro o que der certo e apareço se você travar ou se distrair no caminho. Minha aparência e meu jeito também podem mudar depois.",
    spoken:
      "Opa! Parece que agora somos uma dupla. Quando você começar uma tarefa, eu acompanho a execução, comemoro o que der certo e apareço se você travar ou se distrair no caminho. Minha aparência e meu jeito também podem mudar depois.",
  },

  motivador: {
    written:
      "Eu vou acompanhar você por aqui. Quando começar uma tarefa, fico junto durante a execução, acompanho seu progresso e posso ajudar quando bater aquela trava ou distração. Vamos fazendo uma coisa de cada vez.",
    spoken:
      "Eu vou acompanhar você por aqui. Quando começar uma tarefa, fico junto durante a execução, acompanho seu progresso e posso ajudar quando bater aquela trava ou distração. Vamos fazendo uma coisa de cada vez.",
  },

  zen: {
    written:
      "Eu vou te acompanhar por aqui, sem pressão. Quando você começar uma tarefa, fico com você durante a execução e posso ajudar se você travar, se distrair ou só precisar encontrar o próximo passo.",
    spoken:
      "Eu vou te acompanhar por aqui, sem pressão. Quando você começar uma tarefa, fico com você durante a execução e posso ajudar se você travar, se distrair ou só precisar encontrar o próximo passo.",
  },
};

export function buildGuidedTourSteps(
  mascotName: string,
  mascotPersonality: MascotPersonality,
): GuidedTourStep[] {
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
      body: MASCOT_STEP_INTRO[mascotPersonality].written,
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
