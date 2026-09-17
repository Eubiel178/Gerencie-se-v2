/** Texto compartilhado por todos os e-mails transacionais.
 *
 * Clientes de e-mail podem classificar mensagens automáticas como spam;
 * orientar isso no próprio modelo reduz a dúvida sem prometer entrega na
 * caixa de entrada principal. */
export function renderSpamFolderHint(mutedColor: string): string {
  return `<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:${mutedColor};">Não encontrou este e-mail? Verifique a caixa de spam e marque o Gerencie-se como remetente confiável.</p>`;
}
