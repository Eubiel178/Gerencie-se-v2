// Compartilhado entre `Timer` (painel completo, /home/focus) e
// `FocusMiniWidget` (compacto, nas outras páginas) - mesmo relógio, um
// só lugar pra formatar.
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
