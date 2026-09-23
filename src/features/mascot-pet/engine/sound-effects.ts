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

// Som por FAMÍLIA de bicho (gato/cachorro), não por personagem
// individual - as 3 raças de cachorro e as 6 variantes de gato soam como
// o `dog`/`cat` original da própria família, em vez de cada um precisar
// de um blipe só seu (um miado/latido sintetizado não muda por causa da
// cor da pelagem). O panda ganha o tom do urso (mesmo espírito grave e
// calmo). Um "bichinho" por entrada de MASCOT_CHARACTERS (ver
// domain/characters.ts) - adicionar um personagem novo sem entrada aqui
// simplesmente não toca som nenhum (nunca quebra o clique em si) - foi
// exatamente o que faltou pro panda e pras 9 raças novas quando entraram
// (achado relatado: "alguns mascotes tão sem som").
const CAT_TONE: Tone[] = [{ type: "sine", startFreq: 600, endFreq: 950, durationMs: 160, gain: 0.15 }];
const DOG_TONE: Tone[] = [{ type: "square", startFreq: 220, endFreq: 160, durationMs: 110, gain: 0.12 }];

const SPECIES_SOUND: Record<string, Tone[]> = {
  cat: CAT_TONE,
  dog: DOG_TONE,
  bird: [
    { type: "sine", startFreq: 1500, endFreq: 1900, durationMs: 70, gain: 0.12 },
    { type: "sine", startFreq: 1300, endFreq: 1700, durationMs: 70, gain: 0.12 },
  ],
  bear: [{ type: "sawtooth", startFreq: 110, endFreq: 80, durationMs: 260, gain: 0.1 }],
  fox: [{ type: "square", startFreq: 500, endFreq: 700, durationMs: 90, gain: 0.12 }],
  panda: [{ type: "sawtooth", startFreq: 100, endFreq: 75, durationMs: 260, gain: 0.1 }],
  golden: DOG_TONE,
  akita: DOG_TONE,
  "dogue-alemao": DOG_TONE,
  "gato-preto": CAT_TONE,
  "gato-angora": CAT_TONE,
  "gato-tabby": CAT_TONE,
  "gato-laranja": CAT_TONE,
  "gato-lilas": CAT_TONE,
  "gato-siames": CAT_TONE,
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
