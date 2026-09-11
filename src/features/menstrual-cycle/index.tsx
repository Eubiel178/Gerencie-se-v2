import { getCycleFetcher } from "@/features/menstrual-cycle/data/get-cycle-fetcher";

import { AddEntryForm, EstimatePanel, History } from "./components";

import styles from "./cycle.module.css";

// Reexports pra permitir `import { X } from "@/features/menstrual-cycle"`
// em vez de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getCycleFetcher } from "./data/get-cycle-fetcher";

export async function MenstrualCycle() {
  const { entries, estimate } = await getCycleFetcher().loadAll();

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Ciclo menstrual</h1>
        <p className={styles.subheading}>Registre o início de cada ciclo e acompanhe estimativas.</p>
      </div>

      <p className={styles.disclaimer}>
        Tudo aqui é estimativa, calculada a partir dos seus próprios registros
        — nunca um diagnóstico, e nunca uma certeza. Quanto mais ciclos você
        registrar, mais precisa a estimativa tende a ficar.
      </p>

      <EstimatePanel estimate={estimate} />
      <AddEntryForm />
      <History entries={entries} />
    </section>
  );
}
