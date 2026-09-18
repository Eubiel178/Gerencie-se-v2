import { IConnection } from "./connection";

export type CreateConnection = {
  invite: (params: CreateConnection.Params) => Promise<{
    id: string;
    error: string | null;
    connection?: IConnection;
  }>;
};

export namespace CreateConnection {
  export type Params = { email: string };
}
