interface ShareReadOnlyNoteProps {
  // "esta tarefa" | "este item" | "este hábito" | "este objetivo" —
  // concordância de gênero/artigo varia por feature.
  noun: string;
  className?: string;
}

/** Aviso mostrado no formulário de edição pro colaborador (nunca o
 * dono) de um item compartilhado: o campo "Compartilhar com" aparece,
 * mas a camada de dados ignora silenciosamente qualquer mudança nele
 * vinda de quem não é dono — este texto deixa isso explícito na UI. */
export function ShareReadOnlyNote({ noun, className }: ShareReadOnlyNoteProps) {
  return <p className={className}>Só quem compartilhou {noun} pode mudar isso.</p>;
}
