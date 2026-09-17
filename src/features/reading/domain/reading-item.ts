export type ReadingStatus = "want_to_read" | "reading" | "finished";

export interface IReadingItem {
  id: string;
  userId: string;
  title: string;
  author?: string | null;
  status: ReadingStatus;
  progressPercent: number;
  totalPages?: number | null;
  currentPage?: number | null;
  dailyReadingGoal?: number | null;
  addedAt: Date;
}
