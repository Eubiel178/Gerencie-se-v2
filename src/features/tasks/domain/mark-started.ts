// "Começar também conta": um pequeno reconhecimento (XP) por só começar
// uma tarefa, não só por terminá-la — uma vez marcada, nunca desmarca
// (ver `LocalTask.markStarted`, que ignora silenciosamente uma segunda
// chamada em vez de recontar XP).
export type MarkTaskStarted = {
  markStarted: (params: MarkTaskStarted.Params) => Promise<MarkTaskStarted.Result>;
};

export namespace MarkTaskStarted {
  export type Params = { id: string };
  export type Result = { xpEarned: number };
}
