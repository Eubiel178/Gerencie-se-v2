export { synthesizeSpeech } from "./edge-tts";
export { speak, toSpeechText, useSpeak } from "./speak-text";
export { isMascotSpeechValid, MAX_MASCOT_SPEECH_LENGTH } from "./mascot-speech";
export { isAudioUnlocked, subscribeAudioUnlock } from "./audio-unlock";
export {
  DEFAULT_VOICE_ID,
  isSupportedVoice,
  SPEECH_VOICES,
} from "./voices";
export type { SpeechVoiceId } from "./voices";
