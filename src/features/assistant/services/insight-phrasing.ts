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
        ? `A tarefa "${fact.oldestTitle}" ficou pra trás. Ninguém vai te cobrar por isso, só lembrando que ela existe.`
        : `${fact.count} tarefas atrasadas, a mais velha é "${fact.oldestTitle}". Escolhe uma pra tirar do papel hoje.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `Terminou as ${fact.count} tarefas prioritárias de hoje. Você merece parar um pouco agora.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} tarefas prioritárias prontas. Falta pouco, e você já provou que dá conta.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas na fila. Não precisa resolver tudo hoje, só o que fizer sentido.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `"${fact.title}" tá em ${fact.streak} dias seguidos. Seria uma pena parar bem agora.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `"${fact.title}" vence hoje, e você já tá em ${fact.progress}%. Ainda dá tempo de fechar com calma.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", em ${fact.progress}%. Você tá construindo isso aos poucos.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time} é "${fact.title}". Vou lembrar você quando chegar a hora.`;
    },
    "all-clear": () => "Nada pendente agora. Aproveita esse respiro, ele é raro.",
  },

  sarcastico: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `"${fact.oldestTitle}" tá atrasada. Ela já deve achar que você esqueceu que ela existe.`
        : `${fact.count} tarefas atrasadas, lideradas por "${fact.oldestTitle}". Parabéns pela coleção.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `As ${fact.count} prioritárias, todas feitas. Nem eu vi vindo essa.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} prioritárias prontas. As outras devem tá com medo de aparecer.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas na lista. Isso já é hobbie ou ainda conta como trabalho?`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `${fact.streak} dias de sequência em "${fact.title}". Ia ser engraçado perder isso hoje, tipo, muito.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `"${fact.title}" vence hoje e o progresso tá em ${fact.progress}%. Boa sorte, vai precisar.`
        : `${fact.daysLeft} dia(s) pro prazo de "${fact.title}", ${fact.progress}% feito. O relógio não parou pra te esperar, viu.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time} tem "${fact.title}". Vou lembrar, porque contar com sua memória é arriscado.`;
    },
    "all-clear": () => "Nada pendente. Ou você é eficiente ou virou mestre em adiar sem culpa.",
  },

  engracado: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `"${fact.oldestTitle}" tá atrasada e já deve tá ensaiando um discurso de abandono.`
        : `${fact.count} tarefas atrasadas, o grupo já tem nome e tudo, lideradas por "${fact.oldestTitle}".`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `${fact.count} prioritárias, todas resolvidas. Bota confete, mesmo que só na imaginação.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} prontas. O resto deve tá esperando uma senha pra entrar.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas na fila. Isso já rendia um museu.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `"${fact.title}" tá numa sequência de ${fact.streak} dias e conta com você pra não zerar hoje.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `Hoje vence "${fact.title}", em ${fact.progress}%. Sem pressão, só o dia inteiro dependendo disso.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", ${fact.progress}% feito. O relógio faz tic-tac baixinho aí no canto.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time}, "${fact.title}" entra em cena. Já separei a trilha sonora.`;
    },
    "all-clear": () => "Nada pendente. Suspeito, mas vou aceitar.",
  },

  motivador: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `"${fact.oldestTitle}" tá esperando. Um passo agora já destrava o resto do dia.`
        : `${fact.count} tarefas atrasadas, começando por "${fact.oldestTitle}". Escolhe uma e ataca só ela.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `As ${fact.count} prioritárias, resolvidas. Isso não é sorte, é rotina funcionando.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} prioritárias feitas. Você tá mais perto do fim do que do começo.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas na fila. Pega a mais pesada primeiro, o resto fica mais leve depois.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `${fact.streak} dias seguidos em "${fact.title}". Não é hora de soltar isso.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `"${fact.title}" vence hoje, ${fact.progress}% feito. Fecha com o que já tem, isso já é vitória.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", em ${fact.progress}%. Segue no ritmo, você tá construindo algo real.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time} é "${fact.title}". Mais um compromisso que só depende de você.`;
    },
    "all-clear": () => "Nada pendente agora. Usa esse tempo pra escolher o próximo passo com cabeça fria.",
  },

  zen: {
    "overdue-tasks": (f) => {
      const fact = f as Extract<InsightFact, { kind: "overdue-tasks" }>;
      return fact.count === 1
        ? `"${fact.oldestTitle}" ficou atrasada. Não precisa carregar isso como peso, só como próximo passo.`
        : `${fact.count} tarefas atrasadas, a mais antiga é "${fact.oldestTitle}". Escolhe uma e deixa o resto esperar.`;
    },
    "priority-tasks-done": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-done" }>;
      return `As ${fact.count} prioritárias estão prontas. Sente esse alívio por um instante antes de seguir.`;
    },
    "priority-tasks-progress": (f) => {
      const fact = f as Extract<InsightFact, { kind: "priority-tasks-progress" }>;
      return `${fact.done} de ${fact.total} prioritárias feitas. O que falta chega no tempo certo.`;
    },
    "task-overload": (f) => {
      const fact = f as Extract<InsightFact, { kind: "task-overload" }>;
      return `${fact.count} tarefas na fila. Talvez a resposta não seja fazer mais rápido, e sim escolher menos.`;
    },
    "habit-streak-at-risk": (f) => {
      const fact = f as Extract<InsightFact, { kind: "habit-streak-at-risk" }>;
      return `${fact.streak} dias em "${fact.title}". Um momento de atenção hoje mantém o que você construiu.`;
    },
    "goal-deadline-near": (f) => {
      const fact = f as Extract<InsightFact, { kind: "goal-deadline-near" }>;
      return fact.daysLeft === 0
        ? `"${fact.title}" vence hoje, ${fact.progress}% percorrido. Termina no seu ritmo, sem pressa.`
        : `Faltam ${fact.daysLeft} dia(s) pra "${fact.title}", em ${fact.progress}%. Ainda há espaço, respira.`;
    },
    "next-routine-item": (f) => {
      const fact = f as Extract<InsightFact, { kind: "next-routine-item" }>;
      return `Às ${fact.time} é "${fact.title}". Só mais um momento do dia, nada além disso.`;
    },
    "all-clear": () => "Nada pendente agora. Um bom instante pra simplesmente parar.",
  },
};

export function phraseInsight(fact: InsightFact, personality: MascotPersonality): string {
  const phraser = PHRASERS[personality][fact.kind] as Phraser;
  return phraser(fact);
}
