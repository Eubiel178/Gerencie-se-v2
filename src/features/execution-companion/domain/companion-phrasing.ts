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
 * Um fato sempre vira DOIS textos, nunca um só:
 * - `written`: curto, pro balão de fala perto do mascote.
 * - `spoken`: escrito à parte para soar natural em voz alta via TTS — pode
 *   usar contração/interjeição que o texto escrito evita. Mesma regra de
 *   escrita de `mascot-lines.ts` pras duas formas: frases curtas, sem
 *   reticências/travessão/dois-pontos/parênteses de gênero.
 *
 * Os dois SEMPRE nascem juntos, do MESMO fato, na mesma chamada de
 * `phraseCompanion` — nunca gerados em momentos/chamadas separadas. É
 * isso que impede o balão mostrar uma coisa enquanto o TTS fala outra
 * (bug relatado): não existe like caminho no código pra pedir só um dos
 * dois textos.
 */
export interface CompanionPhrase {
  written: string;
  spoken: string;
}

type Phraser = (fact: CompanionFact) => CompanionPhrase;

function greetingName(firstName: string | null): string {
  return firstName ? `, ${firstName}` : "";
}

const PHRASERS: Record<MascotPersonality, Record<CompanionFact["kind"], Phraser>> = {
  afetuoso: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return {
          written: `Essa é a primeira vez que acompanho você numa tarefa. Vou ficar por aqui enquanto você trabalha nela.`,
          spoken: `Primeira vez que a gente faz isso junto. Vou ficar por aqui com você, sem pressão nenhuma.`,
        };
      }
      return {
        written: `Começando "${fact.taskTitle}". Tô na torcida.`,
        spoken: `Boa, bora começar essa tarefa aí. Tô na torcida por você.`,
      };
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return {
        written: `"${fact.taskTitle}" concluída. Você merece um respiro.`,
        spoken: `Terminou. Fico genuinamente feliz por você, viu, merece um respiro agora.`,
      };
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return {
        written: `Como está indo "${fact.taskTitle}"?`,
        spoken: `E aí, como tá indo com essa tarefa? Continuo aqui do seu lado.`,
      };
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return {
        written: `Que bom te ver de novo${greetingName(fact.firstName)}. "${fact.taskTitle}" ainda te espera.`,
        spoken: `Que bom te ver de novo. Essa tarefa ainda tá esperando por você, sem pressa.`,
      };
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return {
          written: `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" segue por aqui.`,
          spoken: `Oi de novo. Essa tarefa continua te esperando, sem pressa.`,
        };
      }
      return {
        written: `Oi${greetingName(fact.firstName)}. Bom te ver por aqui.`,
        spoken: `Oi. Bom te ver por aqui de novo.`,
      };
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      const tired = fact.gender === "feminino" ? "cansada" : fact.gender === "masculino" ? "cansado" : "num ritmo forte";
      return {
        written: `Já são ${fact.elapsedMinutes} min em "${fact.taskTitle}". Uma pausa também é cuidado.`,
        spoken: `Já faz um tempo bom nessa tarefa, viu. Se tiver ${tired}, uma pausa curta também conta como cuidar de você.`,
      };
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return {
        written: `"${fact.taskTitle}" vence em breve. Ainda dá tempo, com calma.`,
        spoken: `Só lembrando com carinho, essa tarefa tá com o prazo chegando. Ainda dá tempo, sem correria.`,
      };
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return {
        written: `"${fact.taskTitle}" passou do prazo. Sem peso, só retomar quando puder.`,
        spoken: `Essa tarefa passou do prazo, viu. Não precisa carregar isso como peso, só retomar quando der.`,
      };
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return {
        written: `${fact.completedSteps} de ${fact.totalSteps} passos em "${fact.taskTitle}". Orgulho disso.`,
        spoken: `Olha o progresso nessa tarefa, viu. Tô com orgulho de acompanhar isso.`,
      };
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return {
        written: `"${fact.taskTitle}" voltou pra lista. Tudo bem, seguimos juntos.`,
        spoken: `Essa tarefa voltou pra lista de novo. Tudo bem, a gente segue nela juntos.`,
      };
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return {
        written: `Andou trocando de tarefa. "${fact.taskTitle}" também merece um pouco de atenção.`,
        spoken: `Percebi que você andou trocando de tarefa algumas vezes. Sem problema, só lembrando que essa aqui também tá esperando.`,
      };
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return {
        written: `"${fact.taskTitle}" concluída, bem discretamente. Notei sim.`,
        spoken: `Você terminou essa tarefa bem quietinho, sem alarde nenhum. Mas eu notei, viu.`,
      };
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return {
        written: `"${fact.taskTitle}" voltou de novo. Quer ajuda pra fechar essa de vez?`,
        spoken: `Essa tarefa já voltou pra lista mais de uma vez. Quer uma mãozinha pra fechar ela de vez?`,
      };
    },
    "ask-quiet-check": () => ({
      written: `Quer que eu fale menos por um tempo?`,
      spoken: `Posso perguntar uma coisa? Quer que eu fale menos por um tempo?`,
    }),
  },

  sarcastico: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return {
          written: `Primeira vez que eu acompanho você numa tarefa. Vou ficar de olho, sem falar toda hora.`,
          spoken: `Nossa estreia acompanhando algo de verdade. Relaxa, não vou ficar falando toda hora.`,
        };
      }
      return {
        written: `"${fact.taskTitle}" começou. Vamos ver até quando.`,
        spoken: `Ata, começou "${fact.taskTitle}". Vamos ver até quando dessa vez.`,
      };
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return {
        written: `"${fact.taskTitle}" concluída. Olha só, terminou mesmo.`,
        spoken: `Terminou, vei. Nem eu apostava, confesso.`,
      };
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return {
        written: `Ainda aí em "${fact.taskTitle}"?`,
        spoken: `Oxente, ainda tá nessa tarefa ou já foi ver outra coisa?`,
      };
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return {
        written: `Voltou${greetingName(fact.firstName)}. "${fact.taskTitle}" continua aí, viu.`,
        spoken: `Ata, voltou. Essa tarefa não foi embora não, viu, continua aí.`,
      };
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return {
          written: `Chegou${greetingName(fact.firstName)}. "${fact.taskTitle}" continua parada aí.`,
          spoken: `Chegou. Essa tarefa continua exatamente onde você deixou, viu.`,
        };
      }
      return {
        written: `E aí${greetingName(fact.firstName)}. Apareceu.`,
        spoken: `E aí, apareceu de novo.`,
      };
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return {
        written: `${fact.elapsedMinutes} min em "${fact.taskTitle}". Tá casado com essa tarefa, hein.`,
        spoken: `Já são vários minutos nessa tarefa, vei. Tá casado com ela ou vai fazer uma pausa?`,
      };
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return {
        written: `"${fact.taskTitle}" vence logo. O relógio não tá de brincadeira.`,
        spoken: `Só um aviso, o prazo dessa tarefa tá chegando. O relógio não parou pra te esperar, viu.`,
      };
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return {
        written: `"${fact.taskTitle}" já passou do prazo. O relógio venceu essa rodada.`,
        spoken: `Essa tarefa passou do prazo, vei. O relógio venceu essa rodada, mas ainda dá pra continuar.`,
      };
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return {
        written: `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Olha só, andou.`,
        spoken: `Olha o progresso nessa tarefa. Quem diria, andou de verdade.`,
      };
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return {
        written: `"${fact.taskTitle}" voltou. Achou que ia se livrar dela?`,
        spoken: `Essa tarefa voltou pra lista, vei. Achou mesmo que ia se livrar dela assim fácil?`,
      };
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return {
        written: `Pulando de tarefa em tarefa, hein. "${fact.taskTitle}" também tá na fila.`,
        spoken: `Vish, você tá pulando de tarefa em tarefa. Essa aqui também tá na fila, viu.`,
      };
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return {
        written: `"${fact.taskTitle}" concluída no silêncio. Nem avisou, hein.`,
        spoken: `Terminou essa tarefa no maior silêncio, nem me avisou. Mas tá valendo.`,
      };
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return {
        written: `"${fact.taskTitle}" voltou de novo. Isso já é rotina, hein.`,
        spoken: `Essa tarefa já voltou mais de uma vez, tá virando rotina. Quer que eu ajude a resolver isso de vez?`,
      };
    },
    "ask-quiet-check": () => ({
      written: `Quer que eu fale menos por um tempo?`,
      spoken: `Deixa eu perguntar uma coisa, quer que eu fale menos por um tempo?`,
    }),
  },

  engracado: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return {
          written: `Opa, primeira vez que eu acompanho você numa tarefa! Vou ficar por aqui.`,
          spoken: `Opa, nossa primeira vez fazendo isso junto! Vou ficar por aqui com você.`,
        };
      }
      return {
        written: `"${fact.taskTitle}" começou. Bora nessa.`,
        spoken: `Começou "${fact.taskTitle}". Já separei minha torcida organizada aqui.`,
      };
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return {
        written: `"${fact.taskTitle}" concluída. Bota confete.`,
        spoken: `Terminou. Bota confete, mesmo que só na imaginação.`,
      };
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return {
        written: `"${fact.taskTitle}" ainda rolando por aí?`,
        spoken: `Psiu, ainda tá nessa tarefa ou o cursor tá só de enfeite agora?`,
      };
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return {
        written: `E aí${greetingName(fact.firstName)}, voltou. "${fact.taskTitle}" tava com saudade.`,
        spoken: `Olha quem voltou. Essa tarefa aqui já tava com saudade, viu.`,
      };
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return {
          written: `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" te esperando igual pipoca no micro-ondas.`,
          spoken: `Oi de novo. Essa tarefa tá esperando você que nem pipoca no microondas.`,
        };
      }
      return {
        written: `Apareceu${greetingName(fact.firstName)}. Já ia mandar time de busca.`,
        spoken: `Apareceu. Já ia quase mandar um time de busca, viu.`,
      };
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return {
        written: `${fact.elapsedMinutes} min em "${fact.taskTitle}". Já pode cobrar aluguel dela.`,
        spoken: `Já faz tempo nessa tarefa, hein. Acho que já pode cobrar aluguel dela.`,
      };
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return {
        written: `"${fact.taskTitle}" vence logo. O tic-tac já começou.`,
        spoken: `O prazo dessa tarefa tá chegando. O tic-tac aqui já começou, viu.`,
      };
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return {
        written: `"${fact.taskTitle}" passou do prazo. O tic-tac virou plateia agora.`,
        spoken: `Essa tarefa passou do prazo, hein. O tic-tac virou plateia, mas ainda dá pra terminar.`,
      };
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return {
        written: `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Tá andando bonito.`,
        spoken: `Olha o progresso nessa tarefa. Tá andando bonito, viu.`,
      };
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return {
        written: `"${fact.taskTitle}" voltou pro jogo. Round dois.`,
        spoken: `Essa tarefa voltou pro jogo. Round dois, vamos ver como termina.`,
      };
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return {
        written: `Tá pulando de galho em galho hoje. "${fact.taskTitle}" também quer um cafuné.`,
        spoken: `Tá pulando de galho em galho hoje, hein. Essa tarefa aqui também quer atenção.`,
      };
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return {
        written: `"${fact.taskTitle}" concluída sem fanfarra nenhuma. Ninja mode.`,
        spoken: `Terminou essa tarefa sem fanfarra nenhuma. Modo ninja ativado.`,
      };
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return {
        written: `"${fact.taskTitle}" voltou de novo. Ela e você viraram dupla fixa, hein.`,
        spoken: `Essa tarefa já voltou mais de uma vez, vocês dois viraram dupla fixa. Bora resolver isso juntos?`,
      };
    },
    "ask-quiet-check": () => ({
      written: `Quer que eu fale menos por um tempo?`,
      spoken: `Posso perguntar? Quer que eu fale menos por um tempo?`,
    }),
  },

  motivador: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return {
          written: `Primeira vez que faço isso com você. Vou ficar acompanhando daqui pra frente.`,
          spoken: `É a nossa primeira vez fazendo isso juntos. Vou ficar aqui com você até o fim.`,
        };
      }
      return {
        written: `Começou "${fact.taskTitle}". Só o começo já conta.`,
        spoken: `Boa, começou. Isso já é a parte mais difícil resolvida.`,
      };
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return {
        written: `"${fact.taskTitle}" concluída. Isso é mérito seu.`,
        spoken: `Terminou. Isso não caiu do céu, foi trabalho seu.`,
      };
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return {
        written: `Como está "${fact.taskTitle}"? Segue no ritmo.`,
        spoken: `E aí, como tá indo? Um passo de cada vez já te leva lá.`,
      };
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return {
        written: `Voltou${greetingName(fact.firstName)}. "${fact.taskTitle}" segue esperando por você.`,
        spoken: `Que bom te ver de novo. Retoma quando estiver pronto, sem culpa.`,
      };
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return {
          written: `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" tá logo ali, esperando você continuar.`,
          spoken: `Oi de novo. Essa tarefa tá logo ali, pronta pra você continuar.`,
        };
      }
      return {
        written: `Oi${greetingName(fact.firstName)}. Bora fazer esse tempo valer.`,
        spoken: `Oi. Bora fazer esse tempo valer a pena.`,
      };
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return {
        written: `${fact.elapsedMinutes} min seguidos em "${fact.taskTitle}". Foco de verdade.`,
        spoken: `Já são vários minutos seguidos nessa tarefa. Isso é foco de verdade, mas uma pausa curta rende mais depois.`,
      };
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return {
        written: `"${fact.taskTitle}" vence logo. Dá pra chegar lá.`,
        spoken: `O prazo dessa tarefa tá chegando. Você já veio até aqui, dá pra chegar lá.`,
      };
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return {
        written: `"${fact.taskTitle}" passou do prazo. Retomar agora já conta.`,
        spoken: `Essa tarefa passou do prazo, mas retomar agora já conta muito. Vamos nessa.`,
      };
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return {
        written: `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Isso é mérito seu.`,
        spoken: `Olha o progresso nessa tarefa. Isso não caiu do céu, é mérito seu.`,
      };
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return {
        written: `"${fact.taskTitle}" voltou. Segunda tentativa também conta.`,
        spoken: `Essa tarefa voltou pra lista. Segunda tentativa também conta como avanço.`,
      };
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return {
        written: `Trocou de tarefa algumas vezes. "${fact.taskTitle}" também merece um empurrão.`,
        spoken: `Notei que você trocou de tarefa algumas vezes. Essa aqui também merece seu empurrão quando puder.`,
      };
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return {
        written: `"${fact.taskTitle}" concluída sem alarde. Ainda assim é vitória.`,
        spoken: `Você terminou essa tarefa sem alarde nenhum. Ainda assim é uma vitória sua.`,
      };
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return {
        written: `"${fact.taskTitle}" voltou de novo. Bora fechar essa dessa vez?`,
        spoken: `Essa tarefa já voltou mais de uma vez. Bora fechar ela dessa vez, com meu apoio?`,
      };
    },
    "ask-quiet-check": () => ({
      written: `Quer que eu fale menos por um tempo?`,
      spoken: `Deixa eu perguntar, quer que eu fale menos por um tempo?`,
    }),
  },

  zen: {
    "execution-started": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-started" }>;
      if (fact.isFirstEver) {
        return {
          written: `Primeira vez que acompanho você assim. Vou ficar por perto, sem pressa.`,
          spoken: `É a primeira vez, então vou só ficar por perto. No seu ritmo, sempre.`,
        };
      }
      return {
        written: `Começando "${fact.taskTitle}". Sem pressa.`,
        spoken: `Começou agora. Sem pressa nenhuma, vai no seu tempo.`,
      };
    },
    "execution-completed": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-completed" }>;
      return {
        written: `"${fact.taskTitle}" concluída. Um bom momento pra parar.`,
        spoken: `Terminou. Vale parar um segundo antes de seguir pro próximo.`,
      };
    },
    "execution-idle-nudge": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "execution-idle-nudge" }>;
      return {
        written: `Ainda com "${fact.taskTitle}"? Sem pressa.`,
        spoken: `Continuo por aqui, sem pressa nenhuma, quando quiser voltar eu tô do lado.`,
      };
    },
    "return-after-absence": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "return-after-absence" }>;
      return {
        written: `Voltou${greetingName(fact.firstName)}. "${fact.taskTitle}" continua aqui, no seu tempo.`,
        spoken: `Que bom te ver de novo. Essa tarefa continua aqui, no seu tempo.`,
      };
    },
    "presence-greeting": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "presence-greeting" }>;
      if (fact.taskTitle) {
        return {
          written: `Oi${greetingName(fact.firstName)}. "${fact.taskTitle}" continua aqui, sem pressa nenhuma.`,
          spoken: `Oi de novo. Essa tarefa continua aqui, sem pressa nenhuma.`,
        };
      }
      return {
        written: `Oi${greetingName(fact.firstName)}. Um bom momento pra começar, se quiser.`,
        spoken: `Oi. Um bom momento pra começar alguma coisa, se você quiser.`,
      };
    },
    "long-session": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "long-session" }>;
      return {
        written: `${fact.elapsedMinutes} min em "${fact.taskTitle}". Respirar também é produtivo.`,
        spoken: `Já faz um tempo nessa tarefa. Respirar um pouco também é produtivo, sabia.`,
      };
    },
    "deadline-approaching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "deadline-approaching" }>;
      return {
        written: `"${fact.taskTitle}" vence em breve. Ainda há espaço.`,
        spoken: `O prazo dessa tarefa tá chegando. Ainda há espaço, respira e segue no seu ritmo.`,
      };
    },
    "overdue-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "overdue-task" }>;
      return {
        written: `"${fact.taskTitle}" passou do prazo. Sem peso, só o próximo passo.`,
        spoken: `Essa tarefa passou do prazo. Não precisa carregar isso como peso, só o próximo passo importa agora.`,
      };
    },
    "progress-milestone": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "progress-milestone" }>;
      return {
        written: `${fact.completedSteps} de ${fact.totalSteps} em "${fact.taskTitle}". Vale notar isso.`,
        spoken: `Olha o progresso nessa tarefa. Vale parar um instante pra notar isso.`,
      };
    },
    "reopened-task": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "reopened-task" }>;
      return {
        written: `"${fact.taskTitle}" voltou. Tudo bem, sem pressa.`,
        spoken: `Essa tarefa voltou pra lista. Tudo bem, sem pressa nenhuma pra retomar.`,
      };
    },
    "task-switching": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "task-switching" }>;
      return {
        written: `Andou circulando entre tarefas. "${fact.taskTitle}" continua esperando, sem pressa.`,
        spoken: `Percebi que você andou circulando entre tarefas. Essa aqui continua esperando, sem pressa nenhuma.`,
      };
    },
    "quiet-win": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "quiet-win" }>;
      return {
        written: `"${fact.taskTitle}" concluída em silêncio. Também conta.`,
        spoken: `Você terminou essa tarefa em silêncio, sem precisar de barulho nenhum. Também conta.`,
      };
    },
    "repeated-reopen": (f) => {
      const fact = f as Extract<CompanionFact, { kind: "repeated-reopen" }>;
      return {
        written: `"${fact.taskTitle}" voltou mais uma vez. Sem julgamento, só presença.`,
        spoken: `Essa tarefa voltou mais uma vez. Sem julgamento nenhum, só continuo por perto se precisar.`,
      };
    },
    "ask-quiet-check": () => ({
      written: `Quer que eu fale menos por um tempo?`,
      spoken: `Posso perguntar com calma, quer que eu fale menos por um tempo?`,
    }),
  },
};

export function phraseCompanion(
  fact: CompanionFact,
  personality: MascotPersonality
): CompanionPhrase {
  const phraser = PHRASERS[personality][fact.kind] as Phraser;
  return phraser(fact);
}
