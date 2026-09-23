import "server-only";

export interface AIProviderResponse {
  text: string;
  model: string;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProvider {
  readonly name: string;
  readonly models: readonly string[];
  isAvailable(): boolean;
  generateText(params: {
    prompt: string;
    systemInstruction: string;
    model?: string;
    operation?: string;
    history?: HistoryMessage[];
  }): Promise<AIProviderResponse | null>;
  generateJSON(params: {
    prompt: string;
    systemInstruction: string;
    model?: string;
    operation?: string;
  }): Promise<AIProviderResponse | null>;
}
