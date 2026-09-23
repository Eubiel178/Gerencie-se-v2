import type { MascotPersonality } from "@/features/focus/domain";

import { type CompanionMove, QUIET_SAFE_MOVES, SITUATION_ELIGIBLE_MOVES } from "./companion-moves";
import { getPersonalityBehavior } from "./companion-personality-profile";
import type { CompanionFact } from "./companion-phrasing";

export interface CandidateMovesInput {
  situation: CompanionFact["kind"];
  personality: MascotPersonality;
  /** Limite de espaço ativo agora (`now < quietUntil`, calculado por
   * quem chama) — clampa pra movimentos discretos e, se a prioridade for
   * casual, esvazia por completo (ver `QUIET_SAFE_MOVES`). */
  isQuiet: boolean;
  /** true = evento raro/importante (nunca totalmente silenciado por
   * limite de espaço, só rebaixado de tom). */
  isMeaningful: boolean;
  /** Um "agora não"/"não, obrigado" recente ainda dentro da janela de
   * recuo desta personalidade — tira oferecer-ajuda/sugerir/iniciar da
   * mesa até a janela passar (observar/reconhecer/comemorar continuam). */
  inRecoveryWindow: boolean;
}

const RECOVERY_EXCLUDED_MOVES: readonly CompanionMove[] = ["oferecer-ajuda", "sugerir", "iniciar"];

/**
 * Calcula o conjunto FINAL de movimentos elegíveis pra uma situação —
 * pura, determinística, testável sem rede/DB. Este é o "teto" que tanto
 * a escolha determinística quanto a IA (quando elegível) precisam
 * respeitar; nada fora daqui chega a virar uma interação, não importa o
 * que a IA "preferisse" dizer.
 *
 * Devolve a lista NA ORDEM DE PREFERÊNCIA da personalidade (primeiro =
 * escolha determinística padrão) — pode vir vazia (situação sem nada
 * elegível agora = silêncio é o resultado correto, não um bug).
 */
export function computeCandidateMoves(input: CandidateMovesInput): CompanionMove[] {
  const situationMoves = SITUATION_ELIGIBLE_MOVES[input.situation];
  const profile = getPersonalityBehavior(input.personality);

  let pool = situationMoves;

  if (input.isQuiet) {
    if (!input.isMeaningful) return [];
    pool = pool.filter((m) => QUIET_SAFE_MOVES.includes(m));
  }

  if (input.inRecoveryWindow) {
    pool = pool.filter((m) => !RECOVERY_EXCLUDED_MOVES.includes(m));
  }

  // Ordena pela preferência da personalidade; movimentos da situação que
  // a personalidade nem lista na preferência (raro, mas possível) vão
  // pro fim, na ordem original da situação.
  const preferenceIndex = new Map(profile.movePreference.map((m, i) => [m, i]));
  return [...pool].sort((a, b) => (preferenceIndex.get(a) ?? 99) - (preferenceIndex.get(b) ?? 99));
}
