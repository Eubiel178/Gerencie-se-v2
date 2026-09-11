interface SharedBadgeProps {
  // Verdadeiro quando QUEM ESTÁ VENDO é o colaborador (não o dono) —
  // nesse caso mostra quem compartilhou.
  isSharedWithMe: boolean;
  ownerLabel?: string | null;
  // Verdadeiro quando o item tem alguém em `sharedWithUserId` (visão do
  // dono, que já sabe que é ele mesmo quem compartilhou).
  isShared: boolean;
  // "Compartilhado"/"Compartilhada" — concordância de gênero varia por
  // feature (tarefa/rotina/hábito/objetivo).
  label?: string;
  className?: string;
}

/** Badge "Compartilhado(a) [por Fulano]" — mesmo padrão repetido nos
 * cards de tarefas, rotina, hábitos e objetivos. */
export function SharedBadge({
  isSharedWithMe,
  ownerLabel,
  isShared,
  label = "Compartilhado",
  className,
}: SharedBadgeProps) {
  if (isSharedWithMe) {
    return (
      <p className={className}>
        {label} por {ownerLabel}
      </p>
    );
  }

  if (isShared) {
    return <p className={className}>{label}</p>;
  }

  return null;
}
