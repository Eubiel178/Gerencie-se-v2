import "server-only";

import Groq from "groq-sdk";

import type { AIProvider, AIProviderResponse } from "./types";

const GROQ_MODELS: readonly string[] = (() => {
  const primary = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const fallbacks = ["llama-3.1-8b-instant", "mixtral-8x7b-32768"];
  return [primary, ...fallbacks.filter((m) => m !== primary)];
})();

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
  readonly models = GROQ_MODELS;

  isAvailable(): boolean {
    return getClient() !== null;
  }

  async generateText(params: {
    prompt: string;
    systemInstruction: string;
    model?: string;
    operation?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<AIProviderResponse | null> {
    const groq = getClient();
    if (!groq) return null;

    const model = params.model ?? GROQ_MODELS[0];

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: params.systemInstruction },
    ];

    if (params.history) {
      for (const msg of params.history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: params.prompt });

    const completion = await groq.chat.completions.create({
      model,
      messages,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;

    return { text, model };
  }

  async generateJSON(params: {
    prompt: string;
    systemInstruction: string;
    model?: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    const groq = getClient();
    if (!groq) return null;

    const model = params.model ?? GROQ_MODELS[0];
    const jsonPrompt = `${params.prompt}\n\nResponda APENAS com um JSON válido, sem markdown.`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: params.systemInstruction },
        { role: "user", content: jsonPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;

    return { text, model };
  }
}
