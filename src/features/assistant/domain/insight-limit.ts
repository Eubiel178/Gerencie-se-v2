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
