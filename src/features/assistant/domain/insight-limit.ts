// "Limite de interrupções" (Modo Assistido): mesmo com uma condição real
// pra avisar, o JARVIS não pode ficar auto-abrindo o balão de fala toda
// hora — ver `MAX_DAILY_INSIGHTS` em `local-assistant-preferences.ts`.
export type RegisterInsightShown = {
  /** Registra mais uma mensagem contextual auto-aberta hoje e diz se
   * ainda havia cota pra isso. Chamar só quando existe mesmo uma
   * mensagem candidata — nunca "gasta" cota à toa. Repetir o MESMO texto
   * da última vez nunca consome cota (a mesma condição persistindo entre
   * navegações não deve contar como uma nova interrupção). */
  registerInsightShown: (text: string) => Promise<{ allowed: boolean }>;
};

export type CompanionInteractionPriority = "meaningful" | "casual";

export interface CompanionFrequencyCheck {
  priority: CompanionInteractionPriority;
  /** Ver `frequencyBypass` em `companion-interaction-config.ts`. */
  frequencyBypass: boolean;
  /** Se o usuário está conversando ativamente no chat do Widget agora -
   * ver `isEngagedViaChat()` em `use-tasks-companion.ts`. O histórico de
   * chat vive só no `localStorage` do cliente, então o servidor não tem
   * como saber isso sozinho - precisa vir de quem chama. */
  isEngagedViaChat: boolean;
}

export type CheckCompanionBudget = {
  /** Checagem SÓ DE LEITURA (nunca grava nada) - usada como gate ANTES
   * de gastar uma chamada de IA cara: sem sentido gerar uma interação se
   * o intervalo mínimo desde a última fala ainda não passou.
   * `registerCompanionMessageShown` continua sendo o commit de verdade,
   * chamado DEPOIS de decidir o texto final (local ou IA) - ver
   * `companion-frequency.ts` pra regra real de quando falar. */
  hasCompanionBudget: (check: CompanionFrequencyCheck) => Promise<boolean>;
};

export type CompanionBoundary = {
  /** `null` = sem limite de espaço ativo. Um valor no passado equivale a
   * `null` na prática (já expirou) - quem chama nunca precisa comparar
   * com `Date.now()` sozinho, `hasActiveQuiet` já faz isso. */
  getCompanionQuietUntil: () => Promise<Date | null>;
  /** Só nasce de uma resposta explícita à pergunta do próprio Companion
   * (`ask-quiet-check`) - nunca inferido de fechamentos manuais do
   * balão. Não existe "cancelar antes da hora": expira sozinho. */
  setCompanionQuietUntil: (quietUntil: Date) => Promise<void>;
};

export type RegisterCompanionMessageShown = {
  /** Commit de verdade: recheca a mesma regra de `hasCompanionBudget`
   * contra o estado MAIS FRESCO possível (protege contra corrida entre
   * duas chamadas quase simultâneas) e, se permitido, grava
   * `assistantCompanionLastSpokeAt = agora` - ver `companion-frequency.ts`.
   * Repetir o MESMO texto de novo no mesmo dia sempre é permitido sem
   * reavaliar o intervalo (a mesma condição persistindo entre
   * navegações não deveria contar como uma nova interrupção). */
  registerCompanionMessageShown: (
    text: string,
    check: CompanionFrequencyCheck
  ) => Promise<{ allowed: boolean }>;
};
