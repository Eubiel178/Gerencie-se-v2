export type CreateConnection = {
  invite: (params: CreateConnection.Params) => Promise<{ id: string; error: string | null }>;
};

export namespace CreateConnection {
  export type Params = { email: string };
}
