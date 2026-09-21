/**
 * Histórico é uma VIEW somente de leitura sobre dados já persistidos nos
 * domínios existentes. Não há nova fonte de verdade, nova tabela, store
 * paralela ou localStorage — cada entrada deriva diretamente de uma linha
 * real que já foi salva em sua respectiva tabela de domínio.
 *
 * A agregação acontece server-side (ver `local-history.ts`), normalizando
 * os resultados em uma única lista ordenada por `completedAt` decrescente.
 */

export type HistoryEntryType =
  | "task"
  | "goal"
  | "habit"
  | "routine"
  | "reading";

export interface HistoryEntry {
  id: string;
  type: HistoryEntryType;
  title: string;
  completedAt: Date;
  /** Metadados secundários — só preenchidos quando agregam informação
   * útil (ex.: progresso do objetivo, autor do livro). Nunca duplica o
   * título ou o tipo. */
  metadata?: HistoryEntryMetadata;
}

export interface HistoryEntryMetadata {
  goalProgress?: number;
  author?: string | null;
}

export type HistoryFilter = "all" | HistoryEntryType;

export type HistoryPeriod = "7d" | "30d" | "all";

export interface HistoryQuery {
  period: HistoryPeriod;
  type: HistoryFilter;
}

export interface HistoryResult {
  entries: HistoryEntry[];
  /** Indica se houve mais resultados além do limite retornado, para
   * permitir "carregar mais" sem reload de página. */
  hasMore: false;
}