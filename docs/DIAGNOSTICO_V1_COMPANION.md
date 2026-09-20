# DIAGNOSTICO V1 — Companheiro Contextual

**Status:** Analise somente. Nenhum arquivo alterado.
**Base:** Codigo real do Gerencie-se-v2 + screenshot fornecida.

---

## 1. O QUE ESTA ERRADO NA EXPERIENCIA

A screenshot mostra um unico momento com 7-8 elementos visuais diferentes representando a mesma atividade:

- Card da tarefa com titulo, prioridade, status, acoes
- Passos originais da tarefa (subtarefas criadas pelo usuario)
- Banner "Voce estava fazendo" com 3 botoes
- Mascote posicionado sobre o card
- Balao de fala do mascote com mensagem do Gemini
- Barra flutuante no rodape com passo atual, progresso, botoes
- Painel lateral com OUTRA lista de passos e mais botoes

O usuario nao sabe qual e a "verdade". O sistema esta mostrando sua arquitetura interna em vez de uma experiencia coesa.

---

## 2. COMPONENTES COM INFORMACOES DUPLICADAS

### Passos da tarefa vs Passos da sessao

- `task.steps`: passos persistentes criados pelo usuario
- `executionSession.steps`: passos gerados pelo Gemini

Duas fontes de verdade para "quais partes compoem essa tarefa".

### Barra flutuante vs Painel vs Banner

Todas tres mostram: titulo da tarefa + status da execucao + acoes disponiveis. Competem pela atencao.

### Balao do mascote vs Assistant widget

Dois locais onde o mascote "fala" ao mesmo tempo.

---

## 3. CONTROLES DUPLICADOS

| Acao | Onde aparece | Qtd |
|---|---|---|
| Pausar | Barra, Painel, Banner | 3 |
| Retomar | Barra, Painel, Banner | 3 |
| Concluir | Barra, Painel, Banner | 3 |
| Pedir ajuda | Barra, Painel | 2 |
| Sair/abandonar | Painel, Banner | 2 |

---

## 4. RESOLVER DUPLICACAO DE PASSOS

### Regra: a tarefa e a unica fonte de verdade

Se a tarefa ja tem passos, o Companion usa esses passos. Nao cria outros.

Se a tarefa NAO tem passos, Gemini pode sugerir decomposicao. Mas:
- Salva em `task.steps` (nao em `executionSession.steps`)
- E editavel pelo usuario
- Nao cria lista paralela

### ExecutionSession guarda CONTEXTO, nao estrutura

A ExecutionSession e util para:
- Saber quem executou e quando comecou
- Rastrear progresso (currentStepIndex referenciando task.steps)
- Pausar/retomar
- Gerar notificacoes

Nao deve armazenar passos propriamenteditos.

### Microacao contextual (nao persistida)

Sugestao temporaria do Companion: "Comeca guardando so as roupas que estao na cama." Aparece no assistant widget e some. Nao e um passo persistido.

---

## 5. O QUE DEVE CONTINUAR PERSISTENTE

| Dado | Tabela | Motivo |
|---|---|---|
| executionSession (id, userId, taskId, status, currentStepIndex, timestamps) | execution_session | Rastrear sessao |
| lastCheckinSentAt | execution_session | Anti-spam |
| task.steps | task (JSON) | Estrutura da tarefa |
| task.workStatus | task | Status de execucao |

### O que NAO precisa de tabela separada

| Dado | Por que nao |
|---|---|
| activeIntentions | executionSession ja tem taskId |
| executionSession.steps | Passos vivem em task.steps |
| executionSession.mascotMessage | Mensagens sao transient |

---

## 6. CONTEXTO TEMPORARIO

- Mensagem atual do mascote (gerada a cada render)
- Microacao contextual sugerida
- Estados transitorios (thinking, starting)
- Conversa curta com o Companion

---

## 7. UNICA FONTE DE VERDADE

