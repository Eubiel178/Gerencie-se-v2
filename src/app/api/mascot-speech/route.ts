import { NextResponse } from "next/server";

import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { requireUserId } from "@/lib/auth";
import { synthesizeSpeech } from "@/lib/speech/edge-tts";
import { isMascotSpeechValid } from "@/lib/speech/mascot-speech";
import { DEFAULT_VOICE_ID, isSupportedVoice } from "@/lib/speech/voices";

/**
 * Dá voz à fala do mascote/assistente (ver `speak()` em
 * `src/lib/speech/speak-text.ts`). Exige login (mesmo padrão de
 * `requireUserId` usado em toda a camada de dados) — não é informação
 * sensível, mas evita abuso do endpoint por quem não está logado.
 *
 * Sintetiza com o Edge TTS (`msedge-tts`, sem custo, API não-oficial) na
 * voz PT-BR escolhida em Configurações. Se o Edge falhar, devolve 502 e o
 * cliente (`speak()`) cai pro `speechSynthesis` nativo do navegador.
 */
export async function POST(request: Request) {
  await requireUserId();

  let body: { text?: unknown; voice?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { text } = body;
  if (typeof text !== "string" || !isMascotSpeechValid(text)) {
    return NextResponse.json(
      { error: "A fala precisa ter entre 1 e 280 caracteres." },
      { status: 400 }
    );
  }

  // Voz efetiva: a pedida no corpo (preview do seletor — não persiste
  // nada) ou, sem ela, a preferência SALVA do usuário. Qualquer valor
  // fora do allowlist (ex.: default de uma voz antiga já removida)
  // cai pro default `pt-BR-ThalitaNeural`.
  let voiceId = DEFAULT_VOICE_ID;
  if (typeof body.voice === "string" && isSupportedVoice(body.voice)) {
    voiceId = body.voice;
  } else {
    const preferences = await getAssistantPreferencesFetcher().getPreferences();
    voiceId = isSupportedVoice(preferences.voiceId) ? preferences.voiceId : DEFAULT_VOICE_ID;
  }

  try {
    const audio = await synthesizeSpeech(text, voiceId);
    return new NextResponse(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch {
    // Edge TTS é API não-oficial e pode falhar/ficar fora do ar — o
    // cliente (`speak()`) trata esse 502 caindo pro `speechSynthesis`
    // nativo do navegador. Fala nunca é bloqueada por provider ausente.
    return NextResponse.json({ error: "Não foi possível gerar áudio." }, { status: 502 });
  }
}