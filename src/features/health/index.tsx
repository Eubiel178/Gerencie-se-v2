import { getHealthFetcher } from "@/features/health/data/get-health-fetcher";

import { HealthContent } from "./components";

import styles from "./styles.module.css";

// Reexports pra permitir `import { X } from "@/features/health"` em vez
// de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getHealthFetcher } from "./data/get-health-fetcher";

export async function Health() {
  const checkups = await getHealthFetcher().loadAll();

  return (
    <section className={styles.section}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Saúde preventiva</h1>
          <p className={styles.subheading}>Lembretes de check-ups, vacinas e exames de rotina.</p>
        </div>
      </header>

      <p className={styles.disclaimer}>
        Isso é só organização e lembrete — não é diagnóstico nem substitui
        acompanhamento médico. As datas de &ldquo;próximo&rdquo; são
        estimativas simples (última vez + intervalo que você definiu).
      </p>

      <HealthContent checkups={checkups} />
    </section>
  );
}
