import { IReadingItem } from "./reading-item";

export type CreateReadingItem = {
  create: (params: CreateReadingItem.Params) => Promise<IReadingItem>;
};

export namespace CreateReadingItem {
  export type Params = Pick<
    IReadingItem,
    "title" | "author" | "totalPages" | "currentPage" | "dailyReadingGoal"
  >;
}
