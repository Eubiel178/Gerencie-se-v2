"use client";

import { useEffect, useState } from "react";

import { SpeechVoiceId } from "@/lib/speech/voices";

/** Jargão técnico que, se soletrado ao pé da letra, quase sempre sai
 * errado na síntese de voz (ex.: "React" vira "Récat", "API" vira "Ápi").
 * A camada transforma exatamente o que é ENVIADO pra fala (via
 * `toSpeechText`), nunca o texto exibido na tela — o balão escrito e a
 * voz continuam sempre o mesmo texto canônico. Aplicado depois de
 * conferido na prática que soa mal de verdade.
 *
 * Atenção ao `IA`: a regra é case-sensitive DE PROPÓSITO — em caixa alta
 * é a sigla de Inteligência Artificial (lê-se "i-a"); no minúsculo "ia"
 * é a forma do verbo "ir" ("eu ia, ela ia") e nunca pode ser tocada.
 */
const TECHTALK_PRONUNCIATION: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bAPI\b/gi, "a-pê-i"],
  [/\bIA\b/g, "i-a"],
  [/\bHTML\b/gi, "agá-tê-eme-éle"],
  [/\bCSS\b/gi, "cê-ésse-ésse"],
  [/\bJavaScript\b/gi, "jáva-scrípti"],
  [/\bTypeScript\b/gi, "tái-pe-scrípti"],
  [/\bReact\b/gi, "ri-ácte"],
  [/\bNext\.js\b/gi, "néxti-jéss"],
];

/** Palavras cuja grafia informal (a que aparece NA TELA, ver
 * `mascot-lines.ts`) não é a que soa mais natural quando lida em voz
 * alta por um sintetizador — ex.: "vei" (gíria, "véi"/"mano") sai sem o
 * acento porque é assim que se escreve no português informal escrito,
 * mas lido ao pé da letra sem o acento o TTS tende a fechar a vogal
 * errado. Nunca mexe no que é MOSTRADO (a tela sempre usa o texto
 * original, ver `Mascot`/`Widget`) - só no que é ENVIADO pra fala, via
 * `toSpeechText` abaixo. Lista pequena de propósito: só entra aqui uma
 * palavra depois de confirmado que soa errado de verdade, não uma
 * tentativa de prever tudo.
 */
const PRONUNCIATION_OVERRIDES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bvei\b/gi, "véi"],
  ...TECHTALK_PRONUNCIATION,
];

/** Aplica as substituições de `PRONUNCIATION_OVERRIDES` — usada por
 * `speak` (nunca pelo texto exibido na tela). Exportada só pra teste. */
export function toSpeechText(text: string): string {
  return PRONUNCIATION_OVERRIDES.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text
  );
}

export interface SpeakOptions {
  // Voz específica pra testar no preview do seletor ("Ouvir voz") — o
  // preview NÃO salva a preferência; só toca o áudio com esta voz. Sem
  // isso, o servidor usa a voz salva do usuário (default `Thalita`).
  voice?: SpeechVoiceId;
}

/**
 * Estado de fala GLOBAL (módulo, não por hook) — antes, cada `useSpeak()`
 * guardava seu próprio `isSpeaking` local, então o Widget, o mascote do
 * Foco e o Companion de Tarefas podiam chamar `speak()` ao mesmo tempo
 * sem nenhum saber do outro: a fala mais nova começava a tocar POR CIMA
 * da mais velha (Edge TTS usa um `<audio>` novo a cada chamada, sem
 * cancelar o anterior) — dois áudios sobrepostos, ou pior, o balão já
 * mostrando a mensagem B enquanto o áudio da mensagem A ainda toca
 * (bug relatado: "o balão e o TTS podem comunicar conteúdo diferente").
 * Um único ponto de verdade aqui resolve os dois problemas de uma vez:
 * toda chamada nova cancela a anterior (nativa OU Edge TTS) antes de
 * começar, e ninguém mais precisa saber disso pra usar `speak()`.
 */
let currentAudio: HTMLAudioElement | null = null;
let currentGeneration = 0;
const speakingListeners = new Set<(isSpeaking: boolean) => void>();
let isSpeakingGlobal = false;

function setSpeakingGlobal(value: boolean) {
  if (isSpeakingGlobal === value) return;
  isSpeakingGlobal = value;
  speakingListeners.forEach((listener) => listener(value));
}

/** Para qualquer fala em andamento (nativa ou Edge TTS) na hora, sem
 * esperar ela terminar sozinha - chamado no início de toda `speak()` nova
 * e disponível para quem precisa silenciar sem falar nada em seguida
 * (ex.: usuário muta o Companion no meio de uma fala automática). */
export function stopSpeaking(): void {
  currentGeneration++;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  setSpeakingGlobal(false);
}

const NATIVE_SPEECH_RATE = 1;
const NATIVE_SPEECH_PITCH = 1;
const PT_BR_LANG_PREFIX = "pt-br";

