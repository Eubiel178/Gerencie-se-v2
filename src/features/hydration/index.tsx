import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";

import { HydrationTracker } from "./components";

import styles from "./hydration.module.css";

// Reexports pra permitir `import { X } from "@/features/hydration"` em
// vez de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getHydrationFetcher } from "./data/get-hydration-fetcher";

export async function Hydration() {
  const fetcher = getHydrationFetcher();

  const [today, week] = await Promise.all([fetcher.getToday(), fetcher.loadWeek()]);

  return (
    <section className={styles.section}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Hidratação</h1>
          <p className={styles.subheading}>Registre a água que você bebeu hoje.</p>
        </div>
      </header>

      <HydrationTracker today={today} week={week} />
    </section>
  );
}
