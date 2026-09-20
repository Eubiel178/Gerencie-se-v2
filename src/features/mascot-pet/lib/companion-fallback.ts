/**
 * Fallback context-aware para o Companion quando Gemini está indisponível.
 * Extraído para testes unitários.
 */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface FallbackDeps {
  getActiveSession: () => Promise<{ taskId: string; status: string; currentStepIndex: number } | null>;
  getTaskById: (id: string) => Promise<{ title: string; steps: { title: string }[] } | null>;
}

const PREFIX = "Tô sem IA agora, mas posso te ajudar com o básico.";

export async function buildContextualFallback(
  userMessage: string,
  deps: FallbackDeps,
): Promise<string> {
  const lower = userMessage.toLowerCase();

  let activeTask: { title: string; steps: { title: string }[] } | null = null;
  let activeSession: { status: string; currentStepIndex: number } | null = null;
  try {
    const session = await deps.getActiveSession();
    if (session) {
      const task = await deps.getTaskById(session.taskId);
      if (task) {
        activeTask = { title: task.title, steps: task.steps ?? [] };
        activeSession = { status: session.status, currentStepIndex: session.currentStepIndex };
      }
    }
  } catch {
    // ignore
  }

  // ── Travado / pedindo ajuda (MENCIONA tarefa) ──
  if (lower.includes("travado") || lower.includes("não consigo") || lower.includes("nao consigo") || lower.includes("ajuda")) {
    if (activeTask && activeSession) {
      const currentStep = activeTask.steps[activeSession.currentStepIndex];
      if (currentStep) {
        return `${PREFIX} Você tá no passo "${currentStep.title}" da tarefa "${activeTask.title}". Tenta quebrar em algo menor.`;
      }
      return `${PREFIX} Você tá na tarefa "${activeTask.title}". Tenta dividir em passos menores.`;
    }
    return `${PREFIX} Tenta dividir o problema em algo menor — qual é a menor coisa que dá pra fazer agora?`;
  }

  // ── Saudação ──
  if (lower.includes("oi") || lower.includes("olá") || lower.includes("ola") || lower.includes("bom dia") || lower.includes("boa tarde") || lower.includes("boa noite")) {
    return pick([
      "Oi! Tô sem IA, mas posso te ajudar com o básico.",
      "Fala! Como posso te ajudar?",
      "E aí! O que tá precisando?",
    ]);
  }

  // ── Agradecimento ──
  if (lower.includes("obrigad") || lower.includes("valeu") || lower.includes("thanks")) {
    return pick([
      "Tamo junto!",
      "De nada! Chama se precisar.",
      "Fico feliz em ajudar!",
    ]);
  }

  // ── Tudo o mais: resposta genérica, SEM mencionar tarefa ──
  return pick([
    `${PREFIX} O que precisa?`,
    `${PREFIX} Me conta o que tá precisando.`,
    "Como posso te ajudar?",
    "Me explica melhor que eu te ajudo.",
  ]);
}
