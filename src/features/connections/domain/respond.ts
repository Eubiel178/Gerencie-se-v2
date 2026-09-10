export type RespondConnection = {
  respond: (params: RespondConnection.Params) => Promise<void>;
};

export namespace RespondConnection {
  export type Params = { id: string; accept: boolean };
}

export type DeleteConnection = {
  delete: (params: DeleteConnection.Params) => Promise<void>;
};

export namespace DeleteConnection {
  export type Params = { id: string };
}
