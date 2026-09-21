// Datas ("YYYY-MM-DD") em que QUALQUER hábito ativo do usuário (dono ou
// compartilhado) foi concluído dentro do período — usado só pra montar o
// gráfico de conclusões por semana em Estatísticas. Não distingue qual
// hábito foi concluído (não importa pra essa contagem agregada).
export type LoadHabitCompletionsInRange = {
  loadCompletionDatesInRange: (since: Date) => Promise<string[]>;
};

/**
 * Ocorrências concluídas de hábitos com identidade (título) — usado pelo
 * Histórico, onde cada dia é uma entrada independente e o nome do hábito
 * é parte do que o usuário precisa ver. Diferente de
 * `loadCompletionDatesInRange` (que retorna só datas, sem título), esta
 * consulta traz o título do hábito junto.
 */
export type LoadHabitCompletionsWithIdentity = {
  loadHabitCompletionsInRange(since: Date): Promise<HabitCompletionEntry[]>;
};

export type HabitCompletionEntry = {
  habitId: string;
  habitTitle: string;
  date: string; // "YYYY-MM-DD"
  completedAt: Date;
};