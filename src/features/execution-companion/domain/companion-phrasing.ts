import { MascotPersonality } from "@/features/focus/domain";
import type { Gender } from "@/features/profile/get-gender";

/**
 * Fatos puros por trás de uma interação espontânea do Companion na página
 * de Tarefas — sempre dado real (`ITask`/`IExecutionSession`), nunca
 * inventado. Mesmo raciocínio de `InsightFact` em
 * `features/assistant/services/insight-phrasing.ts`: a REGRA (qual evento
 * é real, relevante, e SE deve usar o nome da pessoa desta vez) mora em
 * `use-tasks-companion.ts`/`interaction-policy.ts`; este arquivo só decide
 * COMO dizer isso.
 */
export type CompanionFact =
  // `isFirstEver` = true SÓ na primeiríssima vez que esta conta inicia
  // uma execução acompanhada (ver `executionIntroShown` em
  // `src/db/schema.ts`) - o tour guiado não ensina "Começar" (não existe
  // nenhuma tarefa real pra apontar durante o onboarding), então a
  // introdução acontece aqui, contextual, na hora real. Sempre 100%
  // determinístico (nunca via IA - ver `INTENT_CONFIG`), pra nunca
  // arriscar uma primeira impressão estranha.
  | { kind: "execution-started"; taskTitle: string; isFirstEver?: boolean }
  | { kind: "execution-completed"; taskTitle: string }
  | { kind: "execution-idle-nudge"; taskTitle: string; elapsedMinutes: number }
  // Usuário voltou pra página de Tarefas depois de a aba ficar escondida
  // por um tempo, com uma tarefa em andamento. Linguagem SEMPRE neutra
  // (pedido explícito) — nunca presume distração ("você sumiu",
  // "cadê você"), só reconhece a volta.
  | { kind: "return-after-absence"; taskTitle: string; firstName: string | null }
  // Entrar na página de Tarefas pela primeira vez NESTA sessão de
  // navegador (não a cada navegação/refresh — ver `interaction-policy.ts`).
  // `taskTitle` nulo = sem tarefa ativa/pausada agora, só reconhece a
  // presença; não nulo = já entra citando o que estava em andamento.
  | { kind: "presence-greeting"; taskTitle: string | null; firstName: string | null }
  // Tarefa ativa há muito tempo seguido (bem-estar, não produtividade) —
  // um COMENTÁRIO, não uma pergunta, propositalmente (mistura de
  // intenções pedida: nem tudo é pergunta).
  | { kind: "long-session"; taskTitle: string; elapsedMinutes: number; gender: Gender }
  // Prazo real (`task.scheduledAt`) se aproximando de uma tarefa ainda
  // não concluída — nunca inventa urgência sem uma data real por trás.
  | { kind: "deadline-approaching"; taskTitle: string; minutesUntilDue: number }
  // Prazo real já passou e a tarefa continua sem concluir - distinto de
  // "se aproximando" (tom diferente: reconhecimento do atraso, não aviso
  // preventivo), nunca acusatório.
  | { kind: "overdue-task"; taskTitle: string; daysOverdue: number }
  // Vários passos concluídos desde a última checagem (marco real de
  // progresso, não todo passo isolado) - reconhecimento, não pergunta.
  | { kind: "progress-milestone"; taskTitle: string; completedSteps: number; totalSteps: number }
  // Uma tarefa que já estava concluída foi reaberta - reconhecimento
  // neutro, nunca "você desistiu"/"voltou atrás" (mesma regra de
  // linguagem neutra de `return-after-absence`).
  | { kind: "reopened-task"; taskTitle: string }
  // Trocou de tarefa ativa mais de uma vez numa janela curta - um
  // COMENTÁRIO sobre o padrão (nunca acusatório de "falta de foco"),
  // não um alarme a cada troca isolada.
  | { kind: "task-switching"; taskTitle: string }
  // Tarefa marcada concluída SEM nunca ter tido uma sessão de execução
  // rastreada - uma "vitória silenciosa": aconteceu sem alarde, o
  // Companion nota isso mesmo assim, só que num tom mais discreto do
  // que uma conclusão "acompanhada" (`execution-completed`).
  | { kind: "quiet-win"; taskTitle: string }
  // A MESMA tarefa foi reaberta mais de uma vez nesta sessão de
  // navegador - diferente de uma reabertura isolada (`reopened-task`),
  // aqui há espaço real pra oferecer ajuda/sugerir, nunca julgamento.
  | { kind: "repeated-reopen"; taskTitle: string; reopenCount: number }
  // Não é sobre nenhuma tarefa - o próprio Companion pergunta se deve
  // falar menos por um tempo, depois de fechamentos casuais repetidos
  // (ver `use-tasks-companion.ts`). Fraseado 100% determinístico de
  // propósito (nunca via IA) - uma pergunta sobre limite pessoal precisa
  // ser sempre previsível.
  | { kind: "ask-quiet-check" };

