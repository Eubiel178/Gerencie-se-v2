export type AssistantMoodTone = "info" | "success" | "warning";

/**
 * Uma "fala" do assistente: sempre gerada a partir de dado real do usuário
 * (ver `RuleBasedAssistantProvider`), nunca uma frase motivacional
 * genérica solta. `id` identifica o TIPO de insight (não uma instância) —
 * usado só para decidir qual mensagem tem prioridade quando várias se
 * aplicam ao mesmo tempo.
 */
export interface IAssistantMessage {
  id: string;
  tone: AssistantMoodTone;
  text: string;
}
