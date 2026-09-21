import { getCycleFetcher } from "@/features/menstrual-cycle/data/get-cycle-fetcher";

import { CycleContent } from "./components";
import styles from "./styles.module.css";

export async function MenstrualCycle() {
  const { entries, estimate } = await getCycleFetcher().loadAll();

  return (
    <section className={styles.section}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.heading}>Ciclo menstrual</h1>
          <p className={styles.subheading}>Registre o início de cada ciclo e acompanhe estimativas.</p>
        </div>
      </header>

      <p className={styles.disclaimer}>
        Tudo aqui é estimativa, calculada a partir dos seus próprios registros
        — nunca um diagnóstico, e nunca uma certeza. Quanto mais ciclos você
        registrar, mais precisa a estimativa tende a ficar.
      </p>

      <CycleContent entries={entries} estimate={estimate} />
    </section>
  );
}
