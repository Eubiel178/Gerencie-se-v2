// "Começar também conta": um pequeno reconhecimento (XP) por só começar
// uma tarefa, não só por terminá-la. Pausar ou retomar não remove o XP
// histórico (ver `LocalTask.setWorkStatus`).
export type MarkTaskStarted = {
  markStarted: (params: MarkTaskStarted.Params) => Promise<MarkTaskStarted.Result>;
};

export namespace MarkTaskStarted {
  export type Params = { id: string };
  export type Result = { xpEarned: number };
}
