import { IHealthCheckup } from "./health-checkup";

export type CreateHealthCheckup = {
  create: (params: CreateHealthCheckup.Params) => Promise<IHealthCheckup>;
};

export namespace CreateHealthCheckup {
  export type Params = Pick<IHealthCheckup, "title" | "category" | "intervalDays" | "notes">;
}
