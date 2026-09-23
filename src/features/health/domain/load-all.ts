import { IHealthCheckup } from "./health-checkup";

export type LoadAllHealthCheckups = {
  loadAll: () => Promise<LoadAllHealthCheckups.Model>;
};

export namespace LoadAllHealthCheckups {
  export type Model = IHealthCheckup[];
}
