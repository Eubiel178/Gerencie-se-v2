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
}

export function buildGuidedTourSteps(mascotName: string): GuidedTourStep[] {
  return [
    {
      id: "welcome",
      path: "/home",
      target: null,
      title: "Bem-vindo ao Gerencie-se!",
      body: "Um tour rápido por algumas telas antes de você começar. Leva menos de dois minutos, e dá pra pular a qualquer momento.",
    },
    {
      id: "nav",
      target: '[data-tour="nav"]',
      title: "Sua navegação",
      body: "Tarefas, hábitos, objetivos, foco e o resto ficam organizados por área aqui. Clique num grupo pra abrir os links dele.",
    },
    {
      id: "search",
      target: '[data-tour="search"]',
      title: "Busca e captura rápida",
      body: "Ctrl+K abre a busca de qualquer lugar do app. Já a captura rápida cria uma tarefa em segundos, sem precisar abrir formulário nenhum.",
    },
    {
      id: "checklist",
      target: '[data-tour="checklist"]',
      title: "Primeiros passos",
      body: "Esse checklist te guia pelas primeiras ações — criar uma tarefa, um hábito, personalizar o mascote. Vá no seu ritmo, ninguém está cronometrando.",
    },
    {
      id: "mascot",
      target: '[data-tour="mascot"]',
      title: mascotName,
      body: `${mascotName} é seu companheiro por aqui — anda solto pela tela, comemora quando você conclui algo, e também aceita um clique de vez em quando. Troque o nome, a espécie e a personalidade em Configurações.`,
    },
    {
      id: "new-task",
      path: "/home/tasks",
      target: '[data-tour="new-task"]',
      title: "Criar uma tarefa",
      body: "Prioridade, prazo, lembrete, tudo aqui. A cor da borda esquerda de cada card já mostra a prioridade dela, sem precisar abrir nada.",
    },
    {
      id: "focus",
      path: "/home/focus",
      target: '[data-tour="focus-start"]',
      title: "Sessões de foco",
      body: "Escolha um tempo e comece — o cronômetro roda mesmo se você sair da tela, e cada sessão concluída vira XP pro seu mascote.",
    },
    {
      id: "notifications",
      path: "/home/settings?section=notificacoes",
      target: '[data-tour="notifications-settings"]',
      title: "Lembretes e notificações",
      body: "Aqui você liga notificações no navegador, no celular (push) ou por e-mail para não perder o horário de uma tarefa — e também ativa o resumo semanal, se quiser.",
    },
    {
      id: "done",
      target: null,
      title: "Pronto!",
      body: "Você já conhece o essencial. O resto é ir explorando no seu tempo — bom trabalho.",
    },
  ];
}
