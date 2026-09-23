import type { MascotPersonality } from "@/features/focus/domain/mascot";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const RESUME_MESSAGES: Record<MascotPersonality, string[]> = {
  afetuoso: [
    "Oi! Tô aqui com você. Continua de onde parou, sem pressa.",
    "Voltei! Tava fazendo o quê mesmo? A gente retoma junto.",
    "Bem-vindo de volta. Estava tudo guardadinho aqui pra você.",
  ],
  sarcastico: [
    "E aí, sumiu! Mas tranquilo, tá aqui ó. Continua de onde parou.",
    "Voltou! Tava tudo parado aqui esperando. Bora lá.",
    "Oi! Ainda lembra o que tava fazendo? Eu lembro.",
  ],
  engracado: [
    "Voltei! A tarefa tava te esperando aqui. Tudo organizadinho.",
    "Oi! Ainda tava aqui vigilante. Continua de onde parou!",
    "Bem-vindo de volta! A tarefa tava ficando com ciúmes.",
  ],
  motivador: [
    "Bora! Você voltou e eu tô aqui pra continuar com você.",
    "Voltei! Cada retorno é uma nova chance. Continua de onde parou.",
    "Oi! Tá de volta. Vamos continuar de onde parou, sem pressa.",
  ],
  zen: [
    "Voltei. Tá tudo aqui, no seu ritmo. Continua quando quiser.",
    "Bem-vindo de volta. Sem pressa. Estava fazendo o quê?",
    "Oi. Tá tudo guardado. Continua de onde parou.",
  ],
};

const STUCK_MESSAGES: Record<MascotPersonality, string[]> = {
  afetuoso: [
    "Tá travado? Respira. Qual é a menor coisa que dá pra fazer agora?",
    "Não se preocupa. Às vezes só precisa recomeçar por outro ângulo.",
    "Fica tranquilo. Vamos juntos pensar no próximo passo menor.",
  ],
  sarcastico: [
    "Tá travado? oxente, respira. Qual é a menor coisa que dá pra fazer?",
    "Ah, travou? Normal. Às vezes só precisa recomeçar por outro lado.",
    "Respira. Qual é o próximo passo mais pequeno que você consegue dar?",
  ],
  engracado: [
    "Travou? Sem crise. Qual é a menor coisa que dá pra fazer agora?",
    "Ah não, travou! Mas relaxa, às vezes só precisa recomeçar por outro lado.",
    "Respira fundo. Qual é o próximo passo mais pequeno?",
  ],
  motivador: [
    "Tá travado? Sem problema. Qual é a menor coisa que dá pra fazer agora?",
    "Travou? Isso é normal. Às vezes só precisa recomeçar por outro ângulo.",
    "Respira. Qual é o próximo passo mais pequeno que você consegue dar?",
  ],
  zen: [
    "Travou? Tudo bem. Respira. Qual é a menor coisa que dá pra fazer?",
    "Sem pressa. Às vezes só precisa recomeçar por outro ângulo.",
    "Respira. Qual é o próximo passo mais pequeno que você consegue dar?",
  ],
};

/**
 * Fallback local — preserva personalidade e mensagens naturais.
 * Funciona mesmo quando nenhuma API externa está disponível.
 * Não acessa banco, não depende de providers externos.
 *
 * Regra: se a Task já possui steps, NÃO cria checklist paralelo.
 * O fallback respeita a Task como source of truth.
 */
export class LocalAssistantProvider {
  async decomposeTask(params: {
    taskTitle: string;
    taskDescription: string;
    existingSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ steps: { title: string; completed: boolean }[]; firstMessage: string }> {
    const msgs = DECOMPOSE_MESSAGES[params.personality] ?? DECOMPOSE_MESSAGES.afetuoso;

    if (params.existingSteps.length > 0) {
      return {
        steps: params.existingSteps.map((title) => ({ title, completed: false })),
        firstMessage: pick(msgs),
      };
    }

    return {
      steps: [],
      firstMessage: pick(msgs),
    };
  }

  async helpWhenStuck(params: {
    personality: MascotPersonality;
  }): Promise<{ suggestion: string }> {
    const msgs = STUCK_MESSAGES[params.personality] ?? STUCK_MESSAGES.afetuoso;
    return { suggestion: pick(msgs) };
  }

  async resumeAfterDistraction(params: {
    personality: MascotPersonality;
  }): Promise<{ message: string }> {
    const msgs = RESUME_MESSAGES[params.personality] ?? RESUME_MESSAGES.afetuoso;
    return { message: pick(msgs) };
  }
}

const DECOMPOSE_MESSAGES: Record<MascotPersonality, string[]> = {
  afetuoso: [
    "Vem, vamos por partes. Começa por aqui e o resto a gente resolve depois.",
    "Separei isso pra ficar mais leve. Uma coisa de cada vez.",
    "Fica comigo. Vamos começar pequeno e ir seguindo.",
    "Não precisa abraçar tudo. Olha só pra esse primeiro passo.",
  ],
  sarcastico: [
    "Tá, desse tamanho até eu ajudo. Quebrei em partes pra começar sem sofrimento.",
    "Pronto, desmontei o monstro. Agora ele é só uns quantos monstrinhos.",
    "Separei tudo porque aparentemente fazer tudo de uma vez não era inteligente.",
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
