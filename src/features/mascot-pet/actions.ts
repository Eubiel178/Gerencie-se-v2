"use server";

import { askGemini } from "@/lib/ai/gemini";

export async function sendAssistantMessage(message: string) {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return {
      success: false,
      message: "Digite uma mensagem.",
    };
  }

  if (cleanMessage.length > 1000) {
    return {
      success: false,
      message: "Mensagem muito longa.",
    };
  }

  const response = await askGemini(cleanMessage);

  return {
    success: true,
    message: response.text,
  };
}
