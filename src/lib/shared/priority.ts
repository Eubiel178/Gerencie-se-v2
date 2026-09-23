import { ChipOption } from "@/components";

// Escala de prioridade compartilhada por tarefas e objetivos (mesmos
// valores "baixa"/"media"/"alta"/"critica" nos dois schemas) - vivia
// duplicada em `tasks/components/modal/interfaces.ts` e
// `goals/components/modal/interfaces.ts`, e dashboard (um agregador de
// features) importava a cópia de tasks só por não ter uma fonte
// compartilhada (achado numa revisão de código).
export const PRIORITY_OPTIONS: ChipOption[] = [
  { label: "Baixa", value: "baixa", tone: "low" },
  { label: "Média", value: "media", tone: "medium" },
  { label: "Alta", value: "alta", tone: "high" },
  { label: "Crítica", value: "critica", tone: "critical" },
];

export const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};
