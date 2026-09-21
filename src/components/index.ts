/**
 * Biblioteca de UI ATIVA do app — todo componente aqui é usado por telas
 * reais (Login, Cadastro, Tarefas, Eventos, todas as features novas).
 * CSS Modules + design tokens, sem Tailwind.
 *
 * Não confundir com `src/design-system/`: aquela pasta é só tema
 * (claro/escuro) + tokens (`design-system/theme`, `design-system/tokens`)
 * — infraestrutura de estilo, não uma segunda biblioteca de componentes.
 * Uma tentativa anterior de construir `design-system/components/` (Button,
 * Card, Badge...) ficou sem uso real e foi removida; decisão consciente:
 * manter só uma biblioteca de componentes (esta), evitando duas fontes de
 * verdade para o mesmo tipo de peça de UI.
 */
export { Header } from "./header";
export { Modal } from "./modal";
export { ModalHeader } from "./modal/modal-header";
export { Form } from "./form";
export { Button } from "./button";
export { Input } from "./form/input";
export { ChipGroup } from "./chip-group";
export type { ChipOption } from "./chip-group";
export { SuggestionChips } from "./suggestion-chips";
export { CollapsibleSection } from "./collapsible-section";
export { ConfirmIconButton } from "./confirm-icon-button";
export { ConfirmCheckbox } from "./confirm-checkbox";
export { Alert } from "./alert";
export type { AlertVariant } from "./alert";
export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";
export { Icon } from "./icon";
export type { IconName } from "./icon";
export { StepsEditor } from "./steps-editor";
export type { StepLike, StepsDraft } from "./steps-editor/types";
export { StatusBadge } from "./status-badge";
