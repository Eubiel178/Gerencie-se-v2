// Exibida tanto quando a conta existe quanto quando não existe (ver
// `requestPasswordResetAction` em `actions.ts`) — de propósito genérica, pra
// nunca revelar se aquele e-mail está cadastrado. Compartilhada entre
// `actions.ts` (implícita via `sent: true`) e o formulário (que a exibe),
// sem duplicar o texto nos dois lugares.
export const RESET_REQUEST_SENT_MESSAGE =
  "Se este e-mail estiver cadastrado, enviamos um link de redefinição para ele.";
