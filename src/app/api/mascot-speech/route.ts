import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/require-user-id";
import { synthesizeSpeech } from "@/lib/edge-tts";
import { isMascotSpeechValid } from "@/lib/mascot-speech";

/**
 * Só existe pra dar voz à fala do mascote (ver `speak()` em
 * `features/focus/components/mascot`). Exige login (mesmo padrão de
 * `requireUserId` usado em toda a camada de dados) — não é informação
 * sensível, mas evita abuso do endpoint por quem não está logado.
 */
export async function POST(request: Request) {
  await requireUserId();

  const { text } = await request.json();

  if (typeof text !== "string" || !isMascotSpeechValid(text)) {
    return NextResponse.json(
      { error: "A fala precisa ter entre 1 e 280 caracteres." },
      { status: 400 }
    );
  }

  try {
    const audio = await synthesizeSpeech(text);

    return new NextResponse(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch {
    // A API do Edge TTS é não-oficial e pode falhar/ficar fora do ar sem
    // aviso — o cliente (`speak()`) trata esse erro caindo pro
    // `speechSynthesis` nativo do navegador.
    return NextResponse.json({ error: "Não foi possível gerar áudio." }, { status: 502 });
  }
}
