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
  // Preenchido somente quando o livro é efetivamente concluído (status
  // "finished") — marca o instante real da conclusão, usada como timestamp
  // no Histórico. Nulo enquanto o livro não for concluído.
  finishedAt?: Date | null;
  addedAt: Date;
}
