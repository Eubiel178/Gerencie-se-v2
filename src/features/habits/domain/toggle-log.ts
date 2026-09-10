// Marca/desmarca a conclusão de um hábito num dia específico. Idempotente
// por design (a chave primária de `habit_log` é `habitId` + `date`): se já
// existe um registro pro dia, remove (desmarca); se não existe, cria
// (marca). Nunca aceita "concluído: true/false" do chamador — só alterna,
// evitando um estado impossível de "marcar duas vezes = ainda marcado".
export type ToggleHabitLog = {
  toggleLog: (params: ToggleHabitLog.Params) => Promise<ToggleHabitLog.Result>;
};

export namespace ToggleHabitLog {
  export type Params = {
    habitId: string;
    date: string; // "YYYY-MM-DD"
  };

  export type Result = { completed: boolean };
}
