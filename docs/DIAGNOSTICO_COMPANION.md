# DIAGNOSTICO — Execution Companion como Companheiro Contextual

**Status:** Analise somente. Nenhum arquivo foi alterado.
**Base:** Codigo real do Gerencie-se-v2, explorado em profundidade.

---

## 1. COMO O FLUXO IMPLEMENTADO FUNCIONA ATUALMENTE

### O que acontece quando o usuario clica "Comecar comigo"

1. O botao StartWithMeButton no card da tarefa chama startSession(taskId)
2. O ExecutionCompanionProvider chama startExecutionSessionAction (server action)
3. A action busca a tarefa, a personalidade do mascote, chama provider.decomposeTask() com Gemini
4. Gemini retorna 3-12 passos + primeira mensagem do mascote
5. Uma executionSession e criada no DB com passos em JSON
6. Uma activeIntention e criada (upsert) registrando qual tarefa o usuario pretende fazer
7. 5 XP sao creditados ao mascote
8. No client: store populado, companionState = "working", painel abre, barra flutuante aparece

### O que o usuario ve depois de iniciar

- Barra flutuante no rodape: passo atual, "X de Y passos", barra de progresso, botoes (ajuda, pausar, concluir)
- Balao do mascote acima da barra: exibe mensagem do Gemini
- Painel lateral (mobile: bottom sheet): lista de passos com checkboxes, badge "Agora", botoes Pausar/Terminei/Sair
- Banner de intencao no topo da lista de tarefas: "Voce estava fazendo: [tarefa]. Continuar? Terminei? Me distrai?"

### O que acontece quando o usuario navega entre paginas

