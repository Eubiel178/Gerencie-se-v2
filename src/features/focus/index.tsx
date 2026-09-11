import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

import { History, Timer } from "./components";

import styles from "./focus.module.css";

// Reexports pra permitir `import { X } from "@/features/focus"` em vez
// de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getFocusFetcher, getMascotFetcher } from "./data/get-focus-fetcher";
export { MascotSprite } from "./components/mascot-sprite";
export { MascotSettings } from "./components/mascot-settings";

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
