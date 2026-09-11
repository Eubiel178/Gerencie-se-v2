import { IHabit } from "./domain";

export type HabitStatusFilter = "all" | "done-today" | "pending-today";
export type HabitFrequencyFilter = "all" | IHabit["frequency"];

export interface HabitFilters {
  searchQuery: string;
  frequencyFilter: HabitFrequencyFilter;
  statusFilter: HabitStatusFilter;
}

/** Função pura — mesma ideia de `features/tasks/filter-tasks.ts`. Busca por
 * nome é sempre "contém" (case-insensitive). */
export function filterHabits(habits: IHabit[], filters: HabitFilters): IHabit[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return habits.filter((habit) => {
    if (query && !habit.title.toLowerCase().includes(query)) return false;
    if (filters.frequencyFilter !== "all" && habit.frequency !== filters.frequencyFilter) return false;

    if (filters.statusFilter === "done-today" && !habit.completedToday) return false;
    if (filters.statusFilter === "pending-today" && habit.completedToday) return false;

    return true;
  });
}
