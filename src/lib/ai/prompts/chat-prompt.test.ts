import assert from "node:assert/strict";
import test from "node:test";

import { buildChatSystemPrompt } from "./chat-prompt";

/**
 * Cenário 11 (regressão): sequência conversacional com contexto real.
 *
 * Contexto do cenário:
 * Tarefa: KKKK
 * Descrição: usar a descrição real existente
 * Estado: Pausada
 * Passos: [ ] fdada [ ] dada
 *
 * Comportamento esperado:
 * - O Assistant NÃO deve perguntar "qual tarefa?"
 * - O Assistant NÃO deve afirmar que existem 0 passos
 * - Respostas devem ser diretas antes de serem personalizadas
 *
 * Ao contrário da versão anterior deste arquivo, os testes abaixo chamam
 * `buildChatSystemPrompt` de verdade (não uma cópia colada aqui) — uma
 * cópia hand-rolled pode divergir do código real sem que nenhum teste
 * quebre, que foi exatamente o que aconteceu com a versão anterior.
 */
const MOCK_EXECUTION_CONTEXT = [
  'TAREFA ATUAL: "KKKK"',
  "Descrição: usar a descrição real existente",
  "Status da sessão: pausada",
  "Prioridade: medium",
  "Passos (0/2 concluídos):",
  "  [ ] fdada",
  "  [ ] dada",
].join("\n");

test("contexto factual contém tarefa, passos e status", () => {
  assert.ok(MOCK_EXECUTION_CONTEXT.includes('TAREFA ATUAL: "KKKK"'));
  assert.ok(MOCK_EXECUTION_CONTEXT.includes("Descrição: usar a descrição real existente"));
  assert.ok(MOCK_EXECUTION_CONTEXT.includes("Status da sessão: pausada"));
  assert.ok(MOCK_EXECUTION_CONTEXT.includes("[ ] fdada"));
  assert.ok(MOCK_EXECUTION_CONTEXT.includes("[ ] dada"));
  assert.ok(MOCK_EXECUTION_CONTEXT.includes("0/2 concluídos"));
});

test("regras proíbem julgar conteúdo", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("nunca critique, deboche ou comente sobre o conteúdo das tarefas do usuário"));
  assert.ok(!prompt.includes("essa desgraça"));
  assert.ok(!prompt.includes("essa presepada"));
});

test("regras proíbem perguntar o óbvio", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes('NÃO pergunte "qual tarefa?"'));
  assert.ok(prompt.includes("se o contexto factual tiver dados suficientes, responda"));
  // Reforçado de novo no bloco de contexto específico da sessão atual.
  assert.ok(prompt.includes("NÃO pergunte qual é. Já responda diretamente com os dados do contexto"));
  assert.ok(prompt.includes("O contexto factual vem do banco de dados, NÃO do histórico da conversa"));
});

test("regras enfatizam utilidade primeiro", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("responda PRIMEIRO ao pedido"));
  assert.ok(prompt.includes('às vezes "Faltam dois: A e B." é mais humano que três frases com piada'));
});

test("personalidade está presente mas não domina", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("Você é aquele amigo que ajuda de verdade com humor seco."));
  assert.ok(prompt.includes("Tem ironia leve, nunca maldade."));
});

test("prompt composto tem todas as seções", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("Inteligência conversacional:"));
  assert.ok(prompt.includes("Personalidade:"));
  assert.ok(prompt.includes("## CONTEXTO DA SESSÃO ATUAL"));
  assert.ok(prompt.includes("## REGRAS PARA USO DO CONTEXTO"));
});

test("decompor: regras distinguem CONSULTAR de GERAR", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("CONSULTAR:"));
  assert.ok(prompt.includes("GERAR / DECOMPOR:"));
  assert.ok(prompt.includes("PEDIDO DE MUTATION:"));
});

test("decompor: steps existentes não bloqueiam decomposição", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("NÃO bloqueie por steps existentes"));
  assert.ok(prompt.includes("NÃO impede o usuário de pedir"));
});

test("sim: regras resolvem referências contra mensagem anterior", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes('referências como "sim", "não", "faz", "pode"'));
  assert.ok(prompt.includes("contra a pergunta/mensagem imediatamente anterior do assistente"));
});

test("personalidade: não hostiliza o usuário", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(!prompt.includes("debocha"));
  assert.ok(!prompt.includes("oxente, tá esperando o quê?"));
  assert.ok(!prompt.includes("Gírias leves: 'vei', 'mano', 'nem'"));
  assert.ok(prompt.includes("nunca ridiculariza"));
});

test("comunicação: não força gíria em toda resposta", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("NÃO force gírias em toda resposta"));
});