/**
 * A mensagem canônica do Companion: UM texto gerado por fato — o que
 * aparece no balão (`written`) e o que vai pra voz (`spoken`). Há DOIS
 * campos hoje por compatibilidade temporária (a duplicação está em
 * remoção; enquanto durar, `phraseCompanion`, os providers de IA e a
 * Server Action `resolveCompanionMessageAction` FORÇAM `spoken ===
 * written` em 100% dos caminhos). Não existe mais texto separado "pra
 * fala": essa segunda versão reescrita era a fonte do `"Elta venceu faz
 * pouco."` (a IA rescrevia livremente e a entidade sumia/era trocada).
 * Pronúncia é responsabilidade da camada determinística `toSpeechText`
 * em `lib/speech/speak-text.ts` — aqui e nos prompts, nunca.
 */
export interface CompanionPhrase {
  written: string;
  spoken: string;
}

/** Cada fato de cada personalidade vira UM texto canônico: o ESCRITO que
 * é ao mesmo tempo exibido e falado (cf. `phraseCompanion`, que devolve o
 * mesmo texto nas duas camadas). Determinístico, sem IA e sem variação. */
type Phraser = (fact: CompanionFact) => string;

function greetingName(firstName: string | null): string {
  return firstName ? `, ${firstName}` : "";
}

