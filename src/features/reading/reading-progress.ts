export interface ReadingProgress {
  progressPercent: number;
  remainingPages: number;
}

/**
 * O contador de páginas é a fonte de verdade quando ambos os campos existem.
 * Itens antigos continuam usando `progressPercent`, que já era persistido.
 */
export function getReadingProgress(
  currentPage: number,
  totalPages: number
): ReadingProgress {
  const safeCurrentPage = Math.min(Math.max(currentPage, 0), totalPages);

  return {
    progressPercent: Math.round((safeCurrentPage / totalPages) * 100),
    remainingPages: totalPages - safeCurrentPage,
  };
}