test("contexto: decomposition permite gerar quando todos steps concluídos", () => {
  const MOCK_COMPLETED_CONTEXT = [
    'TAREFA ATUAL: "Tarefa Completa"',
    "Descrição: descrição completa para decompor",
    "Status da sessão: pausada",
    "Prioridade: medium",
    "Passos (2/2 concluídos):",
    "  [x] Passo 1",
    "  [x] Passo 2",
  ].join("\n");
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_COMPLETED_CONTEXT);
  assert.ok(prompt.includes("GERAR / DECOMPOR:"));
  assert.ok(prompt.includes("NÃO bloqueie por steps existentes"));
});

test("MVP: prompt define capacidades READ, GENERATE, CONVERSATION", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("READ:"));
  assert.ok(prompt.includes("GENERATE:"));
  assert.ok(prompt.includes("CONVERSATION:"));
  assert.ok(prompt.includes("MUTATIONS: NÃO pode executar"));
});

test("MVP: mutations desabilitadas — resposta natural sem execução", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("responda naturalmente que por enquanto ele faz isso manualmente"));
});

test("MVP: sugestões são diretas, sem pedir confirmação", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes('NÃO pergunte "quer que eu faça?"'));
  assert.ok(prompt.includes("gerar sugestão não altera dados"));
});

test("regressão 1: consultar passos — contexto factual usado corretamente", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("[ ] fdada"));
  assert.ok(prompt.includes("[ ] dada"));
  assert.ok(prompt.includes("0/2 concluídos"));
  assert.ok(prompt.includes("CONSULTAR:"));
  assert.ok(prompt.includes("Responda com o estado atual dos dados reais da tarefa"));
});

test("regressão 2: decompor — steps existentes não bloqueiam", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("GERAR / DECOMPOR:"));
  assert.ok(prompt.includes("NÃO bloqueie por steps existentes"));
});

test("regressão 3: referências linguísticas — resolvidas pelo histórico", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes('referências como "sim", "não", "faz", "pode"'));
  assert.ok(prompt.includes("O histórico da conversa é útil para referências linguísticas"));
});

test("regressão 4: mutation pedida — resposta natural sem executar", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("PEDIDO DE MUTATION:"));
  assert.ok(prompt.includes("responda naturalmente que por enquanto ele faz isso manualmente"));
  // A regra instrui a NUNCA dizer "não tenho permissão" — a frase
  // aparece no prompt como exemplo do que evitar, o que é esperado, não
  // um vazamento de comportamento robótico.
  assert.ok(prompt.includes('nunca diga "não tenho permissão" ou respostas robóticas'));
});

test("regressão 5: contexto vazio — regras de contexto não aplicadas", () => {
  const prompt = buildChatSystemPrompt("sarcastico", "");
  assert.ok(!prompt.includes("## CONTEXTO DA SESSÃO ATUAL"));
  assert.ok(!prompt.includes("## REGRAS PARA USO DO CONTEXTO"));
  assert.ok(!prompt.includes("TAREFA ATUAL:"));
});

test("regressão 6: precedência visível — invariantes antes de personalidade", () => {
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("## PRECEDÊNCIA: Invariantes > Capacidades > Regras da operação > Personalidade > Contexto"));
  const identidadeIdx = prompt.indexOf("Você é o companheiro");
  const personalidadeIdx = prompt.indexOf("Personalidade:");
  assert.ok(identidadeIdx < personalidadeIdx, "Identidade deve vir antes de Personalidade");
  const capacidadesIdx = prompt.indexOf("Capacidades (MVP");
  assert.ok(capacidadesIdx < personalidadeIdx, "Capacidades devem vir antes de Personalidade");
});

test("regressão 7: personalidade desconhecida não quebra a montagem do prompt", () => {
  const prompt = buildChatSystemPrompt("inexistente", MOCK_EXECUTION_CONTEXT);
  assert.ok(prompt.includes("Você é o companheiro"));
  assert.ok(!prompt.includes("undefined"));
});

test("regressão 8: nenhuma regra do bloco de contexto está duplicada verbatim no invariante", () => {
  // Trava a deduplicação feita nesta revisão: as regras específicas do
  // bloco de contexto (campos, o que fazer com contexto vazio) não devem
  // voltar a repetir texto que já existe em COMPANION_SYSTEM_PROMPT.
  const prompt = buildChatSystemPrompt("sarcastico", MOCK_EXECUTION_CONTEXT);
  const occurrences = (needle: string) => prompt.split(needle).length - 1;

  assert.equal(
    occurrences('resolva referências como "sim", "não", "faz", "pode", "esses", "o primeiro"'),
    1
  );
  assert.equal(
    occurrences("responda naturalmente que por enquanto ele faz isso manualmente"),
    1
  );
});
