// Modo Foco: presença reduzida enquanto a pessoa está tentando se
// concentrar - "no conflito entre personalidade e concentração,
// concentração vence" (pedido explícito).
//
// Estatísticas e Configurações entram na mesma regra por um motivo
// diferente: são as duas páginas mais densas em conteúdo real (números,
// linhas de lista) sem nenhuma folga vertical grande — o passeio autônomo
// do bichinho não tem como saber a geometria de cada card (ver
// `viewport-bounds.ts`), e nessas duas telas especificamente ele
// ocasionalmente parava por cima de um valor ou de uma linha de
// configuração, tornando o conteúdo ilegível (achado em auditoria visual).
// Ficar parado ali não impede o toque nele continuar funcionando — só para
// de andar sozinho.
//
// Lista nomeada (em vez de uma cadeia de `startsWith` solta dentro de
// `MascotPet`) pra deixar claro que isto é METADADO DE ROTA, não lógica de
// componente — a próxima página densa que precisar da mesma regra só
// adiciona um prefixo aqui.
export const QUIET_MODE_ROUTE_PREFIXES = ["/home/focus", "/home/stats", "/home/settings"] as const;

export function isQuietModeRoute(pathname: string): boolean {
  return QUIET_MODE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
