"use client";

import { useState } from "react";

import { Input } from "@/components";

import styles from "./export-data-panel.module.css";

const ENTITY_OPTIONS = [
  { label: "Tarefas", value: "tasks" },
  { label: "Hábitos", value: "habits" },
  { label: "Objetivos", value: "goals" },
  { label: "Rotina", value: "routine" },
  { label: "Eventos", value: "events" },
  { label: "Sessões de foco", value: "focus" },
  { label: "Hidratação", value: "hydration" },
  { label: "Corrida", value: "running" },
  { label: "Leitura", value: "reading" },
  { label: "Saúde", value: "health" },
  { label: "Ciclo menstrual", value: "menstrual-cycle" },
];

export function ExportDataPanel() {
  const [entity, setEntity] = useState(ENTITY_OPTIONS[0].value);

  return (
    <div className={styles.panel}>
      <p className={styles.note}>
        Baixe uma cópia dos seus próprios dados. O JSON traz tudo de uma vez;
        o CSV traz uma lista por vez, pra abrir numa planilha.
      </p>

      <a className={styles.linkButton} href="/api/export?format=json" download="gerencie-se-dados.json">
        Baixar tudo em JSON
      </a>

      <div className={styles.csvRow}>
        <Input.Root>
          <Input.Wrapper>
            <Input.FieldSelect
              aria-label="Escolher lista para exportar em CSV"
              optionsArray={ENTITY_OPTIONS}
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>

        <a
          className={`${styles.linkButton} ${styles.secondary}`}
          href={`/api/export?format=csv&entity=${entity}`}
          download={`gerencie-se-${entity}.csv`}
        >
          Baixar CSV
        </a>
      </div>
    </div>
  );
}
