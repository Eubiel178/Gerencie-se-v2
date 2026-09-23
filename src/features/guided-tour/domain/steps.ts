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
// curto e em primeira pessoa, nunca um manual de funcionalidades - mas
// cobre os 3 pontos pedidos: fica durante a execução, reage ao que
// acontece, aparece se a pessoa travar/se distrair. `spoken` é a MESMA
// intenção reescrita pra soar natural em voz alta (mesmo padrão de
// `companion-phrasing.ts`) - usada só se a fala automática estiver
// ligada (ver `GuidedTour`), nunca lida ao pé da letra do `written`.
// export const MASCOT_STEP_INTRO: Record<MascotPersonality, { written: string; spoken: string }> = {
//   afetuoso: {
//     written: "Oi! Eu sou seu companheiro por aqui — fico com você quando começa uma tarefa de verdade, reajo ao que rola durante a execução, e apareço se você travar ou se distrair. Pode trocar meu nome, espécie e jeito de ser quando quiser, em Configurações.",
//     spoken: "Oi! Eu sou seu companheiro por aqui. Fico com você quando você começa uma tarefa de verdade, reajo ao que rola enquanto você executa, e apareço se você travar ou se distrair um pouco. Pode trocar meu nome, minha espécie e meu jeito de ser quando quiser, lá em Configurações.",
//   },
//   sarcastico: {
//     written: "Sou eu, seu companheiro. Fico de olho quando você começa uma tarefa pra valer, comento o que rola durante a execução, e apareço se você travar ou sumir no meio do caminho. Nome, espécie e personalidade dá pra trocar em Configurações, se meu jeito não for a sua praia.",
//     spoken: "Sou eu, seu companheiro. Fico de olho quando você começa uma tarefa pra valer, comento o que rola enquanto você executa, e apareço se você travar ou sumir no meio do caminho. Nome, espécie e personalidade dá pra trocar lá em Configurações, se meu jeito não for a sua praia.",
//   },
//   engracado: {
//     written: "Opa! Eu sou seu companheiro por aqui — fico com você quando começa uma tarefa de verdade, reajo junto durante a execução, e apareço se você travar ou se distrair. Nome, espécie e personalidade dá pra trocar em Configurações, se bater vontade de bagunçar tudo.",
//     spoken: "Opa! Eu sou seu companheiro por aqui. Fico com você quando você começa uma tarefa de verdade, reajo junto enquanto você executa, e apareço se você travar ou se distrair um pouco. Nome, espécie e personalidade dá pra trocar lá em Configurações, se bater vontade de bagunçar tudo.",
//   },
//   motivador: {
//     written: "Eu sou seu companheiro nessa jornada! Fico com você quando começa uma tarefa de verdade, celebro o progresso durante a execução, e apareço se você travar ou se distrair. Pode ajustar meu nome, espécie e personalidade em Configurações quando quiser.",
//     spoken: "Eu sou seu companheiro nessa jornada! Fico com você quando você começa uma tarefa de verdade, celebro o progresso enquanto você executa, e apareço se você travar ou se distrair um pouco. Pode ajustar meu nome, minha espécie e minha personalidade lá em Configurações, quando quiser.",
//   },
//   zen: {
//     written: "Eu sou seu companheiro por aqui. Fico com você quando começa uma tarefa de verdade, acompanho o ritmo durante a execução, e apareço com calma se você travar ou se distrair. Nome, espécie e personalidade dá pra ajustar em Configurações.",
//     spoken: "Eu sou seu companheiro por aqui. Fico com você quando você começa uma tarefa de verdade, acompanho o ritmo enquanto você executa, e apareço com calma se você travar ou se distrair um pouco. Nome, espécie e personalidade dá pra ajustar lá em Configurações.",
//   },
// };
export const MASCOT_STEP_INTRO: Record<
  MascotPersonality,
  { written: string; spoken: string }
> = {
  afetuoso: {
    written:
      "Oi! Eu vou te fazer companhia por aqui. Quando você começar uma tarefa, posso ficar com você, acompanhar como as coisas estão indo e ajudar se você travar ou se distrair. E se quiser, dá pra mudar meu nome, aparência e personalidade depois.",
    spoken:
      "Oi! Eu vou te fazer companhia por aqui. Quando você começar uma tarefa, posso ficar com você, acompanhar como as coisas estão indo e ajudar se você travar ou se distrair. E depois você pode mudar meu nome, aparência e meu jeito de ser.",
  },

  sarcastico: {
    written:
      "Então, aparentemente somos uma dupla agora. Quando você começar uma tarefa, eu fico por perto, acompanho o progresso e apareço se você travar ou acabar se perdendo pelo caminho. Se não gostar da minha cara ou do meu jeito, dá pra mudar depois.",
    spoken:
      "Então, aparentemente somos uma dupla agora. Quando você começar uma tarefa, eu fico por perto, acompanho como tá indo e apareço se você travar ou se perder pelo caminho. E sim, dá pra mudar minha aparência e meu jeito depois.",
  },

  engracado: {
    written:
      "Opa! Parece que agora somos uma dupla. Quando você começar uma tarefa, eu acompanho a aventura, comemoro o que der certo e apareço se você travar ou se distrair no caminho. Minha aparência e meu jeito também podem mudar depois.",
    spoken:
      "Opa! Parece que agora somos uma dupla. Quando você começar uma tarefa, eu acompanho a aventura e apareço se você travar ou se distrair no caminho. E depois dá pra mudar minha aparência e meu jeito também.",
  },

  motivador: {
    written:
      "Eu vou acompanhar você por aqui. Quando começar uma tarefa, fico junto durante a execução, acompanho seu progresso e posso ajudar quando bater aquela trava ou distração. Vamos fazendo uma coisa de cada vez.",
    spoken:
      "Eu vou acompanhar você por aqui. Quando começar uma tarefa, fico junto, acompanho seu progresso e posso ajudar quando você travar ou se distrair. Uma coisa de cada vez.",
  },

  zen: {
    written:
      "Eu vou te acompanhar por aqui, sem pressão. Quando você começar uma tarefa, fico com você durante o processo e posso ajudar se você travar, se distrair ou só precisar encontrar o próximo passo.",
    spoken:
      "Eu vou te acompanhar por aqui, sem pressão. Quando você começar uma tarefa, fico com você e posso ajudar se você travar, se distrair ou só precisar encontrar o próximo passo.",
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