**Task** = o que precisa ser feito, quais partes existem, se esta em andamento.

**ExecutionSession** = quando comecou, quando pausou, qual passo esta focando, se esta ativa/paused/completed.

O Companion le ambas e INTERPRETA. Nao duplica.

---

## 8. COMO O MASCOTE SE TORNAR O COMPANHOEIRO

Hoje sao 3 sistemas:
- MascotePixiJS: pet que anda
- Assistant widget: insights contextuais
- ExecutionCompanion: terceiro sistema com balao proprio

Proposto: Assistant widget EVOLUI para interface do Companion. ExecutionCompanion vira infraestrutura pura sem UI propria.

---

## 9. COMO O MASCOTE RECEBE CONTEXTO

O AssistantService ja busca tasks, habits, goals, routine, mascot. Para a V1, basta ADICIONAR executionSession ao snapshot.

Nao precisa de nova classe, novo provider, novo event bus. A infraestrutura ja existe.

---

## 10. CONTEXTO MINIMO PARA A V1

```
executionSession: {
  exists, taskId, taskTitle, status,
  currentStepIndex, totalSteps, completedSteps,
  startedAt, lastUpdate
}
currentScreen: "tasks" | "other"
```

---

## 11. QUANDO FALAR

1. Entrada com sessao pausada: "Voce parou em [tarefa]. Quer continuar?"
2. Inicio de execucao: "Vamos comecar por [primeiro passo]."
3. Retorno apos distracao: "Voce parou em [tarefa]. Quer continuar?"
4. Usuario pede ajuda: resposta contextual
5. Conclusao: reacao visual + opcionalmente 1 frase

---

## 12. QUANDO FICAR EM SILENCIO

A maioria do tempo. Durante execucao normal:
- Mascote presente visualmente
- Assistant widget mostra contexto estatico
- Nao ha balao de fala
- Usuario trabalha sem interrupcao

Silencio e uma decisao de produto.

---

## 13. CONVERSA CURTA

```
[Avatar] "Voce parou nessa parte. Travou?"

[  ] Nao, to bem
[  ] Sim, preciso de ajuda
```

Nao e chat. 1-3 trocas. Balao some apos inatividade. Usuario nunca e obrigado a responder.

---

## 14. COMO "COMECAR COMIGO" FUNCIONA

1. Usuario clica "Comecar" (botao existente)
2. workStatus muda para "em andamento"
3. Assistant widget mostra: "Vamos comecar por [primeiro passo]"
4. Ou: "Quer que eu te ajude a dividir isso?" (se complexa sem passos)
5. Se aceita: Gemini decompoem, passos salvos em task.steps
6. Card mostra passos com primeiro destacado
7. Mascote reage visualmente
8. executionSession criada

Nao ha barra flutuante, painel lateral ou banner.

---

## 15. ACOMPANHAR EXECUCAO SEM Paineis

**No card da tarefa:**
- Passos visiveis com progresso
- Proximo passo destacado
- Botoes "Pedir ajuda" e "Terminei"

**No assistant widget:**
- "Voce esta em: [tarefa] — passo X de Y"

**Na navegacao:**
- Badge sutil indicando execucao em andamento

---

## 16. DISTRACAO

Usuario nao precisa clicar em nada. Se navega ou fecha a aba:
- Session continua ativa
- Quando volta: assistant mostra contexto
- Decide se continua

---

## 17. "ESTOU TRAVADO"

1. Botao "Pedir ajuda" no card
2. Assistant: "Travou em [passo]?"
3. Opcoes: [Nao] [Sim]
4. Se sim: Gemini gera microacao contextual
5. "Tenta [sugestao]"
6. Some apos interacao

---

## 18. PAUSA E RETOMADA

**Pausa:** Botao sutil "Pausar acompanhamento" no card.

**Retomada:** Assistant: "Voce parou em [tarefa]. Quer continuar?" + botao.

---

## 19. CONCLUSAO

