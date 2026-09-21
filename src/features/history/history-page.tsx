"use client";

import { useState } from "react";

import { EmptyState } from "@/components";

import { HistoryFilters } from "./components/history-filters";
import { HistoryList } from "./components/history-list";
import { HistoryEntry } from "./domain";
import styles from "./history-page.module.css";

interface HistoryPageProps {
  initialEntries: HistoryEntry[];
  initialPeriod: "7d" | "30d";
  initialType: "all" | "task" | "goal" | "habit" | "routine" | "reading";
}

export function HistoryPage({
  initialEntries,
  initialPeriod,
  initialType,
}: HistoryPageProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>(initialEntries);
  const [period, setPeriod] = useState<"7d" | "30d">(initialPeriod);
  const [type, setType] = useState<
    "all" | "task" | "goal" | "habit" | "routine" | "reading"
  >(initialType);
  const [isLoading, setIsLoading] = useState(false);

  // Recebe os valores explicitamente em vez de ler `period`/`type` do
  // estado — chamada logo depois de `setPeriod`/`setType`, e o React
  // ainda não teria aplicado essa atualização nesse mesmo tick, então o
  // fetch pegaria o filtro ANTERIOR em vez do que acabou de ser escolhido.
  async function reload(nextPeriod: typeof period, nextType: typeof type) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/history?period=${nextPeriod}&type=${nextType}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Failed to load history");
      const data = await response.json();
      setEntries(data);
    } catch {
      // Mantém o estado anterior em caso de erro de rede.
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Histórico</h1>
          <p className={styles.subheading}>O que você já realizou</p>
        </div>
      </div>

      <HistoryFilters
        period={period}
        type={type}
        onPeriodChange={(value) => {
          setPeriod(value);
          reload(value, type);
        }}
        onTypeChange={(value) => {
          setType(value);
          reload(period, value);
        }}
      />

      {isLoading ? (
        <p className={styles.empty}>Carregando...</p>
      ) : entries.length === 0 ? (
        <EmptyState variant="inline">
          Nada por aqui ainda. Quando você concluir tarefas, hábitos, objetivos,
          rotina ou livros, eles aparecerão aqui.
        </EmptyState>
      ) : (
        <HistoryList entries={entries} />
      )}
    </section>
  );
}