const PHRASERS: Record<MascotPersonality, Record<CompanionFact["kind"], Phraser>> = {
  afetuoso: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return `Essa é a primeira vez que acompanho você numa tarefa. Vou ficar por aqui enquanto você trabalha nela.`;
      }
      return `Começando "${fact.taskTitle}". Tô na torcida.`;
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return `"${fact.taskTitle}" concluída. Você merece um respiro.`;
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return `Como está indo "${fact.taskTitle}"?`;
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return `Que bom te ver de novo${greetingName(fact.firstName)}. "${fact.taskTitle}" ainda te espera.`;
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" segue por aqui.`;
      }
      return `Oi${greetingName(fact.firstName)}. Bom te ver por aqui.`;
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return `Já são ${fact.elapsedMinutes} min em "${fact.taskTitle}". Uma pausa também é cuidado.`;
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return `"${fact.taskTitle}" vence em breve. Ainda dá tempo, com calma.`;
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return `"${fact.taskTitle}" passou do prazo. Sem peso, só retomar quando puder.`;
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return `${fact.completedSteps} de ${fact.totalSteps} passos em "${fact.taskTitle}". Orgulho disso.`;
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return `"${fact.taskTitle}" voltou pra lista. Tudo bem, seguimos juntos.`;
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return `Andou trocando de tarefa. "${fact.taskTitle}" também merece um pouco de atenção.`;
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return `"${fact.taskTitle}" concluída, bem discretamente. Notei sim.`;
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return `"${fact.taskTitle}" voltou de novo. Quer ajuda pra fechar essa de vez?`;
    },
    "ask-quiet-check": () => `Quer que eu fale menos por um tempo?`,
  },

  sarcastico: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return `Primeira vez que eu acompanho você numa tarefa. Vou ficar de olho, sem falar toda hora.`;
      }
      return `"${fact.taskTitle}" começou. Vamos ver até quando.`;
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return `"${fact.taskTitle}" concluída. Olha só, terminou mesmo.`;
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return `Ainda aí em "${fact.taskTitle}"?`;
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return `Voltou${greetingName(fact.firstName)}. "${fact.taskTitle}" continua aí, viu.`;
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return `Chegou${greetingName(fact.firstName)}. "${fact.taskTitle}" continua parada aí.`;
      }
      return `E aí${greetingName(fact.firstName)}. Apareceu.`;
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return `${fact.elapsedMinutes} min em "${fact.taskTitle}". Tá casado com essa tarefa, hein.`;
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return `"${fact.taskTitle}" vence logo. O relógio não tá de brincadeira.`;
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return `"${fact.taskTitle}" já passou do prazo. O relógio venceu essa rodada.`;
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Olha só, andou.`;
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return `"${fact.taskTitle}" voltou. Achou que ia se livrar dela?`;
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return `Pulando de tarefa em tarefa, hein. "${fact.taskTitle}" também tá na fila.`;
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return `"${fact.taskTitle}" concluída no silêncio. Nem avisou, hein.`;
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return `"${fact.taskTitle}" voltou de novo. Isso já é rotina, hein.`;
    },
    "ask-quiet-check": () => `Quer que eu fale menos por um tempo?`,
  },

  engracado: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return `Opa, primeira vez que eu acompanho você numa tarefa! Vou ficar por aqui.`;
      }
      return `"${fact.taskTitle}" começou. Bora nessa.`;
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return `"${fact.taskTitle}" concluída. Bota confete.`;
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return `"${fact.taskTitle}" ainda rolando por aí?`;
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return `E aí${greetingName(fact.firstName)}, voltou. "${fact.taskTitle}" tava com saudade.`;
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" te esperando igual pipoca no micro-ondas.`;
      }
      return `Apareceu${greetingName(fact.firstName)}. Já ia mandar time de busca.`;
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return `${fact.elapsedMinutes} min em "${fact.taskTitle}". Já pode cobrar aluguel dela.`;
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return `"${fact.taskTitle}" vence logo. O tic-tac já começou.`;
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return `"${fact.taskTitle}" passou do prazo. O tic-tac virou plateia agora.`;
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Tá andando bonito.`;
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return `"${fact.taskTitle}" voltou pro jogo. Round dois.`;
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return `Tá pulando de galho em galho hoje. "${fact.taskTitle}" também quer um cafuné.`;
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return `"${fact.taskTitle}" concluída sem fanfarra nenhuma. Ninja mode.`;
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return `"${fact.taskTitle}" voltou de novo. Ela e você viraram dupla fixa, hein.`;
    },
    "ask-quiet-check": () => `Quer que eu fale menos por um tempo?`,
  },

  motivador: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return `Primeira vez que faço isso com você. Vou ficar acompanhando daqui pra frente.`;
      }
      return `Começou "${fact.taskTitle}". Só o começo já conta.`;
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return `"${fact.taskTitle}" concluída. Isso é mérito seu.`;
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return `Como está "${fact.taskTitle}"? Segue no ritmo.`;
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return `Voltou${greetingName(fact.firstName)}. "${fact.taskTitle}" segue esperando por você.`;
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" tá logo ali, esperando você continuar.`;
      }
      return `Oi${greetingName(fact.firstName)}. Bora fazer esse tempo valer.`;
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return `${fact.elapsedMinutes} min seguidos em "${fact.taskTitle}". Foco de verdade.`;
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return `"${fact.taskTitle}" vence logo. Dá pra chegar lá.`;
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return `"${fact.taskTitle}" passou do prazo. Retomar agora já conta.`;
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Isso é mérito seu.`;
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return `"${fact.taskTitle}" voltou. Segunda tentativa também conta.`;
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return `Trocou de tarefa algumas vezes. "${fact.taskTitle}" também merece um empurrão.`;
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return `"${fact.taskTitle}" concluída sem alarde. Ainda assim é vitória.`;
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return `"${fact.taskTitle}" voltou de novo. Bora fechar essa dessa vez?`;
    },
    "ask-quiet-check": () => `Quer que eu fale menos por um tempo?`,
  },

  zen: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return `Primeira vez que acompanho você assim. Vou ficar por perto, sem pressa.`;
      }
      return `Começando "${fact.taskTitle}". Sem pressa.`;
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return `"${fact.taskTitle}" concluída. Um bom momento pra parar.`;
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return `Ainda com "${fact.taskTitle}"? Sem pressa.`;
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return `Voltou${greetingName(fact.firstName)}. "${fact.taskTitle}" continua aqui, no seu tempo.`;
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" continua aqui, sem pressa nenhuma.`;
      }
      return `Oi${greetingName(fact.firstName)}. Um bom momento pra começar, se quiser.`;
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return `${fact.elapsedMinutes} min em "${fact.taskTitle}". Respirar também é produtivo.`;
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return `"${fact.taskTitle}" vence em breve. Ainda há espaço.`;
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return `"${fact.taskTitle}" passou do prazo. Sem peso, só o próximo passo.`;
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Vale notar isso.`;
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return `"${fact.taskTitle}" voltou. Tudo bem, sem pressa.`;
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return `Andou circulando entre tarefas. "${fact.taskTitle}" continua esperando, sem pressa.`;
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return `"${fact.taskTitle}" concluída em silêncio. Também conta.`;
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return `"${fact.taskTitle}" voltou mais uma vez. Sem julgamento, só presença.`;
    },
    "ask-quiet-check": () => `Quer que eu fale menos por um tempo?`,
  },
};

export function phraseCompanion(
  fact: CompanionFact,
  personality: MascotPersonality
): CompanionPhrase {
  const phraser = PHRASERS[personality][fact.kind] as Phraser;
  const written = phraser(fact);
  return { written, spoken: written };
}