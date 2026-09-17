import Link from "next/link";

import { INextAction } from "@/features/dashboard/next-action";

import styles from "./styles.module.css";

const KIND_LABEL: Record<INextAction["kind"], string> = {
  resumed: "Continuar de onde parou",
  overdue: "Atrasada",
  scheduled: "Próxima tarefa",
  routine: "Próximo da rotina",
  // Nunca usado de fato pra "priority" (ver `eyebrow` abaixo, que usa
  // `action.label` nesse caso) — só existe aqui porque `Record<Kind,
  // string>` exige as 7 chaves preenchidas.
  priority: "Prioridade alta",
  habit: "Hábito pendente",
  none: "Tudo em dia",
};

export function NextAction({ action }: { action: INextAction }) {
  // "priority": `action.label` JÁ é o texto certo pra cima ("Prioridade
  // crítica"/"Prioridade alta"/"Tarefa pendente", calculado a partir da
  // prioridade real em `buildNextAction`) — usar o mapa fixo aqui
  // mostrava sempre "Prioridade alta" nesse slot, mesmo pra crítica ou
  // pendente comum, e ainda duplicava o texto embaixo (achado relatado).
  const eyebrow = action.kind === "priority" ? action.label : KIND_LABEL[action.kind];
  const showTimeBadge =
    action.kind !== "none" && action.kind !== "priority" && action.label !== KIND_LABEL[action.kind];

  return (
    <Link href={action.href} className={styles.card} data-kind={action.kind} data-priority={action.priority}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <span className={styles.title}>
        {showTimeBadge && <span className={styles.time}>{action.label}</span>}
        {action.title}
      </span>
    </Link>
  );
}
