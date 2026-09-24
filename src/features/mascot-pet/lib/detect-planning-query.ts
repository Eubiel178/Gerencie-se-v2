/**
 * Detecta quando a mensagem do usuário é uma CONSULTA FACTUAL ao
 * planejamento/tarefas — algo que SÓ pode ser respondido com os dados
 * reais — em vez de conversa casual ("oi", "tudo bem?", "e você?", "teu
 * cu kkk").
 *
 * Conservadora de propósito: dois eixos baratos e centralizados que têm
 * que casar JUNTOS:
 *
 *   - eixo de CONSULTA: a pessoa está perguntando por uma listagem/estado
 *     ("o que", "qual", "quais", "tem algo", "me mostra", "quero ver"...);
 *   - eixo de PLANEJAMENTO: o assunto é o plano do usuário (tarefa,
 *     prazo, atraso, hoje, amanhã, agenda, dia, próximo, lista...).
 *
 * Frase solta com palavra de planejamento mas sem pergunta não injeta
 * nada; pergunta sem assunto de planejamento também não. Frases naturais
 * ("o que tenho pra fazer?", "tem algo atrasado?", "como tá meu dia?",
 * "qual a próxima?") são cobertas por esses dois eixos por CONSTRUÇÃO —
 * não são uma lista rígida de strings a casar, e nenhuma outra IA é
 * chamada só pra decidir isso. O custo de um falso positivo é só injetar
 * o overview de tarefas (tokens), nunca dado errado.
 */

// Eixo 1 — intenção explícita de consultar/ver/contar estados.
const CONSULTATION_HINT =
  /\b(o que|qual|quais|quanto|quanta|quantos|quantas|(?:tem|tenho) (?:algo|alguma|algum)|como ta|como esta|me mostra|mostra|me diz|me manda|me passa|me fala|me lista|quero ver|quero saber)\b/i;

// Eixo 2 — assunto de planejamento (radicais curtos, sem acento: o texto
// é normalizado antes).
const PLANNING_HINT =
  /\b(taref|prazo|atras|venc|agenda|planej|falt|hoje|amanha|proxim|list|dia|faz|titul)\b/i;

function normalizeForHint(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function dependsOnPlanningData(message: string): boolean {
  const normalized = normalizeForHint(message.trim());
  if (normalized.length < 3) return false;
  return CONSULTATION_HINT.test(normalized) && PLANNING_HINT.test(normalized);
}