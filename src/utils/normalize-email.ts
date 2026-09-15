/**
 * Mesma normalização usada em todo lugar que compara e-mail contra o banco
 * (login, cadastro, recuperação de senha, convite de compartilhamento) —
 * sem isso, cadastrar/convidar com "User@X.com" e depois tentar
 * entrar/recuperar/convidar de novo com "user@x.com" falhava
 * silenciosamente pra uma conta que existe de verdade (achado da auditoria
 * pré-deploy). Centralizado aqui pra nunca divergir por acidente entre os
 * lugares que fazem essa comparação.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