/** Prefere uma voz pt-BR instalada (dando prioridade às "neural"/"natural",
 * que soam menos robóticas) — o `speechSynthesis` nativo do navegador
 * pega a voz padrão do sistema, que no Windows em português costuma ser
 * nada. `null` se não houver nenhuma voz pt-BR: aí `speakNative` deixa o
 * navegador usar a default sem customização alguma. Pura pra testar. */
export function pickPortugueseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const brazilian = voices.filter((voice) =>
    voice.lang.replace("_", "-").toLowerCase().startsWith(PT_BR_LANG_PREFIX)
  );
  if (brazilian.length === 0) return null;
  return (
    brazilian.find((voice) => /neural|premium|natural/i.test(voice.name)) ??
    brazilian[0]
  );
}

/** Devolve uma Promise que resolve quando a fala nativa termina (ou na
 * hora, se o navegador não suportar, ou se uma fala mais nova cancelou
 * esta no meio do caminho). Puxa uma voz pt-BR de verdade quando existe —
 * sem isso o navegador lê com a voz padrão da máquina, que fora de uma
 * voz pt-BR específica sai robótica e estranha. */
function speakNative(text: string, generation: number): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  function speakNow(): Promise<void> {
    return new Promise((resolve) => {
      if (generation !== currentGeneration) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      const voice = pickPortugueseVoice(window.speechSynthesis.getVoices());
      if (voice) utterance.voice = voice;
      // Conservadores de propósito: a voz já tem seu ritmo natural, não
      // precisa de efeitos nossos por cima (velocidade/pitch padrão).
      utterance.rate = NATIVE_SPEECH_RATE;
      utterance.pitch = NATIVE_SPEECH_PITCH;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      // Garante que a fila do navegador começa limpa (sem nomes
      // duplicados caso o usuário aperte falar de novo no meio).
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  // Alguns navegadores (Chrome principalmente) carregam a lista de vozes
  // de forma ASSÍNCRONA: a primeira chamada devolve uma lista vazia e só
  // dispara `voiceschanged` depois — se insistíssemos falando sem voz
  // escolhida, volta pro "robô" de novo. Se a lista já está pronta, fala
  // agora; senão espera o evento (com um tempo de segurança).
  if (window.speechSynthesis.getVoices().length > 0) return speakNow();

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      window.speechSynthesis.onvoiceschanged = null;
      speakNow().then(resolve);
    };
    timer = setTimeout(finish, 500);
    window.speechSynthesis.onvoiceschanged = finish;
  });
}

/**
 * Sintetiza e toca uma fala do mascote — compartilhado por TODO lugar que
 * fala com a voz do personagem (Widget, Foco, Companion de Tarefas, Tour
 * guiado). Sintetiza no servidor com a voz PT-BR escolhida em
 * Configurações (Edge TTS via `/api/mascot-speech`, sem custo, mas API
 * não-oficial e sem garantia de uptime); se falhar, cai pro
 * `speechSynthesis` nativo do navegador. `options.voice` é usado pelo
 * preview do seletor de voz ("Ouvir voz") pra testar UMA voz específica
 * sem persistir nada; sem ele, o servidor usa a preferência salva do
 * usuário. Sempre cancela qualquer fala anterior (de qualquer chamador)
 * antes de começar - nunca duas vozes sobrepostas, nunca uma fala velha
 * terminando depois que o conteúdo visível já mudou. Só resolve quando o
 * áudio termina (ou é cancelado por uma chamada mais nova).
 */
export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  const speechText = toSpeechText(text);
  stopSpeaking();
  const generation = currentGeneration;
  setSpeakingGlobal(true);

  try {
    const response = await fetch("/api/mascot-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: speechText,
        // Só envia a voz quando veio EXPLICITAMENTE (preview) — nunca
        // gera um voto divergente do salvo; sem o campo, o servidor usa a
        // preferência do usuário e ela continua a única fonte de verdade.
        ...(options.voice ? { voice: options.voice } : {}),
      }),
    });

    // Uma fala mais nova pode ter cancelado esta enquanto a rede
    // respondia - nunca troca `currentAudio` nem toca nada nesse caso.
    if (generation !== currentGeneration) return;

    if (!response.ok) {
      await speakNative(speechText, generation);
      return;
    }

    const blob = await response.blob();
    if (generation !== currentGeneration) return;

    const audio = new Audio(URL.createObjectURL(blob));
    currentAudio = audio;

    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  } catch {
    if (generation === currentGeneration) {
      await speakNative(speechText, generation);
    }
  } finally {
    if (generation === currentGeneration) {
      currentAudio = null;
      setSpeakingGlobal(false);
    }
  }
}

function subscribeSpeaking(listener: (isSpeaking: boolean) => void): () => void {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

/**
 * Hook fino sobre o estado de fala GLOBAL (ver acima) - `isSpeaking`
 * reflete se QUALQUER chamador está falando agora, não só este
 * componente, então um indicador visual (ex.: ícone de mudo) fica
 * correto mesmo quando outra parte da tela é quem disparou a fala.
 */
export function useSpeak() {
  const [isSpeaking, setIsSpeaking] = useState(isSpeakingGlobal);

  useEffect(() => subscribeSpeaking(setIsSpeaking), []);

  return { isSpeaking, speak };
}
