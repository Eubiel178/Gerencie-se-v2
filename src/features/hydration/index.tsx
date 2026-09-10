import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";

import { HydrationTracker } from "./components";

import styles from "./hydration.module.css";

export async function Hydration() {
  const fetcher = getHydrationFetcher();

  const [today, week] = await Promise.all([fetcher.getToday(), fetcher.loadWeek()]);

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Hidratação</h1>
        <p className={styles.subheading}>Registre a água que você bebeu hoje.</p>
      </div>

      <HydrationTracker today={today} week={week} />
    </section>
  );
}
