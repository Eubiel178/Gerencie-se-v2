// Som de clique por espécie - sintetizado na hora via Web Audio API, sem
// depender de nenhum arquivo de áudio (nenhum pack baixado tinha som de
// verdade - ver public/mascot/pet/CREDITS.txt). Cada "blipe" é só um ou
// dois osciladores curtos moldados por espécie: não é um miado/latido
// realista, é uma pista sonora curta que dá mais vida ao clique, no
// mesmo espírito de um jogo simples em 8-bit.

interface Tone {
  type: OscillatorType;
  startFreq: number;
  endFreq?: number;
  durationMs: number;
  gain?: number;
}

// Um "bichinho" por entrada de MASCOT_CHARACTERS (ver domain/characters.ts)
// - adicionar um personagem novo sem entrada aqui simplesmente não toca
// som nenhum (nunca quebra o clique em si).
const SPECIES_SOUND: Record<string, Tone[]> = {
  cat: [{ type: "sine", startFreq: 600, endFreq: 950, durationMs: 160, gain: 0.15 }],
  dog: [{ type: "square", startFreq: 220, endFreq: 160, durationMs: 110, gain: 0.12 }],
  bird: [
    { type: "sine", startFreq: 1500, endFreq: 1900, durationMs: 70, gain: 0.12 },
    { type: "sine", startFreq: 1300, endFreq: 1700, durationMs: 70, gain: 0.12 },
  ],
  bear: [{ type: "sawtooth", startFreq: 110, endFreq: 80, durationMs: 260, gain: 0.1 }],
  fox: [{ type: "square", startFreq: 500, endFreq: 700, durationMs: 90, gain: 0.12 }],
};

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

/** Toca o "blipe" do personagem, se existir um definido - silenciosamente
 * não faz nada se o navegador bloquear/não suportar Web Audio (nunca
 * impede a reação visual do clique de acontecer normalmente). */
export function playMascotSound(characterId: string): void {
  const tones = SPECIES_SOUND[characterId];
  if (!tones) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") void ctx.resume();

    let cursor = ctx.currentTime;
    for (const tone of tones) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = tone.type;
      oscillator.frequency.setValueAtTime(tone.startFreq, cursor);
      if (tone.endFreq) {
        oscillator.frequency.linearRampToValueAtTime(tone.endFreq, cursor + tone.durationMs / 1000);
      }

      const gain = tone.gain ?? 0.15;
      gainNode.gain.setValueAtTime(gain, cursor);
      gainNode.gain.linearRampToValueAtTime(0.0001, cursor + tone.durationMs / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(cursor);
      oscillator.stop(cursor + tone.durationMs / 1000);

      cursor += tone.durationMs / 1000;
    }
  } catch {
    // Web Audio bloqueado/indisponível nesta página - segue sem som.
  }
}
