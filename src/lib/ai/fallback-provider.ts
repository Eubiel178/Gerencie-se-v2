import type { MascotPersonality } from "@/features/focus/domain/mascot";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DECOMPOSE: Record<MascotPersonality, string[]> = {
  afetuoso: [
    "Vem, vamos por partes. Começa por aqui e o resto a gente resolve depois.",
    "Separei isso pra ficar mais leve. Uma coisa de cada vez.",
    "Fica comigo. Vamos começar pequeno e ir seguindo.",
    "Não precisa abraçar tudo. Olha só pra esse primeiro passo.",
  ],
  sarcastico: [
    "Tá, desse tamanho até eu ajudo. Quebrei em partes pra começar sem sofrimento.",
    "Pronto, desmontei o monstro. Agora ele é só uns quantos monstrinhos.",
    "Separei tudo porque aparentemente fazer tudo de uma vez não era genius.",
    "Agora ficou com cara de coisa que um humano consegue fazer.",
  ],
  engracado: [
    "Cortei a tarefa em pedaços. Ela tá menos assustadora e um pouco menos folgada.",
    "Transformei a missão impossível em várias missões bem possíveis.",
    "Uma tarefa inteira assusta. Um passinho só incomoda. Bora nele.",
    "Separei em partes pra gente não resolver a existência inteira numa sentada.",
  ],
  motivador: [
    "Olha pra primeira parte, não pra tarefa inteira. Faz essa e depois a gente vê a próxima.",
    "Você não precisa dar conta de tudo agora. Só começa por aqui.",
    "Já temos um caminho. Agora coloca o primeiro passo em movimento.",
    "Não pensa no tamanho total. Seu foco é só essa primeira ação.",
  ],
  zen: [
    "Vamos com calma. Começa só por essa primeira parte.",
    "Uma coisa de cada vez. Faz esse passo no seu ritmo.",
    "Não precisa carregar a tarefa inteira. Fica só com o primeiro passo agora.",
    "Vai no seu ritmo. Um começo pequeno continua sendo um começo.",
  ],
};

export class FallbackAssistantProvider {
  async decomposeTask(params: {
    taskTitle: string;
    taskDescription: string;
    existingSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ steps: { title: string; completed: boolean }[]; firstMessage: string }> {
    const msgs = DECOMPOSE[params.personality] ?? DECOMPOSE.afetuoso;
    return {
      steps: [
        { title: "Começar pela primeira parte", completed: false },
        { title: "Continuar com o próximo pedaço", completed: false },
        { title: "Finalizar e revisar", completed: false },
      ],
      firstMessage: pick(msgs),
    };
  }

  async helpWhenStuck(params: {
    taskTitle: string;
    currentStep: string;
    completedSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ suggestion: string }> {
    return {
      suggestion: "Tá travado? Tenta dividir isso em algo menor. Qual é a menor coisa que dá pra fazer agora?",
    };
  }

  async resumeAfterDistraction(params: {
    taskTitle: string;
    currentStep: string;
    completedSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ message: string }> {
    return {
      message: "Você voltou. Continua de onde parou, sem pressa.",
    };
  }
}
