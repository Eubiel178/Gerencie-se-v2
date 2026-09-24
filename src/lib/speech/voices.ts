/** Catálogo das vozes PT-BR da fala do mascote/assistente/Companion/Tour.
 * Os `id` são os `ShortName` do Edge TTS (`msedge-tts`) — TODAS as vozes
 * abaixo foram conferidas ao vivo gerando áudio real de síntese. As únicas
 * 4 vozes pt-BR que funcionam no endpoint gratuito do Edge; as demais
 * vozes pt-BR da Azure (Brenda, Giovanna, Yara, Humberto etc.) NÃO estão
 * no pacote do Edge e a síntese encerra a conexão sem áudio. `id` é o nome
 * usado na rota `/api/mascot-speech` e persistido em `assistant_voice_id`;
 * o label é só o nome amigável pro usuário. A ordem da lista é a ordem
 * exibida no seletor de voz em Configurações.
 *
 * `pt-BR-ThalitaNeural` é a padrão: usuários existentes, sem preferência
 * salva ainda, caem nela automaticamente (default da coluna no schema +
 * fallback aqui). Qualquer valor legado/fora do catálogo some pela guarda
 * `isSupportedVoice` e cai neste default.
 */
export const SPEECH_VOICES = [
  { id: "pt-BR-ThalitaNeural", label: "Thalita" },
  { id: "pt-BR-FranciscaNeural", label: "Francisca" },
  { id: "pt-BR-ThalitaMultilingualNeural", label: "Thalita (multilíngue)" },
  { id: "pt-BR-AntonioNeural", label: "Antônio" },
] as const;

export type SpeechVoiceId = (typeof SPEECH_VOICES)[number]["id"];

export const DEFAULT_VOICE_ID: SpeechVoiceId = "pt-BR-ThalitaNeural";

/** `isSupportedVoice` também é a guarda de corrupção: um valor estranho
 * vindo do banco (voz removida/corrompida ou default de uma voz antiga
 * que não existe mais) cai fora da lista e quem consome (rota, painel)
 * usa `DEFAULT_VOICE_ID` em vez de quebrar. */
export function isSupportedVoice(value: string): value is SpeechVoiceId {
  return SPEECH_VOICES.some((voice) => voice.id === value);
}