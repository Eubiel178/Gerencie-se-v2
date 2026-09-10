import { IHealthCheckup } from "./health-checkup";

export type DeleteHealthCheckup = {
  delete: (params: DeleteHealthCheckup.Params) => Promise<void>;
};

export namespace DeleteHealthCheckup {
  export type Params = Pick<IHealthCheckup, "id">;
}
