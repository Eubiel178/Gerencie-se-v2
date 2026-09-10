import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

import { History, Timer } from "./components";

import styles from "./focus.module.css";

export async function Focus() {
  const focusFetcher = getFocusFetcher();
  const mascotFetcher = getMascotFetcher();

  const [activeSession, mascot, history] = await Promise.all([
    focusFetcher.getActive(),
    mascotFetcher.getMascot(),
    focusFetcher.loadHistory(),
  ]);

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Focus Timer</h1>
        <p className={styles.subheading}>Escolha um tempo e mergulhe em uma única tarefa.</p>
      </div>

      <Timer initialSession={activeSession} mascot={mascot} />

      <div>
        <h2 className={styles.historyTitle}>Histórico</h2>
        <History sessions={history} />
      </div>
    </section>
  );
}
