// Sonzinho de enviar/receber mensagem no chat do Companion — sintetizado
// na hora via Web Audio API, mesmo raciocínio de
// `mascot-pet/engine/sound-effects.ts` (nenhum arquivo de áudio pra
// carregar/hospedar). Contexto próprio (não reaproveita o do mascote):
// enviar/receber mensagem é uma notificação de CHAT, conceitualmente
// separada do "blipe" de clicar no bichinho, mesmo que a implementação
// por baixo seja parecida.
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

function playTone(startFreq: number, endFreq: number, durationMs: number, gain: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") void ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + durationMs / 1000);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Web Audio bloqueado/indisponível nesta página - segue sem som.
  }
}

/** Toca ao ENVIAR uma mensagem - disparado sempre dentro do próprio
 * clique/Enter do usuário (gesto real), então nunca esbarra em
 * restrições de autoplay do navegador. */
export function playMessageSentSound(): void {
  playTone(700, 900, 90, 0.1);
}

/** Toca ao RECEBER a resposta - mesmo contexto de áudio já desbloqueado
 * pelo envio (a `AudioContext` fica "destravada" pro resto da página
 * depois do primeiro gesto real, mesmo raciocínio de
 * `lib/speech/audio-unlock.ts`), então continua tocando mesmo que a
 * resposta chegue com o balão do Widget FECHADO. */
export function playMessageReceivedSound(): void {
  playTone(500, 750, 120, 0.12);
}
