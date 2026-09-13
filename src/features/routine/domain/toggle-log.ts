// Marca/desmarca a conclusão de um item de rotina num dia específico.
// Idempotente por design (a chave primária de `routine_item_log` é
// `routineItemId` + `date`): se já existe um registro pro dia, remove
// (desmarca); se não existe, cria (marca). Mesmo raciocínio de
// `ToggleHabitLog` — nunca aceita "concluído: true/false" do chamador, só
// alterna.
export type ToggleRoutineItemLog = {
  toggleLog: (params: ToggleRoutineItemLog.Params) => Promise<ToggleRoutineItemLog.Result>;
};

export namespace ToggleRoutineItemLog {
  export type Params = {
    routineItemId: string;
    date: string; // "YYYY-MM-DD"
  };

  export type Result = { completed: boolean };
}
