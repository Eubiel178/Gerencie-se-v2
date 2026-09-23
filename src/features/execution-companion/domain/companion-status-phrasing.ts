import { MascotPersonality } from "@/features/focus/domain";

import { CompanionStatusSnapshot } from "./companion-status";

/**
 * Texto do que o mascote "diz" quando é clicado (ver `companion-status.ts`
 * pra QUANDO cada categoria se aplica). 100% determinístico DE PROPÓSITO
 * - nunca chama IA a cada clique.
 *
 * Por quê determinístico e não generativo aqui: (1) o pedido explícito
 * foi "não gastar chamada de IA a cada clique nem tornar o personagem
 * psicologicamente instável" - cache seria a alternativa, mas caching
 * corretamente (invalidar só quando o SINAL muda, não o clique) é
 * exatamente o que este cálculo puro já faz de graça, sem precisar de
 * infraestrutura de cache nenhuma; (2) diferente das interações
 * espontâneas (raras, uma narrativa de cada vez), aqui a pessoa pode
 * clicar várias vezes seguidas só "conferindo" - uma resposta instantânea
 * e estável é MELHOR pra essa curiosidade casual do que esperar uma
 * chamada de rede pra ouvir a mesma coisa dita diferente.
 */
export function phraseCompanionStatus(snapshot: CompanionStatusSnapshot, personality: MascotPersonality): string {
  const phraser = STATUS_PHRASERS[personality][snapshot.category];
  return phraser(snapshot.taskTitle);
}

type StatusPhraser = (taskTitle: string | null) => string;

const STATUS_PHRASERS: Record<MascotPersonality, Record<CompanionStatusSnapshot["category"], StatusPhraser>> = {
  afetuoso: {
    quiet: () => "Combinamos que eu ficaria mais quieto agora. Mas oi, tô por perto.",
    "declined-recently": () => "Tudo bem ter dito não. Continuo aqui do seu lado de qualquer jeito.",
    "accepted-recently": (t) => `Fiquei feliz em ajudar com "${t}" agora há pouco.`,
    "celebrated-recently": (t) => `Ainda tô com um sorriso por causa de "${t}".`,
    "active-task": (t) => `Te acompanhando em "${t}", sem pressa nenhuma.`,
    calm: () => "Nada de especial agora. Só feliz de estar por aqui com você.",
  },
  sarcastico: {
    quiet: () => "Pediu silêncio, tô cumprindo. Mas cliquei em mim, então já é sua culpa.",
    "declined-recently": () => "Recusou minha ajuda. Tudo bem, meu ego é resistente.",
    "accepted-recently": (t) => `Ajudei com "${t}" mais cedo. De nada, aliás.`,
    "celebrated-recently": (t) => `Ainda impressionado que "${t}" saiu do papel.`,
    "active-task": (t) => `Vigiando "${t}" de longe. Sem cobrar, só vigiando.`,
    calm: () => "Nada acontecendo. Nem eu tenho comentário pronto agora.",
  },
  engracado: {
    quiet: () => "Modo quietinho ativado a seu pedido. Psiu.",
    "declined-recently": () => "Falei 'precisa de ajuda?' e levei um não. Sobrevivi.",
    "accepted-recently": (t) => `Ajudei com "${t}" faz pouco. Trabalho em equipe, viu.`,
    "celebrated-recently": (t) => `Ainda comemorando "${t}" aqui no meu canto.`,
    "active-task": (t) => `De olho em "${t}". Sem pressão, só de olho mesmo.`,
    calm: () => "Sem novidade nenhuma. Só existindo por aqui mesmo.",
  },
  motivador: {
    quiet: () => "Fico mais quieto como você pediu. Mas continuo na sua torcida.",
    "declined-recently": () => "Sem problema ter seguido sozinho. Continuo por perto se mudar de ideia.",
    "accepted-recently": (t) => `Adorei ajudar com "${t}" agora há pouco. Foi um bom time.`,
    "celebrated-recently": (t) => `Ainda celebrando "${t}" com você.`,
    "active-task": (t) => `Na torcida por "${t}" nesse instante.`,
    calm: () => "Nada pra reportar agora. Só de prontidão pro próximo passo.",
  },
  zen: {
    quiet: () => "Fico mais quieto, como combinamos. Presente, só mais leve.",
    "declined-recently": () => "Tudo bem ter seguido sozinho. Não há problema nenhum nisso.",
    "accepted-recently": (t) => `Foi bom poder ajudar com "${t}" agora há pouco.`,
    "celebrated-recently": (t) => `Ainda guardo esse momento bom de "${t}".`,
    "active-task": (t) => `Por perto enquanto você cuida de "${t}". Sem pressa.`,
    calm: () => "Nada de especial agora. E tudo bem ser assim.",
  },
};
