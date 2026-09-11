import { IReadingItem, ReadingStatus } from "./domain";

export interface ReadingItemFilters {
  searchQuery: string;
  statusFilter: ReadingStatus | "all";
}

/** Função pura — mesma ideia de `features/tasks/filter-tasks.ts`. Busca
 * olha título E autor (quando existir), sempre "contém". */
export function filterReadingItems(items: IReadingItem[], filters: ReadingItemFilters): IReadingItem[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (query) {
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesAuthor = item.author?.toLowerCase().includes(query) ?? false;
      if (!matchesTitle && !matchesAuthor) return false;
    }

    if (filters.statusFilter !== "all" && item.status !== filters.statusFilter) return false;

    return true;
  });
}
