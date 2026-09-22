import type { InteractionPriority } from "@/features/mascot-pet/domain/interaction-policy";

import type { CompanionFact } from "./companion-phrasing";

/**
 * Configuração central de CADA tipo de interação do Companion - uma
 * ÚNICA fonte de verdade pra três decisões que antes viviam espalhadas:
 * prioridade (meaningful/casual, pra cota e pra não atropelar um balão
 * mais importante), elegibilidade pra IA generativa (ver
 * `generateCompanionInteraction`) e o rótulo em português que vai no
 * prompt da IA (`intentLabel`).
 *
 * Eventos "meaningful" (aconteceu uma coisa real e rara) usam a cota
 * generosa; "casual" (presença/ociosidade/bate-papo) usa a cota
 * pequena - ver `MAX_DAILY_MEANINGFUL_MESSAGES`/`MAX_DAILY_CASUAL_MESSAGES`
 * em `local-assistant-preferences.ts`.
 *
 * IA generativa é usada pra interações que se BENEFICIAM de variação
 * (são raras o suficiente pro custo/latência não importar, e repetem
 * pouco o bastante pra um texto fixo cansar rápido). Ociosidade e volta
 * de ausência ficam SEMPRE locais de propósito: podem, na prática,
 * repetir mais vezes numa mesma sessão do que os outros eventos, e a
 * resposta precisa ser instantânea (sem esperar uma chamada de IA só
 * pra dizer "ainda por aí?").
 */
export const INTENT_CONFIG: Record<
  CompanionFact["kind"],
  { priority: InteractionPriority; aiEligible: boolean; label: string }
> = {
  "execution-started": { priority: "meaningful", aiEligible: true, label: "início de tarefa" },
  "execution-completed": { priority: "meaningful", aiEligible: true, label: "conclusão de tarefa" },
  "deadline-approaching": { priority: "meaningful", aiEligible: true, label: "lembrete de prazo" },
  "overdue-task": { priority: "meaningful", aiEligible: true, label: "aviso de tarefa atrasada" },
  "progress-milestone": { priority: "meaningful", aiEligible: true, label: "reconhecimento de progresso" },
  "reopened-task": { priority: "casual", aiEligible: true, label: "reconhecimento de reabertura" },
  "presence-greeting": { priority: "casual", aiEligible: true, label: "saudação de presença" },
  "long-session": { priority: "casual", aiEligible: true, label: "observação de sessão longa" },
  "execution-idle-nudge": { priority: "casual", aiEligible: false, label: "check-in de ociosidade" },
  "return-after-absence": { priority: "casual", aiEligible: false, label: "reconhecimento de retorno" },
};
