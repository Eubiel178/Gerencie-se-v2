// Só é exibida quando a conta de verdade existe (ver `requestPasswordResetAction`
// em `actions.ts`, que agora retorna um erro específico se o e-mail não
// estiver cadastrado) — por isso pode ser direta em vez de genérica.
// Compartilhada entre `actions.ts` (implícita via `sent: true`) e o
// formulário (que a exibe), sem duplicar o texto nos dois lugares.
export const RESET_REQUEST_SENT_MESSAGE =
  "Enviamos um link de redefinição para o seu e-mail.";
