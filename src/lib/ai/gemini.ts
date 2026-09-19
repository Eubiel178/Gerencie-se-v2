import "server-only";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY não configurada.");
}

const ai = new GoogleGenAI({
  apiKey,
});

const models = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;

const systemPrompt = `
Você é o companheiro de execução do Gerencie-se.

Seu objetivo é ajudar o usuário a começar, continuar e concluir
o que está tentando fazer.

Regras:
- responda em português;
- seja curto e natural;
- não sobrecarregue o usuário;
- priorize uma próxima ação concreta;
- não invente informações sobre tarefas ou sobre o usuário;
- não diga que realizou ações que o sistema não realizou.
`;

export async function askGemini(message: string) {
  for (const model of models) {
    try {
      const response = await ai.interactions.create({
        model,
        system_instruction: systemPrompt,
        input: message,
      });

      const text = response.output_text?.trim();

      if (text) {
        return {
          text,
          model,
        };
      }
    } catch (error) {
      console.error(`[Gemini] ${model} falhou`, error);
    }
  }

  return {
    text: "Tô aqui com você. Vamos por uma coisa de cada vez. O que está te impedindo de continuar agora?",
    model: "local",
  };
}
