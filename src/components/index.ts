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
export { Form } from "./form-components/form";
export { Button } from "./form-components/button";
export { Input } from "./form-components/input";
export { Feedback } from "./typography/feedback";
export { Paragraph } from "./typography/paragraph";
export { Wrapper } from "./wrapper";
