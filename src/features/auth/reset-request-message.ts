// Mensagem sempre igual, exista ou não uma conta com o e-mail informado
// — do contrário, o próprio formulário vira uma forma de descobrir quais
// e-mails têm cadastro (enumeração de contas). Compartilhada entre
// `actions.ts` (que a devolve implicitamente via `sent: true`) e o
// formulário (que a exibe), sem duplicar o texto nos dois lugares.
export const GENERIC_RESET_REQUEST_MESSAGE =
  "Se existir uma conta com este e-mail, enviamos um link de redefinição.";
