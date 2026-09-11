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
        Baixe uma cópia dos seus próprios dados, uma lista por vez, em um
        arquivo que abre direto numa planilha (Excel, Google Planilhas).
      </p>

      <div className={styles.csvRow}>
        <Input.Root>
          <Input.Wrapper>
            <Input.FieldSelect
              aria-label="Escolher lista para exportar"
              optionsArray={ENTITY_OPTIONS}
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>

        <a
          className={styles.linkButton}
          href={`/api/export?format=csv&entity=${entity}`}
          download={`gerencie-se-${entity}.csv`}
        >
          Baixar planilha
        </a>
      </div>

      <a className={styles.advancedLink} href="/api/export?format=json" download="gerencie-se-dados.json">
        Baixar tudo em um arquivo técnico (JSON), pra quem sabe usar
      </a>
    </div>
  );
}
