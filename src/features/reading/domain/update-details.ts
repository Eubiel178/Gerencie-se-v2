import { IReadingItem } from "./reading-item";

/** Dados que pertencem ao livro em si, editados separadamente do registro rápido de página. */
export type UpdateReadingDetails = {
  updateDetails: (params: UpdateReadingDetails.Params) => Promise<IReadingItem | null>;
};

export namespace UpdateReadingDetails {
  export type Params = Pick<
    IReadingItem,
    "id" | "title" | "author" | "status" | "totalPages" | "currentPage" | "dailyReadingGoal"
  >;
}
