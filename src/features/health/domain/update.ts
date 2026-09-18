import { IHealthCheckup } from "./health-checkup";

export type UpdateHealthCheckup = {
  update: (params: UpdateHealthCheckup.Params) => Promise<void>;
};

export namespace UpdateHealthCheckup {
  export type Params = Pick<
    IHealthCheckup,
    "id" | "title" | "category" | "intervalDays" | "notes"
  >;
}

// Registra que o cuidado foi feito hoje — atualiza `lastDoneAt`, base
// pro cálculo do próximo vencimento.
export type MarkHealthCheckupDone = {
  markDone: (params: MarkHealthCheckupDone.Params) => Promise<{ lastDoneAt: string }>;
};

export namespace MarkHealthCheckupDone {
  export type Params = Pick<IHealthCheckup, "id">;
}
