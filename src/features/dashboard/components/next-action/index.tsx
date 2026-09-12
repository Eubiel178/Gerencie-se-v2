import Link from "next/link";

import { INextAction } from "@/features/dashboard/next-action";

import styles from "./next-action.module.css";

const KIND_LABEL: Record<INextAction["kind"], string> = {
  resumed: "Continuar de onde parou",
  overdue: "Atrasada",
  scheduled: "Próxima tarefa",
  routine: "Próximo da rotina",
  priority: "Prioridade alta",
  habit: "Hábito pendente",
  none: "Tudo em dia",
};

export function NextAction({ action }: { action: INextAction }) {
  return (
    <Link href={action.href} className={styles.card} data-kind={action.kind}>
      <span className={styles.eyebrow}>{KIND_LABEL[action.kind]}</span>
      <span className={styles.title}>
        {action.kind !== "none" && action.label !== KIND_LABEL[action.kind] && (
          <span className={styles.time}>{action.label}</span>
        )}
        {action.title}
      </span>
    </Link>
  );
}
