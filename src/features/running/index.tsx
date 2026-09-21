import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";

import { RunningContent } from "./components";
import styles from "./styles.module.css";

export async function Running() {
  const { sessions } = await getRunningFetcher().loadAll();

  return (
    <section className={styles.section}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Corrida</h1>
          <p className={styles.subheading}>Registre manualmente ou acompanhe ao vivo com GPS.</p>
        </div>
      </header>

      <RunningContent sessions={sessions} />
    </section>
  );
}
