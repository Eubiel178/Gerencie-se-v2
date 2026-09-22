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

export type CheckCompanionBudget = {
  /** Checagem SÓ DE LEITURA (nunca consome cota) - usada como gate ANTES
   * de gastar uma chamada de IA cara: sem sentido gerar uma interação se
   * a cota já está esgotada mesmo. `registerCompanionMessageShown`
   * continua sendo o commit de verdade, chamado DEPOIS de decidir o
   * texto final (local ou IA). */
  hasCompanionBudget: (priority: CompanionInteractionPriority) => Promise<boolean>;
};

export type RegisterCompanionMessageShown = {
  /** Mesma ideia de `registerInsightShown`, mas com cota PRÓPRIA — ver
   * `assistantCompanionDailyCount`/`assistantCompanionMeaningfulCount`
   * em `src/db/schema.ts`. Duas cotas independentes por `priority`:
   * "meaningful" (começou/concluiu tarefa, prazo) tem um teto bem maior
   * que "casual" (saudação, sessão longa, ociosidade) - um evento
   * importante nunca é bloqueado só porque o Companion já falou algo
   * casual antes no dia. */
  registerCompanionMessageShown: (
    text: string,
    priority: CompanionInteractionPriority
  ) => Promise<{ allowed: boolean }>;
};
