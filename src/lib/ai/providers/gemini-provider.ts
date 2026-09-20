import "server-only";

import {
  callGemini,
  callGeminiJSON,
  isGeminiAvailable,
} from "../gemini-client";
import type { AIProvider, AIProviderResponse } from "./types";

const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly models = GEMINI_MODELS;

  isAvailable(): boolean {
    return isGeminiAvailable();
  }

  async generateText(params: {
    prompt: string;
    systemInstruction: string;
    model?: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    return callGemini({
      prompt: params.prompt,
      systemInstruction: params.systemInstruction,
      model: params.model,
      operation: params.operation,
    });
  }

  async generateJSON(params: {
    prompt: string;
    systemInstruction: string;
    model?: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    return callGeminiJSON({
      prompt: params.prompt,
      systemInstruction: params.systemInstruction,
      model: params.model,
      operation: params.operation,
    });
  }
}
