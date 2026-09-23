import { IConnection } from "./connection";

export type LoadAllConnections = {
  loadAll: () => Promise<LoadAllConnections.Model>;
};

export namespace LoadAllConnections {
  export type Model = IConnection[];
}

/** Vínculos ACEITOS apenas — usado pelo seletor de "compartilhar com" nos
 * formulários de tarefa/rotina/hábito/meta. Cada item: id da OUTRA pessoa
 * (nunca o meu) + nome/e-mail pra exibir. */
export type LoadAcceptedConnections = {
  loadAccepted: () => Promise<LoadAcceptedConnections.Model>;
};

export namespace LoadAcceptedConnections {
  export type Model = { userId: string; label: string }[];
}
