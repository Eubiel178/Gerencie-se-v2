import "server-only";

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const VOICE = "pt-BR-FranciscaNeural";

/** Sintetiza fala usando a API (não-oficial) de voz do Microsoft Edge —
 * grátis, sem chave de API, mas sem garantia de uptime. Quem chama isso
 * (a rota `/api/mascot-speech`) deve sempre ter um plano B se isso
 * falhar (ver `speak()` no componente Mascot, que cai pro
 * `speechSynthesis` nativo do navegador). */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);

  const chunks: Buffer[] = [];

  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
