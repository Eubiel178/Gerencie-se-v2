// Datas ("YYYY-MM-DD") em que QUALQUER hábito ativo do usuário (dono ou
// compartilhado) foi concluído dentro do período — usado só pra montar o
// gráfico de conclusões por semana em Estatísticas. Não distingue qual
// hábito foi concluído (não importa pra essa contagem agregada).
export type LoadHabitCompletionsInRange = {
  loadCompletionDatesInRange: (since: Date) => Promise<string[]>;
};
