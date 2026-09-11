import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";

import { ReadingList, Recommendations } from "./components";

import styles from "./reading.module.css";

// Reexports pra permitir `import { X } from "@/features/reading"` em
// vez de caminhos profundos.
export * from "./domain";
export * from "./actions";
export * from "./filter-reading-items";
export * from "./recommendations";
export { getReadingFetcher } from "./data/get-reading-fetcher";

export async function Reading() {
  const items = await getReadingFetcher().loadAll();

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Leitura</h1>
        <p className={styles.subheading}>Sua lista de livros e o progresso de cada um.</p>
      </div>

      <ReadingList items={items} />
      <Recommendations />
    </section>
  );
}
