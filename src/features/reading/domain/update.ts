import { IReadingItem } from "./reading-item";

export type UpdateReadingItem = {
  update: (params: UpdateReadingItem.Params) => Promise<void>;
};

export namespace UpdateReadingItem {
  export type Params = Pick<IReadingItem, "id" | "status" | "progressPercent">;
}
