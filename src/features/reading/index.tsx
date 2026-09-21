import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";

import { ReadingList } from "./components";
import styles from "./components/shared/styles.module.css";

export async function Reading() {
  const items = await getReadingFetcher().loadAll();

  return (
    <section className={styles.section}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Leitura</h1>
          <p className={styles.subheading}>Guarde o que quer ler e registre seu avanço sem perder o fio.</p>
        </div>
      </header>

      <ReadingList items={items} />
    </section>
  );
}
