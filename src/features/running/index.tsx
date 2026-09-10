import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";

import { History, RunningTracker, Totals } from "./components";

import styles from "./running.module.css";

export async function Running() {
  const { sessions, totals } = await getRunningFetcher().loadAll();

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Corrida</h1>
        <p className={styles.subheading}>Registre manualmente ou acompanhe ao vivo com GPS.</p>
      </div>

      <Totals totals={totals} />
      <RunningTracker />
      <History sessions={sessions} />
    </section>
  );
}
