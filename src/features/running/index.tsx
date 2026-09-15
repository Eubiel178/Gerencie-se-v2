import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";

import { History, RunningTracker, Totals } from "./components";

import styles from "./running.module.css";

// Reexports pra permitir `import { X } from "@/features/running"` em
// vez de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getRunningFetcher } from "./data/get-running-fetcher";

export async function Running() {
  const { sessions, totals } = await getRunningFetcher().loadAll();

  return (
    <section className={styles.section}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Corrida</h1>
          <p className={styles.subheading}>Registre manualmente ou acompanhe ao vivo com GPS.</p>
        </div>
      </header>

      <Totals totals={totals} />
      <RunningTracker />
      <History sessions={sessions} />
    </section>
  );
}
