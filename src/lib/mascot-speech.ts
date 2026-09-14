/** Validação pura, compartilhável em testes e no Route Handler. A síntese
 * propriamente dita continua isolada em `edge-tts.ts` como server-only. */
export const MAX_MASCOT_SPEECH_LENGTH = 280;

export function isMascotSpeechValid(text: string): boolean {
  return text.trim().length > 0 && text.length <= MAX_MASCOT_SPEECH_LENGTH;
}
