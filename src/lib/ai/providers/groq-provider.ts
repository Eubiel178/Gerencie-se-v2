import "server-only";

import Groq from "groq-sdk";

import type { AIProvider, AIProviderResponse } from "./types";

// Os antigos padrões (llama-3.3-70b-versatile, llama-3.1-8b-instant,
// mixtral-8x7b-32768) foram DESCONTINUADOS pela Groq - toda chamada com
// eles falhava com 404 "model_not_found", silenciosamente puxando 100%
// do tráfego pro fallback Gemini/local sem nenhum log de alerta óbvio
// (achado real: `curl .../v1/models` com a chave de produção não listava
// mais nenhum desses três). Os 3 abaixo são os únicos modelos de texto
// genéricos ativos na conta no momento desta correção - reconfirmar via
// `GET https://api.groq.com/openai/v1/models` se voltar a falhar.
//
// qwen/qwen3.8-27b como primário, não os gpt-oss (testado lado a lado
// nas mesmas conversas multi-turno da revisão de naturalidade do
// Companion - ver `system-prompt.ts`): os gpt-oss reagem a provocação/
// palavrão de brincadeira com deflexão tipo "Desculpe, não entendi. Como
// posso ajudar?" (RLHF de suporte ao cliente vazando através do system
// prompt) e insistem em emoji mesmo com "Sem emoji." explícito - exatamente
// o comportamento robótico/customer-service que o Companion precisa
// evitar. O qwen manteve personalidade, ritmo e continuidade sem cair
// nesse padrão nos mesmos testes.
const GROQ_MODELS: readonly string[] = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];

// Sem isso, o Groq reserva um teto de output BEM maior que o necessário
// pra uma resposta de chat/JSON curta - e o plano gratuito tem um limite
// de OUTPUT TOKENS POR MINUTO (OTPM) bem baixo (1000, confirmado via
// header `x-ratelimit-limit-tokens` numa chamada real que retornou 429
// "Request too large... output tokens per minute"). Isso fazia toda
// chamada ao Groq falhar com 429 mesmo na PRIMEIRA requisição do
// minuto (não era acúmulo de uso, era o teto reservado por chamada já
// vindo maior que o limite) - o gateway então caía pro fallback Gemini/
// local silenciosamente, sem nunca de fato usar o Groq. Valores abaixo
// do teto, generosos o bastante pro tamanho real das respostas.
const MAX_CHAT_TOKENS = 500;
const MAX_JSON_TOKENS = 700;

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
      max_tokens: MAX_CHAT_TOKENS,
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
      max_tokens: MAX_JSON_TOKENS,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;

    return { text, model };
  }
}