- ExecutionCompanionProvider esta no layout (home/layout.tsx), persiste
- Barra flutuante e painel sao renderizados no layout, visiveis em todas as paginas /home/*
- Store Zustand mantem estado em memoria (nao persiste em localStorage)
- Apos refresh, server busca getActiveOrPaused() + getActiveIntention() e passa como props iniciais

### O que acontece quando o usuario completa todos os passos

- toggleExecutionStepAction detecta todos concluidos
- Chama repo.complete(), limpa intencao, creditando 15 XP, emite "execution-completed"
- companionState = "completed", apos 3s store e resetado
- Barra flutuante e painel desaparecem

---

## 2. O QUE FICOU BOM

### 2a. Infraestrutura de dados e solida
- executionSession e activeIntention sao tabelas bem estruturadas
- Data layer (LocalExecutionSession) tem CRUD completo com autorizacao por userId
- Serializacao JSON dos passos e pragmatistica e funciona
- Upsert de intencao garante apenas uma intencao ativa por usuario

### 2b. Fallback sem Gemini funciona
- FallbackAssistantProvider com 150 mensagens garante que a feature nunca quebra
- Factory em src/lib/ai/index.ts escolhe automaticamente o provider certo
- Degradacao graciosa e um bom padrao arquitetural

### 2c. System prompt do Gemini e de qualidade
- Regras "fale como pessoa brasileira", "evite linguagem de chatbot" sao boas
- Personalizacao por personalidade do mascote e um diferencial real
- Verificacao final "Isso parece algo que uma pessoa diria?" e boa barreira

### 2d. Integracao com o mascote existe
- 6 eventos novos adicionados ao event bus (execution-started, step-done, stuck, distracted, resumed, completed)
- Mascote PixiJS reage visualmente (celebrate, happy, sad)
- XP creditado ao iniciar e concluir

### 2e. Notificacao push por cron funciona
- Rota /api/cron/execution-checkin segue padrao dos outros crons
- Anti-spam via lastCheckinSentAt e boa mecanica
- Logica de 30+ min ativa / 15+ min pausada faz sentido

---

## 3. ONDE A EXPERIENCIA ESTA CONFUSA E POR QUE

### 3a. A experiencia parece um sistema separado dentro do Gerencie-se

Quando o usuario clica "Comecar comigo", ele sente que entrou em "outro sistema". Barra flutuante, painel, banner — tudo aparece de uma vez, como uma camada sobreposta. Nao ha transicao natural entre "organizando tarefas" e "executando algo".

O problema e que o Execution Companion foi implementado como um MODULO com sua propria UI (barra, painel, banner, store, context) em vez de ser um COMPORTAMENTO do produto existente.

### 3b. Tres UIs diferentes mostrando a mesma informacao

- Barra flutuante: passo atual, progresso, acoes
- Painel lateral: lista de passos, progresso, acoes
- Banner de intencao: "voce estava fazendo X", acoes

Todas tres competem pela atencao. O banner aparece no topo, a barra no rodape, o painel por cima dos dois. Informacao demais para um conceito simples.

### 3c. O mascote virou um widget de chat

A mascotBubble na barra flutuante exibe mensagens do Gemini como um chat. O mascote "fala" ao iniciar, pausar, retomar, travar. Transforma a experiencia em assistente virtual, nao em companheiro que acompanha.

### 3d. O fluxo pausa/retomada e complexo demais

3 formas de pausar (barra, painel, banner "me distrai" que na verdade ABANDONA).
3 formas de retomar (barra, painel, banner).
O usuario nao precisa de 3 caminhos para a mesma acao.

### 3e. "Me distrai" abandonar e contraintuitivo

O botao "Me distrai" no IntentionBanner chama abandonSession(), que permanentemente abandona a sessao. Mas "me distrai" soa como "pausei por um momento". O usuario esperaria poder voltar depois.

### 3f. O taskTitle no client fica vazio

Em execution-companion-context.tsx linha 98: setIntention({ taskId, taskTitle: "" }) — passa taskTitle vazio. O titulo real so aparece apos refresh (quando o server busca do DB e passa como initialIntention).

### 3g. A decomposicao pelo Gemini cria passos redundantes com os passos da tarefa

A action startExecutionSessionAction envia existingSteps (passos ja existentes na tarefa) para o Gemini, mas o Gemini retorna NOVOS passos baseados no titulo/descricao. O usuario pode ter 2 listas de passos conflitantes: a da tarefa e a da sessao.

### 3h. A notificacao do cron pode enviar mensagem errada

Em execution-checkin/route.ts, a logica de selecionar mensagem baseada em minutesSinceUpdate pode nao bater com as queries acima. Uma sessao paused com 16 min de stale cai no branch "ativo" e recebe "Como ta indo?" em vez de "Quando quiser voltar".

---

## 4. O QUE ESTA COMPLEXO SEM NECESSIDADE

### 4a. O modelo de estados e grande demais

O ExecutionCompanionStore tem 6 estados para companionState: idle, starting, working, thinking, distracted, paused, completed. A maioria sao estados de carregamento transitorios que o usuario nao deveria ver. Para o usuario, existem apenas 3 estados reais: "fazendo", "pausado", "feito".

### 4b. O payload do server action para criar sessao e pesado

startExecutionSessionAction faz 6 operacoes em sequencia:
1. Valida com Zod
2. Busca a tarefa
3. Verifica sessao existente
4. Busca o mascote para personalidade
5. Chama Gemini para decompor
6. Cria sessao + intencao + XP

Tudo isso ANTES de o usuario ver qualquer feedback visual. O botao fica "loading" durante todo esse tempo.

### 4c. O sistema de eventos do mascote e acoplado

6 eventos novos foram adicionados diretamente em actions.ts via emitMascotEvent(). Eles acoplam o modulo de execucao ao motor do mascotePixiJS. Se o mascote for substituido ou removido, os actions precisam ser alterados.

### 4d. O FallbackProvider retorna passos genericos

Sem Gemini, decomposeTask() retorna sempre: "Comecar pela primeira parte", "Continuar com o proximo pedaco", "Finalizar e revisar". Independente da tarefa. Isso e uma degradacao enorme.

---

## 5. O QUE PARECE TER SIDO IMPLEMENTADO LITERALMENTE POR CAUSA DO PROMPT

### 5a. "Comecar comigo" como botao separado nos cards

O prompt pedia um botao "Comecar comigo" nos cards. Foi implementado literalmente como um botao dedicado ao lado do botao "Comecar" existente. Agora o card da tarefa tem DOIS botoes de inicio: "Comecar comigo" (execution companion) e "Comecar" (work status da tarefa). Sao conceitos concorrentes.

### 5b. Painel flutuante como modulo isolado

O prompt descrevia um "painel flutuante com passos". Foi implementado como um component React completo com seu proprio CSS, store, context. Mas a tarefa ja tem um conceito de "steps" (task-steps) com UI propria. Agora existem dois sistemas de passos paralelos.

### 5c. Active Intention como tabela separada

O prompt descrevia "intencao ativa". Foi implementado como uma tabela separada (activeIntentions) com relacao one-to-one por usuario. Mas a executionSession ja tem taskId. A intencao e redundant com a sessao ativa.

### 5d. Banner de intencao como componente proprio

O prompt descrevia "banner mostrando que o usuario estava fazendo algo". Foi implementado como um componente proprio com 3 botoes de acao. Mas a barra flutuante ja mostra a mesma informacao e tem os mesmos botoes.

### 5e. Balao de fala do mascote na barra flutuante

O prompt descrevia "o mascote reage a cada acao". Foi implementado como um balao de chat permanente acima da barra flutuante. Mas o mascote JA tem um widget de fala proprio (o Assistant widget). Agora existem DOIS locais onde o mascote "fala".

### 5f. Cron de check-in como feature completa

O prompt descrevia "notificacoes push lembram de sessoes paradas". Foi implementado como uma rota cron completa com queries complexas. Mas a logica de " sessao parada" ja poderia ser tratada pelo assistant widget existente (que ja observa tarefas atrasadas).

---

## 6. O QUE VOCE REMOVERIA

### 6a. IntentionBanner (componente inteiro)

Remove. A barra flutuante ja mostra o estado da sessao e tem botoes de acao. O banner duplica informacao e compete pela atencao. A intencao continua existindo no backend (nao precisa de tabela separada — basta o campo taskId na executionSession).

### 6b. mascotBubble na ExecutionFloatingBar

Remove. O mascote ja tem seu proprio widget (Assistant). Exibir um segundo balao de chat na barra flutuante cria confusao. O mascote pode reagir visualmente (animacao) sem precisar "falar" em dois locais.

### 6c. Botoes de acao duplicados na barra flutuante e no painel

Mantem UM so lugar de acao. A barra flutuante pode mostrar progresso e permitir acoes rapidas (pausar, concluir). O painel pode ser apenas visualizacao dos passos, sem botoes de acao no footer.

### 6d. Estados transitorios no companionState

Reduz para 3 estados visiveis: active, paused, completed. Os estados "idle", "starting", "thinking", "distracted" sao internos e nao deveriam expor-se ao usuario.

### 6e. Tabela activeIntentions

Remove como tabela separada. A executionSession ja tem taskId. A "intencao ativa" e simplesmente: existe uma executionSession com status active ou paused para este usuario. Nao precisa de entidade separada.

---

## 7. O QUE VOCE COMBINARIA

### 7a. Comecar comigo + Comecar

Combina. O botao "Comecar comigo" e o botao "Comecar" representam a mesma ideia: iniciar uma tarefa. A diferenca e que um cria uma executionSession e o outro atualiza workStatus. Poderiam ser o MESMO botao com comportamento escalonado: primeiro clica, depois o companheiro oferece decomposicao se fizer sentido.

### 7b. Barra flutuante + Painel

Combina em um so componente. A barra flutuante pode ser o estado compacto (mostra passo atual + progresso). Ao clicar nela, expande para mostrar a lista completa de passos. Um componente, dois estados de visualizacao.

### 7c. Assistant widget + ExecutionCompanion

Combina. O assistant widget JA e o companheiro do usuario. Quando ha uma sessao ativa, o widget pode mostrar contexto da execucao em vez de insights genericos. Nao precisa de um segundo sistema de "fala do mascote".

### 7d. Eventos do mascote + Eventos de execucao

Combina. Os 6 eventos execution-* podem ser tratados pelo mesmo mecanismo que ja processa task-completed, habit-completed, etc. Nao precisa de um subsistema paralelo.

---

## 8. O QUE MANTERIA

### 8a. executionSession como tabela e data layer

Mantem. E uma boa infraestrutura para rastrear execucoes com passos, progresso e timestamps.

### 8b. A funcao de decomposicao do Gemini

Mantem. Decompor uma tarefa em passos pequenos e uma utilidade real. Mas so deve ser chamada quando o usuario PEDE (ou quando a tarefa e complexa o suficiente), nao sempre que clica "comecar".

### 8c. O system prompt do Gemini com personalidade

Mantem. E de alta qualidade e gera respostas naturais.

### 8d. O fallback provider

Mantem. Degradacao graciosa e essencial.

### 8e. A rota de check-in por cron

Mantem. Notificacoes para sessoes abandonadas sao uteis.

### 8f. A integracao com XP do mascote

Mantem. Creditar XP por execucao e motivador e consistente com o sistema existente.

### 8g. Os eventos do mascote (execution-started, etc.)

Mantem. O mascote reagir visualmente a eventos de execucao e natural.

### 8h. O context/provider no layout

Mantem. Manter o estado de execucao disponivel em todas as paginas e correto.

---

## 9. COMO DEVERIA SER O PAPEL DO MASCOTE

### Presenca, nao conversa

O mascote deve ser uma presenca visual que acompanha a execucao. A maior parte do tempo, ele esta simplesmente LA — no canto da tela, fazendo suas animacoes, reagindo sutilmente.

### Falar apenas quando fizer sentido

Momentos que justificam fala do mascote:
- INICIO: "Vamos comecar por [primeiro passo]." (1 frase)
- RETORNO DE DISTRACAO: "Voce parou em [contexto]. Quer continuar?" (1 frase)
- DIFICULDADE: "Vamos simplificar. Qual e a menor coisa que da pra fazer agora?" (quando o usuario pede ajuda)
- CONCLUSAO: Reacao visual (celebrate), sem necessarily falar.

Durante execucao normal: SILÊNCIO + presenca visual. Nao precisa ficar perguntando coisas.

### Nao ser um chatbot

O mascote NAO deve:
- Ter historico de conversa
- Exigir interacao constante
- Responder a cada clique
- Ter uma janela de chat permanente
- Ser confundido com o assistant widget existente

### Integrar ao assistant existente

O assistant widget JA e a "voz" do mascote. Quando ha sessao ativa, o widget pode mostrar contexto da execucao. Nao precisa de um segundo sistema de fala.

---

## 10. COMO DEVERIA SER O PAPEL DO GEMINI

### Gemini como servico sob demanda, nao como controlador

Gemini so deve ser chamado quando produz algo melhor que uma regra deterministica:

- DECOMPOSICAO de tarefa complexa em passos (sim — regra simples nao consegue)
- SUGESTAO contextual quando o usuario trava (sim — precisa entender o contexto)
- RECUPERACAO apos distracao com frase personalizada (sim — mas pode ter fallback)
- MENSAGEM de inicio (sim — mas pode ser hardcoded por personalidade)

Gemini NAO deve:
- Decidir quando o usuario comeca ou termina
- Controlar a navegacao
- Alterar dados no banco
- Gerar toda a interface
- Substituir regras simples

### Fallback deterministico para tudo

Para cada chamada ao Gemini, deve existir uma versao deterministica:
- Decomposicao: usar os passos existentes da tarefa (ou passos genericos)
- Mensagem de inicio: frase fixa por personalidade
- Ajuda quando trava: "Vamos comecar pelo primeiro passo"
- Retorno apos distracao: "Voce estava em [titulo da tarefa]. Quer continuar?"

---

## 11. FLUXO IDEAL DO USUARIO, DO INICIO A CONCLUSAO

### Cenario 1: Usuario decide comecar uma tarefa simples

1. Usuario ve a tarefa na lista
2. Clica "Comecar" (botao existente)
3. A tarefa muda de status para "em andamento" (workStatus, ja existe)
4. O mascote reage visualmente (animacao happy)
5. Nao ha decomposition, nao ha painel, nao ha barra flutuante
6. O usuario faz a tarefa normalmente
7. Marca como concluida (botao existente)
8. Mascote comemora (celebrate)

Nenhuma mudanca na experiencia atual. O Execution Companion so entra quando a tarefa e COMPLEXA.

### Cenario 2: Usuario decide comecar uma tarefa complexa

1. Usuario ve a tarefa na lista
2. Clica "Comecar"
3. O mascote percebe que a tarefa e complexa (muitos passos existentes, ou titulo vago, ou alta prioridade)
4. Uma UNICA sugestao aparece, integrada ao card: "Quer que eu te ajude a dividir isso?"
5. Se o usuario aceita:
   a. Gemini decompoem em 3-6 passos
   b. Os passos aparecem no card da tarefa (usando a UI de task-steps que ja existe)
   c. O mascote reage visualmente
   d. O primeiro passo e destacado
6. O usuario clica no primeiro passo, executa, marca como feito
7. O proximo passo e destacado automaticamente
8. Assim por diante
9. Quando todos os passos estao feitos, a tarefa e concluida automaticamente

### Cenario 3: Usuario volta apos interrupcao

1. Usuario abre o Gerencie-se
2. Existe uma executionSession ativa ou pausada
3. O assistant widget mostra: "Voce parou em [tarefa]. Quer continuar?"
4. O usuario clica "Continuar"
5. Os passos da tarefa estao la, com o proximo pendente destacado
6. O usuario continua de onde parou

### Cenario 4: Usuario trava

1. Usuario esta em um passo e nao avanca ha algum tempo
2. O mascote reage visualmente (animacao sutil de "pergunta")
3. O usuario clica no mascote ou no assistant widget
4. Uma sugestao contextual aparece: "Vamos simplificar. [sugestao do Gemini baseada no contexto]"
5. O usuario decide como proceder

---

## 12. COMO SIMPLIFICAR A INTERFACE

### Principio: UM estado visual, nao tres

Em vez de barra flutuante + painel + banner, apenas:

1. **O card da tarefa** se transforma quando esta "em execucao" — mostra passos, progresso, proximo passo destacado
2. **O assistant widget** mostra contexto da execucao quando ha sessao ativa
3. **Nao ha barra flutuante separada** — o progresso esta no card
4. **Nao ha painel lateral** — a lista de passos ja existe na UI de task-steps
5. **Nao ha banner** — o assistant widget cumpre esse papel

### O que muda na pratica

- O card da tarefa ganha um "modo execucao" quando ha uma sessao ativa
- Nesse modo, os passos sao visiveis diretamente no card (sem precisar abrir modal)
- O proximo passo pendente e destacado com cor/icone
- Um botao "Pedir ajuda ao mascote" aparece quando o usuario esta travado
- O assistant widget mostra "Voce esta em: [tarefa] — passo [X] de [Y]"

### O que e removido

- ExecutionFloatingBar (componente)
- ExecutionPanel (componente)
- IntentionBanner (componente)
- mascotBubble (elemento)
- companionState no store (simplificado)
- A barra flutuante no layout
- O painel no layout

### O que e reutilizado

- executionSession (tabela e data layer) — como infraestrutura interna
- actions (start, pause, resume, complete, abandon, toggleStep, getHelp) — como server actions
- AI provider (gemini-provider + fallback) — para decomposicao e sugestoes
- Eventos do mascote — para reacoes visuais
- Cron de checkin — para notificacoes

---

## 13. QUEIS PARTES DA IMPLEMENTACAO ATUAL PODEM SER REAPROVEITADAS

| Componente/Arquivo | Reaproveitavel? | Como |
|---|---|---|
| executionSessions table | SIM | Infraestrutura de persistencia de execucao |
| activeIntentions table | NAO | Remover — executionSession ja tem taskId |
| LocalExecutionSession data layer | SIM | CRUD de sessoes com passos |
| actions.ts (7 server actions) | SIM | Logica de negocio ja pronta |
| execution-companion-store.ts | SIM (simplificado) | Manter session, intention, panelOpen. Remover companionState |
| execution-companion-context.tsx | SIM (simplificado) | Manter startSession, toggleStep, getHelp, pause, resume, complete |
| gemini-provider.ts | SIM | System prompt e bom, metodos uteis |
| fallback-provider.ts | SIM | 150 mensagens, degradacao graciosa |
| lib/ai/index.ts | SIM | Factory de provider |
| lib/ai/types.ts | SIM | Interface e schemas Zod |
| execution-checkin/route.ts | SIM | Cron de notificacoes |
| start-with-me-button/ | NAO | Remover — integrar ao botao "Comecar" existente |
| execution-floating-bar/ | NAO | Remover — substituir por modo execucao no card |
| execution-panel/ | NAO | Remover — passos ja existem em task-steps |
| intention-banner/ | NAO | Remover — assistant widget cumpre esse papel |
| events.ts (execution events) | SIM | Manter — mascote reage visualmente |

---

## 14. QUAIS ARQUIVOS PRECISARIAM SER ALTERADOS

### Alta prioridade (mudancas de experiencia)

- src/features/tasks/components/tasks-list/card/index.tsx — integrar modo execucao ao card
- src/features/assistant/components/widget/index.tsx — mostrar contexto de execucao no widget
- src/features/assistant/services/insight-provider.ts — gerar insights de execucao
- src/app/home/layout.tsx — simplificar provider nesting

### Media prioridade (remocao de componentes)

- src/features/execution-companion/components/execution-floating-bar/ — remover
- src/features/execution-companion/components/execution-panel/ — remover
- src/features/execution-companion/components/intention-banner/ — remover
- src/features/execution-companion/components/start-with-me-button/ — remover
- src/features/tasks/components/tasks-list/index.tsx — remover IntentionBanner

### Baixa prioridade (limpeza de dados)

- src/db/schema.ts — remover activeIntentions table, adicionar lastCheckinSentAt se nao existir
- src/features/execution-companion/domain/types.ts — remover CompanionAction, simplificar estados
- src/features/execution-companion/execution-companion-store.ts — simplificar
- src/features/execution-companion/execution-companion-context.tsx — simplificar

### Infraestrutura (manter como esta)

- src/lib/ai/* — manter
- src/features/execution-companion/actions.ts — manter
- src/features/execution-companion/data/local-execution-session.ts — manter
- src/app/api/cron/execution-checkin/route.ts — manter

---

## 15. PLANO INCREMENTAL PARA IMPLEMENTAR A V1

### Etapa 1: Remover complexidade desnecessaria (seguro)

1. Remover IntentionBanner e sua integracao em tasks-list/index.tsx
2. Remover mascotBubble da ExecutionFloatingBar
3. Remover botoes de acao do footer do ExecutionPanel (manter apenas visualizacao)
4. Simplificar companionState para 3 estados (active, paused, completed)
5. Corrigir o bug do taskTitle vazio no context

### Etapa 2: Integrar execucao ao card da tarefa (moderado)

1. Adicionar "modo execucao" ao card da tarefa quando ha sessao ativa
2. Mostrar passos da sessao diretamente no card (usando logica similar a task-steps)
3. Destacar o proximo passo pendente
4. Adicionar botao "Pedir ajuda" no card (chama getHelpWhenStuckAction)
5. Mover barra de progresso para dentro do card

### Etapa 3: Conectar ao assistant widget (moderado)

1. Quando ha sessao ativa, o assistant widget mostra contexto: "Voce esta em: [tarefa]"
2. O assistant widget pode mostrar a mensagem do mascote em vez de um segundo balao
3. O insight-provider gera insights de execucao (tarefa parada ha muito tempo, proximo passo)

### Etapa 4: Integrar decomposicao ao fluxo existente (complexo)

1. Quando o usuario clica "Comecar" em uma tarefa complexa, oferecer decomposicao
2. Usar os passos existentes da tarefa (task.steps) quando ja existem
3. Chamar Gemini apenas quando a tarefa nao tem passos ou e muito vaga
4. A decomposicao salva os passos na propria tarefa (nao em executionSession)

### Etapa 5: Limpeza final (seguro)

1. Remover tabelas activeIntentions
2. Simplificar o store e context
3. Remover componentes nao utilizados
4. Atualizar AGENTS.md e docs

---

## 16. VERSAO SIMPLIFICADA E COERENTE DA EXPERIENCIA

### Principio central

O Gerencie-se ja e um produto funcional. O companheiro contextual deve ser uma CAMADA INVISIVEL que melhora a experiencia sem transformar o produto em algo diferente.

### Como funciona na pratica

**Antes de comecar:**
- O usuario ve suas tarefas normalmente
- O assistant widget mostra insights relevantes (tarefas atrasadas, habitos em risco, etc.)
- Se existe uma sessao pausada, o widget mostra: "Voce parou em X"

**Ao comecar uma tarefa:**
- O usuario clica "Comecar" (botao existente)
- Se a tarefa e complexa e o mascote pode ajudar, uma sugestao aparece: "Quer que eu divida isso?"
- Se o usuario aceita, Gemini decompoem e os passos aparecem no card
- O mascote reage visualmente (animacao happy)

**Durante a execucao:**
- O card da tarefa mostra os passos e o progresso
- O mascote esta presente visualmente (PixiJS pet)
- O assistant widget mostra "Voce esta em: [tarefa] — passo X de Y"
- O usuario trabalha normalmente, sem interromper o fluxo

**Se o usuario travar:**
- Ele clica "Pedir ajuda" ou interage com o mascote
- Gemini gera uma sugestao contextual baseada no passo atual
- A sugestao aparece no assistant widget (nao em um chat separado)

**Se o usuario se distrair e voltar:**
- O assistant widget mostra: "Voce parou em [tarefa]. Quer continuar?"
- O usuario clica e volta ao ponto onde parou

**Ao concluir:**
- Todos os passos marcados = tarefa concluida automaticamente
- Mascote comemora (celebrate)
- XP creditado
- Sessao finalizada no backend

### O que NAO existe nessa versao

- Barra flutuante separada
- Painel lateral de execucao
- Banner de intencao
- Balao de chat do mascote na barra
- 3 formas de fazer a mesma coisa
- "Comecar comigo" como botao separado
- Estados transitorios visiveis ao usuario
- Tabela activeIntentions separada

### O que EXISTE nessa versao

- Um botao "Comecar" que funciona como sempre funcionou
- Uma sugestao de decomposicao quando faz sentido
- Passos visiveis diretamente no card da tarefa
- O assistant widget mostrando contexto de execucao
- O mascote reagindo visualmente
- Gemini chamado sob demanda com fallback deterministico
- Persistencia de sessao para retomada
- Notificacao push para sessoes abandonadas

---

**FIM DO DIAGNOSTICO**
