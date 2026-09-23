import { IReadingItem } from "./reading-item";

export type UpdateReadingCurrentPage = {
  updateCurrentPage: (
    params: UpdateReadingCurrentPage.Params
  ) => Promise<UpdateReadingCurrentPage.Result>;
};

export namespace UpdateReadingCurrentPage {
  export type Params = Pick<IReadingItem, "id" | "currentPage"> & {
    currentPage: number;
  };

  export type Result =
    | { status: "updated"; item: IReadingItem }
    | { status: "not-found" }
    | { status: "total-pages-required" }
    | { status: "page-exceeds-total" };
}
