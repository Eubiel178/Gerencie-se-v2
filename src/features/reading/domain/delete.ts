import { IReadingItem } from "./reading-item";

export type DeleteReadingItem = {
  delete: (params: DeleteReadingItem.Params) => Promise<void>;
};

export namespace DeleteReadingItem {
  export type Params = Pick<IReadingItem, "id">;
}
