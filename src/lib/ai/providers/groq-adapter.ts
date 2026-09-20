import "server-only";

import Groq from "groq-sdk";
import type { AIProvider, AIProviderResponse } from "./types";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

let client: Groq | null = null;

function getClient(): Groq | null {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  client = new Groq({ apiKey, timeout: 30_000, maxRetries: 0 });
  return client;
}

export class GroqProvider implements AIProvider {
  readonly name = "groq";

  isAvailable(): boolean {
    return getClient() !== null;
  }

  async generateText(params: {
    prompt: string;
    systemInstruction: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    const groq = getClient();
    if (!groq) return null;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: params.systemInstruction },
        { role: "user", content: params.prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;

    return { text, model: MODEL };
  }

  async generateJSON(params: {
    prompt: string;
    systemInstruction: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    const groq = getClient();
    if (!groq) return null;

    const jsonPrompt = `${params.prompt}\n\nResponda APENAS com um JSON válido, sem markdown.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: params.systemInstruction },
        { role: "user", content: jsonPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;

    return { text, model: MODEL };
  }
}
