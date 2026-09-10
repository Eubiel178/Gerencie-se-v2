/** "Bom dia" / "Boa tarde" / "Boa noite" a partir da hora local do
 * servidor — mesma suposição de fuso único já documentada em
 * `features/tasks/sync.ts` (app de um usuário só, sem multi-fuso). Função
 * pura para poder testar as três faixas sem mexer no relógio real. */
export function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia.";
  if (hour < 18) return "Boa tarde.";
  return "Boa noite.";
}