Automatica quando ultimo passo marcado:
1. executionSession = completed
2. Mascote comemora (celebrate)
3. 15 XP creditados
4. Card volta ao normal

---

## 20. COMO GEMINI ENTRA

3 momentos:
1. Decomposicao de tarefa complexa
2. Ajuda quando usuario trava
3. Mensagem de retorno apos distracao

ASYNC, timeout, fallback se falhar. Resposta curta (1-2 frases).

---

## 21. SEM GEMINI

- Decomposicao: usar passos existentes da tarefa
- Ajuda: "Vamos comecar pelo primeiro passo pendente"
- Retorno: "Voce parou em [tarefa]. Quer continuar?"

Fallback e VERDADEIRO e UTIL, nao tenta parecer inteligente.

---

## 22. REAPROVEITAR DA IMPLEMENTACAO ATUAL

| Componente | Reaproveitar | Como |
|---|---|---|
| execution_session table | SIM | Persistencia de sessoes |
| lastCheckinSentAt | SIM | Anti-spam notificacoes |
| LocalExecutionSession | SIM | CRUD de sessoes |
| actions.ts (7 actions) | SIM | Logica de negocio |
| AI providers | SIM | Decomposicao e sugestoes |
| lib/ai/* | SIM | Interface e factory |
| Cron check-in | SIM | Notificacoes push |
| Mascot events | SIM | Reacoes visuais |
| Store + Context | SIM | Simplificados |

---

## 23. O QUE REMOVER

| Item | Por que |
|---|---|
| activeIntentions table | Redundante com executionSession.taskId |
| IntentionBanner | Assistant widget cumpre esse papel |
| ExecutionFloatingBar | Card mostra execucao |
| ExecutionPanel | Passos ja existem em task.steps |
| mascotBubble | Assistant widget e a voz |
| start-with-me-button | Integrar ao "Comecar" existente |
| companionState (7 estados) | Reduzir para 3 |
| executionSession.steps | Passos vivem em task.steps |
| executionSession.mascotMessage | Mensagens transient |

---

## 24. O QUE REFATORAR

| Area | Mudanca |
|---|---|
| ExecutionSession model | Remover steps e mascotMessage. Manter currentStepIndex. |
| Provider | Expoe: session, startSession, toggleStep, pause, resume, complete, getHelp. Remove companionState, panelOpen, mascotMessage. |
| Store | Reduzir para: session, intention. |
| AssistantService | Adicionar executionSession ao snapshot. |
| Assistant widget | Contexto de execucao + microacoes. |
| Task card | Modo execucao com passos e progresso. |
| Fallback provider | Reduzir de 150 para ~20 frases uteis. |

---

## 25. ARQUIVOS AFETADOS

### Alta prioridade

- `src/features/tasks/components/tasks-list/card/index.tsx`
- `src/features/assistant/components/widget/index.tsx`
- `src/features/assistant/services/assistant-service.ts`
- `src/features/assistant/services/insight-provider.ts`

### Media prioridade (remocao)

- `src/features/execution-companion/components/execution-floating-bar/`
- `src/features/execution-companion/components/execution-panel/`
- `src/features/execution-companion/components/intention-banner/`
- `src/features/execution-companion/components/start-with-me-button/`
- `src/features/tasks/components/tasks-list/index.tsx`
- `src/app/home/layout.tsx`

### Baixa prioridade (refatoracao)

- `src/db/schema.ts`
- `src/features/execution-companion/domain/types.ts`
- `src/features/execution-companion/execution-companion-store.ts`
- `src/features/execution-companion/execution-companion-context.tsx`
- `src/features/execution-companion/data/local-execution-session.ts`
- `src/features/execution-companion/actions.ts`

### Manter

- `src/lib/ai/*`
- `src/app/api/cron/execution-checkin/route.ts`

---

## 26. EVITAR QUE O MASCOTE BLOQUEIE ELEMENTOS

### Solucao atual (parcial)

- pointer-events: none no stage
- pointer-events: auto apenas no wrapper do sprite
- computeViewportBounds recalcula limites
- Narrow content mode confina pet a um canto

### O que melhorar

- Pet nao deve andar sobre cards com execucao ativa
- Limites de movimentacao devem considerar area do card ativo
- Em mobile: pet em canto fixo (ja implementado em narrow mode)
- Z-index do pet deve ser menor que z-index de botoes e inputs criticos

---

## 27. FLUXO COMPLETO DA V1

### Usuario entra no Gerencie-se

1. Layout carrega, busca executionSession ativa/paused
2. Se existe sessao pausada: assistant widget mostra "Voce parou em [tarefa]. Quer continuar?"
3. Se nao existe: assistant widget mostra insights normais (tarefas atrasadas, habitos, etc.)
4. Mascote anda pela tela normalmente

### Usuario decide comecar uma tarefa

1. Clica "Comecar" no card
2. workStatus = "em andamento"
3. Se tarefa e complexa e sem passos: assistant sugere decomposicao
4. Se aceita: Gemini gera passos salvos em task.steps
5. Card mostra passos com proximo destacado
6. executionSession criada
7. Mascote reage (happy)

### Execucao normal

1. Card mostra passos, progresso, proximo passo destacado
2. Assistant widget: "Voce esta em: [tarefa] — passo X de Y"
3. Mascote presente visualmente, sem falar
4. Usuario trabalha sem interrupcao

### Usuario completa um passo

1. Marca passo como feito no card
2. toggleStep atualiza currentStepIndex
3. Proximo passo e destacado
4. Mascote reage sutilmente (happy)
5. Se todos concluidos: sessao completa, comemoracao

### Usuario trava

1. Clica "Pedir ajuda" no card
2. Assistant: "Travou em [passo]?"
3. [Nao] [Sim]
4. Se sim: Gemini gera microacao
5. "Tenta [sugestao]"
6. Some

### Usuario se distrai e volta

1. Navegou para outra pagina ou fechou aba
2. Session continua ativa
3. Volta ao Gerencie-se
4. Assistant: "Voce parou em [tarefa]. Quer continuar?"
5. Clica "Continuar"
6. Volta ao ponto onde parou

### Conclusao

1. Todos os passos marcados
2. Session = completed
3. Mascote comemora (celebrate)
4. 15 XP
5. Card volta ao normal
6. Assistant: 1 frase de conclusao

---

## 28. PLANO INCREMENTAL

### Etapa 1: Limpeza (seguro, sem mudanca de UX)

1. Remover IntentionBanner e integracao em tasks-list
2. Remover mascotBubble da ExecutionFloatingBar
3. Remover botoes de acao do footer do ExecutionPanel
4. Corrigir taskTitle vazio no context
5. Simplificar companionState para 3 estados

### Etapa 2: Integrar execucao ao card (moderado)

1. Adicionar "modo execucao" ao card da tarefa
2. Mostrar passos da tarefa com progresso no card
3. Destacar proximo passo pendente
4. Adicionar "Pedir ajuda" e "Terminei" no card
5. Remover ExecutionFloatingBar e ExecutionPanel

### Etapa 3: Conectar ao assistant (moderado)

1. AssistantService inclui executionSession no snapshot
2. Assistant widget mostra contexto de execucao
3. Assistant oferece microacoes e ajuda
4. Insight-provider gera insights de execucao

### Etapa 4: Simplificar dados (seguro)

1. Remover tabela activeIntentions
2. Remover campo steps de executionSession
3. Remover campo mascotMessage de executionSession
4. Simplificar store e context

### Etapa 5: Decomposicao sob demanda (complexo)

1. "Comecar" em tarefa complexa oferece decomposicao
2. Gemini gera passos salvos em task.steps
3. Fallback usa passos existentes
4. Atualizar AGENTS.md e docs

---

**FIM DO DIAGNOSTICO**
