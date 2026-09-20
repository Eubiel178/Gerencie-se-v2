import "server-only";

import { callGemini, callGeminiJSON, isGeminiAvailable } from "../gemini-client";
import type { AIProvider, AIProviderResponse } from "./types";

const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  isAvailable(): boolean {
    return isGeminiAvailable();
  }

  async generateText(params: {
    prompt: string;
    systemInstruction: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    return callGemini(params);
  }

  async generateJSON(params: {
    prompt: string;
    systemInstruction: string;
    operation?: string;
  }): Promise<AIProviderResponse | null> {
    return callGeminiJSON(params);
  }
}
