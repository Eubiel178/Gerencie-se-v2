import type { MascotPersonality } from "@/features/focus/domain";

import type { CompanionMove } from "./companion-moves";

/**
 * O que muda ENTRE personalidades além do vocabulário — cada campo aqui
 * afeta uma DECISÃO real (quais movimentos essa personalidade prefere,
 * se ela usa humor, quão cedo pergunta se deve falar menos, quanto
 * tempo leva pra voltar a oferecer ajuda depois de um "agora não"), não
 * só a frase final. Isto é o que faz "afetuoso" e "motivador" terem
 * comportamento genuinamente diferente, não só adjetivos diferentes
 * pro mesmo comportamento.
 */
export interface PersonalityBehaviorProfile {
  /** Ordem de preferência entre os movimentos candidatos de uma
   * situação — critério de escolha determinística (primeiro da lista
   * que sobreviver aos filtros vence) quando a IA não decide. */
  movePreference: CompanionMove[];
  /** Elegível pra leveza/humor nas situações que permitem (nunca nas
   * delicadas — atraso, reabertura — isso é filtrado à parte). */
  humorEligible: boolean;
  /** Quantos fechamentos manuais casuais consecutivos até o Companion
   * perguntar se deve falar menos (`ask-quiet-check`). Menor = pergunta
   * mais cedo. */
  dismissThresholdBeforeAsking: number;
  /** Multiplica a janela padrão de recuo depois de um "agora não"/"não,
   * obrigado" antes de voltar a candidatar oferecer-ajuda/sugerir/
   * iniciar (observar/reconhecer/comemorar continuam sempre
   * disponíveis - reconhecer não é oferecer). Maior = demora mais pra
   * insistir de novo. */
  recoveryMultiplier: number;
}

export const PERSONALITY_BEHAVIOR: Record<MascotPersonality, PersonalityBehaviorProfile> = {
  // Cuidadoso com a demonstração de proximidade, mas rápido a notar
  // quando está incomodando — pergunta cedo se deve recuar, e quando
  // recua, dá mais espaço de verdade antes de tentar de novo.
  afetuoso: {
    movePreference: ["oferecer-ajuda", "reconhecer", "comemorar", "observar", "sugerir", "iniciar", "perguntar", "dar-espaco"],
    humorEligible: false,
    dismissThresholdBeforeAsking: 2,
    recoveryMultiplier: 1.4,
  },
  // Comenta mais do que oferece, humor seco liberado — mas some rápido
  // se perceber que não é bem-vindo, e some de vez (baixa insistência).
  sarcastico: {
    movePreference: ["observar", "reconhecer", "comemorar", "oferecer-ajuda", "sugerir", "iniciar", "perguntar", "dar-espaco"],
    humorEligible: true,
    dismissThresholdBeforeAsking: 2,
    recoveryMultiplier: 0.7,
  },
  // O mais falante por padrão (tolera mais fechamentos antes de
  // perguntar), gosta de comemorar e observar com leveza.
  engracado: {
    movePreference: ["observar", "comemorar", "reconhecer", "sugerir", "oferecer-ajuda", "iniciar", "perguntar", "dar-espaco"],
    humorEligible: true,
    dismissThresholdBeforeAsking: 3,
    recoveryMultiplier: 0.9,
  },
  // Empurra mais antes de recuar (maior tolerância a fechamentos) e
  // volta a insistir mais rápido depois de um "não" — sem humor, que
  // dilui a energia que é a marca dessa personalidade.
  motivador: {
    movePreference: ["oferecer-ajuda", "comemorar", "sugerir", "observar", "reconhecer", "iniciar", "perguntar", "dar-espaco"],
    humorEligible: false,
    dismissThresholdBeforeAsking: 3,
    recoveryMultiplier: 0.8,
  },
  // O mais rápido a notar que talvez devesse ficar quieto (menor
  // limite antes de perguntar) e o que mais demora a voltar a insistir
  // depois de recuar — silêncio é uma resposta válida, não uma falha.
  zen: {
    movePreference: ["dar-espaco", "observar", "reconhecer", "comemorar", "oferecer-ajuda", "sugerir", "iniciar", "perguntar"],
    humorEligible: false,
    dismissThresholdBeforeAsking: 1,
    recoveryMultiplier: 1.8,
  },
};

export function getPersonalityBehavior(personality: MascotPersonality): PersonalityBehaviorProfile {
  return PERSONALITY_BEHAVIOR[personality];
}
