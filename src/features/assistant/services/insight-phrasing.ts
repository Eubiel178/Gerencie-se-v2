import { MascotPersonality } from "@/features/focus/domain";

/**
 * Fatos puros — só o dado real por trás de cada insight, sem texto nenhum.
 * `RuleBasedAssistantProvider` decide QUAIS fatos se aplicam; `phraseInsight`
 * decide COMO dizer isso, de acordo com a personalidade escolhida em
 * Configurações (o mesmo personagem que fala no Focus e no widget). Separar
 * as duas coisas evita que a lógica de regra (o que é verdade) se misture
 * com a de tom (como falar) — mesma ideia de `mascot-lines.ts`.
 */
export type InsightFact =
  | { kind: "overdue-tasks"; count: number; oldestTitle: string }
  | { kind: "priority-tasks-done"; count: number }
  | { kind: "priority-tasks-progress"; done: number; total: number }
  | { kind: "task-overload"; count: number }
  | { kind: "habit-streak-at-risk"; title: string; streak: number }
  | { kind: "goal-deadline-near"; title: string; daysLeft: number; progress: number }
  | { kind: "next-routine-item"; time: string; title: string }
  | { kind: "all-clear" };

type Phraser = (fact: Extract<InsightFact, { kind: string }>) => string;

/** Cada personalidade só muda a EMBALAGEM da frase — o fato (contagem,
 * nome, prazo) é sempre o mesmo, nunca inventado. Mesma regra de escrita
 * de `mascot-lines.ts`: frases curtas, sem reticências/travessão/dois-
 * pontos/parênteses de gênero, porque também podem ser lidas em voz alta. */
const PHRASERS: Record<MascotPersonality, Record<InsightFact["kind"], Phraser>> = {
  afetuoso: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `A tarefa "${fact.oldestTitle}" está atrasada. Sem culpa, só um lembrete carinhoso.`
        : `Você tem ${fact.count} tarefas atrasadas. A mais antiga é "${fact.oldestTitle}". Vamos organizar juntos?`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `Você concluiu todas as ${fact.count} tarefas prioritárias de hoje. Que orgulho!`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `Você já concluiu ${fact.done} das ${fact.total} tarefas prioritárias. Continua assim.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `Você tem ${fact.count} tarefas pendentes. Talvez seja um bom momento pra respirar e reorganizar as prioridades.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `Sua sequência em "${fact.title}" está em ${fact.streak} dias. Não deixa acabar hoje, você tá indo tão bem.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `O prazo de "${fact.title}" é hoje, com ${fact.progress}% de progresso. Você consegue terminar com calma.`
        : `O prazo de "${fact.title}" é em ${fact.daysLeft} dia(s), com ${fact.progress}% de progresso. Ainda dá tempo.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Daqui a pouco, às ${fact.time}, é hora de "${fact.title}". Tô aqui torcendo por você.`;
    },
    "all-clear": () => "Nenhuma tarefa pendente agora. Bom momento pra descansar ou planejar o que vem por aí.",
  },

  sarcastico: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `Oxente, a tarefa "${fact.oldestTitle}" tá atrasada. Quem diria.`
        : `Vixe, ${fact.count} tarefas atrasadas. A mais antiga, "${fact.oldestTitle}", já deve tá com saudade.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `Terminou as ${fact.count} tarefas prioritárias. Milagre do dia, véi.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} tarefas prioritárias feitas. Faltam só as outras, sem pressa nenhuma, né.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas pendentes. Eita, coleciona tarefa ou vai fazer alguma coisa?`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `Sua sequência em "${fact.title}" tá em ${fact.streak} dias. Vai jogar isso fora hoje mesmo?`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `O prazo de "${fact.title}" é hoje e o progresso tá em ${fact.progress}%. Oxente, boa sorte.`
        : `Faltam ${fact.daysLeft} dia(s) pro prazo de "${fact.title}", progresso em ${fact.progress}%. Nesse ritmo, véi.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time} é "${fact.title}". Vai lembrar sozinho ou precisa que eu grite?`;
    },
    "all-clear": () => "Nenhuma tarefa pendente. Vixe, você ou terminou tudo ou tá enrolando muito bem.",
  },

  engracado: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `A tarefa "${fact.oldestTitle}" tá atrasada. Ela já tá pedindo socorro.`
        : `${fact.count} tarefas atrasadas, lideradas por "${fact.oldestTitle}". Já formaram um grupo de apoio.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `Todas as ${fact.count} tarefas prioritárias concluídas! Chama a imprensa.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} tarefas prioritárias prontas. O resto deve tá com timidez.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas pendentes. Isso já é quase uma coleção colecionável.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `"${fact.title}" tá numa sequência de ${fact.streak} dias. Ela confia em você, não vacila.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `Hoje é o prazo de "${fact.title}", progresso em ${fact.progress}%. Sem pressão, só o dia inteiro em jogo.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", em ${fact.progress}%. O relógio faz tic-tac, discretamente.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time}: "${fact.title}". Já separei a trilha sonora dramática.`;
    },
    "all-clear": () => "Nenhuma tarefa pendente. Ou você é muito eficiente, ou muito corajoso.",
  },

  motivador: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `A tarefa "${fact.oldestTitle}" está esperando por você. Um passo agora já muda o dia.`
        : `${fact.count} tarefas atrasadas, começando por "${fact.oldestTitle}". Escolha uma e comece agora.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `Você concluiu as ${fact.count} tarefas prioritárias. Isso é disciplina de verdade.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} tarefas prioritárias concluídas. Você está mais perto do que imagina.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas pendentes. Escolha a mais importante e comece só por ela.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `${fact.streak} dias de sequência em "${fact.title}". Não pare agora, cada dia conta mais que o anterior.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `Hoje é o prazo de "${fact.title}", com ${fact.progress}% feito. Termine forte.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", em ${fact.progress}%. Dá pra chegar lá.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time}: "${fact.title}". Mais um compromisso com você mesmo.`;
    },
    "all-clear": () => "Nenhuma tarefa pendente agora. Aproveite pra planejar o próximo passo com calma.",
  },

  zen: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `A tarefa "${fact.oldestTitle}" está atrasada. Sem pressa, um passo de cada vez.`
        : `${fact.count} tarefas atrasadas, a mais antiga é "${fact.oldestTitle}". Respire, e comece por uma só.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `As ${fact.count} tarefas prioritárias estão concluídas. Reconheça esse momento.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} tarefas prioritárias concluídas. O caminho já está sendo percorrido.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas pendentes. Talvez seja hora de simplificar, não de acelerar.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `${fact.streak} dias de sequência em "${fact.title}". Um momento de atenção hoje mantém o ritmo.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `O prazo de "${fact.title}" é hoje, com ${fact.progress}% de progresso. Siga com calma até o fim.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", em ${fact.progress}%. Ainda há tempo, sem pressa.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time}, é hora de "${fact.title}". Um compromisso de cada vez.`;
    },
    "all-clear": () => "Nenhuma tarefa pendente agora. Um bom momento para simplesmente estar presente.",
  },
};

export function phraseInsight(fact: InsightFact, personality: MascotPersonality): string {
  const phraser = PHRASERS[personality][fact.kind] as Phraser;
  return phraser(fact);
}
