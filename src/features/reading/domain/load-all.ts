import { IReadingItem } from "./reading-item";

export type LoadAllReadingItems = {
  loadAll: () => Promise<LoadAllReadingItems.Model>;
};

export namespace LoadAllReadingItems {
  export type Model = IReadingItem[];
}
