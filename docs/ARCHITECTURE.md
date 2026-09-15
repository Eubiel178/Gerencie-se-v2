# Arquitetura do Gerencie-se

Este documento descreve a organização atual do produto. Ele é um mapa de
manutenção, não uma especificação de funcionalidades futuras.

## Visão geral

O Gerencie-se é uma aplicação pessoal de organização e bem-estar. A área
autenticada está sob `/home`; autenticação, recuperação de acesso e a landing
page ficam fora dela.

As áreas de produto são: painel, tarefas, rotina, hábitos, objetivos, foco,
calendário, leitura, corrida, hidratação, saúde, ciclo menstrual,
estatísticas e configurações. O ciclo só aparece na navegação para perfis que
o habilitaram nas configurações.

## Stack

- Next.js (App Router) e React com TypeScript estrito.
- PostgreSQL acessado com Drizzle ORM.
- Auth.js para sessão e provedores de autenticação.
- React Hook Form e Zod para formulários e validação.
- Zustand para estados compartilhados de interface que precisam sobreviver a
  interações dentro da página.
- CSS Modules e tokens CSS em `src/design-system/tokens`; Tailwind não é
  utilizado.

## Organização do código

```
src/app/                 rotas, layouts, endpoints HTTP e estados de rota
src/features/<domínio>/  UI e regras de cada área do produto
src/components/          componentes reutilizáveis de interface
src/design-system/       tokens, tema e regras globais de movimento
src/lib/                 infraestrutura compartilhada (auth, banco, serviços)
src/validation/          schemas de entrada compartilhados
src/hooks/               hooks genéricos de cliente
```

Em um domínio maior, o fluxo esperado é:

```
Página/Componente → Server Action ou endpoint → repositório → Drizzle/PostgreSQL
```

As Server Actions devem validar entradas no servidor, obter o usuário atual e
limitar leituras/escritas ao respectivo proprietário antes de alterar dados.

## Dados e atualização da interface

As páginas de dados são renderizadas no servidor quando possível. Ações de
criar, editar e remover persistem no servidor e invalidam a rota afetada.
Tarefas e eventos também possuem stores de cliente para manter a interface
responsiva durante interações locais. Não crie uma store global por padrão:
use estado local quando os dados não forem compartilhados.

## Design e responsividade

Os tokens de cor, espaço, tipografia, raio, elevação e movimento são a fonte
de verdade visual. Componentes novos não devem adicionar cores soltas.

A navegação principal é uma sidebar em telas amplas e um painel de menu em
até 720px. O painel mantém todas as rotas acessíveis sem depender de hover.
Modais devem continuar utilizáveis em mobile; o componente base já os adapta
para uma apresentação de bottom sheet em telas pequenas.

Animações precisam ter objetivo de feedback ou orientação e respeitar
`prefers-reduced-motion` por meio de `src/design-system/tokens/motion.css`.

## Integrações e limites de segurança

- Google: login, conexão opcional ao Calendar, e e-mails transacionais (via Gmail SMTP, quando configurado).
- Edge TTS: fala opcional do mascote, limitada a 280 caracteres no endpoint.
- Uploads: endpoints específicos de anexos, com validação de tipo e tamanho.

Segredos pertencem exclusivamente às variáveis de ambiente. Nunca exponha
chaves de integração em componentes de cliente. Antes de adicionar um endpoint
ou Action, valide dados, autenticação e autorização no servidor.

## Qualidade local

```bash
npm run lint
npm test
npm run build
```

Os testes atuais priorizam regras de domínio, cálculo de métricas, filtros,
exportação e validações puras. Ao corrigir um bug de regra de negócio, acrescente
um teste de unidade reproduzindo o caso antes ou junto da correção.

## Decisões vigentes

- Não usar Tailwind em código novo.
- Preferir CSS Modules e tokens existentes a uma segunda estratégia de estilos.
- Manter PixiJS, quando usado pelo mascote, isolado da interface React comum.
- Não aplicar migrações destrutivas sem inventário de dependências e estratégia
  de reversão ou compatibilidade.

## Auditoria arquitetural de 2026-09

Uma auditoria completa (leitura de todas as features de produto, das rotas de
API, do schema e da camada compartilhada) confirmou que a estrutura acima já é
adequada ao tamanho e ao estágio do produto. **Decisão: manter o monólito
modular em Next.js, sem introduzir microsserviços, backend separado ou troca
de framework/ORM/auth.** Não há, hoje, evidência de necessidade de escala,
deploy ou ownership independentes entre features — o forte acoplamento
relacional do schema (metas ↔ tarefas ↔ hábitos ↔ itens de rotina ↔ sessões de
foco) tornaria uma divisão em serviços cara e sem benefício real.

O padrão já seguido pela maioria das features deve ser o contrato padrão daqui
para frente:

```
domain/   tipos e regras puras (testadas em .test.ts)
data/     repositório Drizzle, "server-only"
actions.ts "use server" — único ponto que componentes de cliente podem chamar
components/ UI de cliente, sem acesso direto a banco
```

Features agregadoras (`dashboard`, `stats`, `weekly-summary`, `export`,
`assistant`, `achievements`) podem importar `domain` e `data/get-*-fetcher` de
outras features, nunca as classes `LocalX` nem o schema Drizzle diretamente.

### Desvios encontrados e o que fazer com cada um

1. **Orquestração de fetchers "duplicada"** — reavaliado (2026-09):
   `dashboard`, `stats`, `weekly-summary` e `src/app/api/export/route.ts`
   cada um monta o próprio `Promise.all`, mas ao comparar os quatro lado a
   lado, nenhum busca o mesmo conjunto: dashboard pega uma visão rápida (6
   fetchers, sem período), stats pega 7 dias + até 28 semanas de histórico
   pros gráficos, weekly-summary pega só os últimos 7 dias pro resumo, e
   export busca TUDO desde sempre (`EPOCH`) de 11 features, sem nenhum
   recorte. Não é duplicação de verdade — é composição legítima e
   diferente por caso de uso. Uma função agregadora compartilhada ou
   sempre buscaria dado que o consumidor não precisa (caro pro dashboard,
   que é a tela mais visitada) ou precisaria de tantos parâmetros pra cobrir
   os 4 casos que ficaria mais complexa que os quatro `Promise.all`
   simples que já existem. Decisão: manter como está — cada consumidor
   continua dono da própria composição, sempre através de
   `data/get-*-fetcher` (nunca do schema direto, e isso já é seguido
   corretamente pelos quatro). Sem mudança de código para este item.
2. ✅ **Resolvido** — Cálculo puro que vazava para arquivos `server-only`
   (`nextDueDate`/`isOverdue` em `health`, `calculateEstimate` em
   `menstrual-cycle`, `haversineMeters`/pace em `running-tracker.tsx`) foi
   movido para `domain/` com teste unitário, no mesmo padrão de `habits`,
   `tasks`, `goals` e `reading` (`due-date.ts`, `cycle-estimate.ts`,
   `live-tracking.ts`).
3. ✅ **Resolvido** — A orquestração comum ao checklist de passos de
   tarefas e de metas (campo de novo título, uma etapa ocupada por vez,
   add/toggle/remove sempre seguidos de `router.refresh()`) foi extraída
   pra `src/hooks/use-step-checklist.ts` (mesmo padrão de `useFormModal`).
   A regra de negócio que diverge entre os dois (metas emitindo evento de
   mascote ao bater 100%) continua só em `goals-list/card`, passada como o
   `toggleStep` que o hook chama — o hook em si não sabe nada disso.
   `tasks/domain/manage-steps.ts` e `goals/domain/manage-steps.ts`
   continuam times de tipos separados de propósito (parâmetros diferentes:
   `taskId` vs. `goalId`) — unificá-los não reduziria código de verdade.
4. ✅ **Resolvido** — Normalização de e-mail (login, cadastro, recuperação
   de senha, convite de compartilhamento) centralizada em
   `src/utils/normalize-email.ts`. Cálculo de "% da meta de hidratação"
   centralizado em `calculateHydrationGoalPercent`
   (`features/hydration/domain/hydration.ts`), reusado pelo tracker e pelo
   mini-widget do dashboard.
5. **Rotas de API inconsistentes** — algumas rotas (`export`, anexos de
   tarefas, `mascot-speech`) delegam para `data/get-*-fetcher`; outras
   (`push/subscribe`, `profile/avatar/[userId]`, rotas de `cron`) fazem
   `select`/`insert` direto no Drizzle dentro do `route.ts`. Não é urgente
   (autenticação/autorização está correta em todas), mas ao tocar nessas
   rotas, mover a consulta para uma função de repositório ao lado do schema,
   em vez de query solta na rota.
6. **Ownership do mascote não é óbvio pelo nome das pastas** —
   `features/focus/domain/mascot.ts` é quem persiste espécie/XP/personalidade
   (porque é o foco que concede XP); `features/mascot-pet` só renderiza
   (engine Pixi, sem lógica de negócio); `features/assistant` consome o estado
   do foco e possui sua própria base de falas de insight
   (`services/insight-phrasing.ts`), separada das falas do modo foco
   (`focus/domain/mascot-lines.ts`). Isso é uma separação legítima (estado ×
   renderização × linguagem), não um erro — mas deve ficar documentado aqui
   para o próximo desenvolvedor não presumir que `mascot-pet` é o dono do
   estado.

### Bug real identificado: Focus Mode mostrando "Foco concluído!" na primeira tentativa

Causa raiz confirmada em `features/focus/data/local-focus-session.ts`
(`LocalFocusSession.start()`): ao iniciar, o método reaproveita qualquer sessão
já `"running"` no banco em vez de criar uma nova (regra existe para nunca haver
duas sessões simultâneas), mas não verifica se essa sessão já *expirou*. Se
sobra uma sessão órfã (aba fechada, hot-reload, queda) cujo prazo já passou, a
primeira tentativa de iniciar adota essa sessão vencida; o tick de
`focus-session-context.tsx` recalcula `remaining = 0` quase imediatamente e
aciona a conclusão automática. Na segunda tentativa a sessão órfã já está
`completed`, então uma sessão nova de verdade é criada — por isso só a primeira
tentativa falha. Correção necessária (não apenas visual): `start()` precisa
detectar uma sessão ativa cujo tempo decorrido já ultrapassou a duração
planejada e finalizá-la (completar/cancelar) antes de decidir reaproveitar ou
criar uma nova sessão. Corrigido em `features/focus/data/local-focus-session.ts`
(`isFocusSessionExpired`, testado em `domain/session-expiry.test.ts`).

### Guided Tour: recarregar a página no meio do tour te jogava de volta pro Dashboard

Achado ao testar a tela de Estatísticas: navegar direto pra qualquer rota
(recarregar a página, digitar a URL, ou um link que force navegação
completa em vez de troca de rota via cliente) com o Guided Tour ainda ativo
sempre reiniciava o progresso pro passo 0 — que aponta pra `/home` — porque
`GuidedTour` (`features/guided-tour/components/guided-tour/index.tsx`) nunca
persistia em qual passo a pessoa estava. Como o próprio tour navega sozinho
pro `path` do passo atual quando ele difere da rota corrente, isso arrastava
de volta pro painel geral qualquer pessoa que tivesse recarregado a página no
meio do tour em qualquer outra rota — inclusive alguém só verificando
Estatísticas antes de terminar/pular o tour. Corrigido guardando o índice do
passo atual em `sessionStorage` (progresso de uma sessão de tour, não uma
preferência — por isso não é `localStorage`), limpo ao terminar o tour, ao
reiniciá-lo ("Ver tutorial novamente") ou quando ele não está ativo. Uma
consequência residual (não é bug, só cosmético): o total de passos exibido
("X de Y") pode encolher num recarregamento fora de `/home`, porque a lista
de passos é recalculada a partir da página atual e alguns passos sem `path`
próprio (ex.: "nav", "mascot") só existem enquanto o alvo deles estiver
presente na tela.

### Focus Mode: escolher a tarefa direto na tela de Foco

Antes só era possível associar uma tarefa a uma sessão de foco vindo da tela
de Tarefas ("Focar nesta tarefa" → `?taskId=`). Agora `Focus`
(`features/focus/index.tsx`) também carrega as tarefas pendentes do usuário e
`Timer` mostra um seletor ("Focar em uma tarefa (opcional)") quando nenhuma
tarefa já veio pré-selecionada pela URL — sem exigir ir à tela de Tarefas
primeiro. Uma tarefa pré-selecionada via URL continua tendo prioridade (o
seletor não aparece nesse caso, para não sugerir uma escolha redundante).

### Mascote-companhia podia congelar em cima de conteúdo no modo quieto

Achado ao testar a mudança acima: o mascote ambiente (`features/mascot-pet`)
nasce no centro da tela (`MascotRuntime`, posição inicial = centro da área de
passeio) e o modo quieto (`/home/focus`, `/home/stats`, `/home/settings`)
só impede passeio autônomo NOVO — se a rota quieta for a primeira depois de
montar (ex.: recarregar a página em `/home/focus`), ele nunca chega a se
afastar do centro, congelando em cima do relógio do Foco. Corrigido em
`engine/behavior.ts` (`MascotBehavior.setQuietMode`): ao ligar o modo quieto,
reposiciona instantaneamente pro canto mais próximo (`nearestCornerTarget`,
`engine/movement.ts`) em vez de só congelar onde estava — nunca anda até lá
(andar levaria segundos atravessando o conteúdo por cima, o oposto do que o
modo quieto tenta evitar).

## Auditoria do design system (Fase 4, 2026-09)

Revisão de tokens, componentes compartilhados e estados visuais
(`src/design-system/tokens`, `src/components`). Conclusão geral: o sistema já
é maduro — tokens semânticos bem nomeados, zero cor solta fora de
`tokens.css`, `prefers-reduced-motion` tratado globalmente
(`design-system/tokens/motion.css`), e os componentes compartilhados (Button,
Alert, Input, ChipGroup, ConfirmIconButton, CollapsibleSection, Modal) já
cobrem loading/disabled/erro/foco com acessibilidade real (roles ARIA
corretos, `aria-busy`, confirmação antes de excluir, trava de foco em modal).
Não havia necessidade de uma reforma — só dois ajustes pontuais:

- **Comentário de breakpoints desatualizado** — `tokens.css` alegava que
  720/760/768px eram "o mesmo corte" divergido e precisavam ser unificados.
  Investigando, não é verdade: 768 nunca foi um `@media` de verdade, é a
  largura de CONTEÚDO usada no cálculo de `1016px` do dashboard
  (768 + 248 da sidebar) — uma medida de natureza diferente de 720/760
  (largura de JANELA, sem sidebar). Comentário corrigido; nenhuma mudança de
  CSS necessária (não havia bug real).
- **`<EmptyState>` extraído** (`src/components/empty-state`) — 16 mensagens
  de "lista vazia" em 14 arquivos repetiam um entre três blocos de CSS quase
  idênticos (caixa tracejada nas listas principais; texto azul nos
  históricos/widgets secundários; texto cinza pequeno nos 3 cards compactos
  do dashboard), cada cópia com um nome de classe diferente (`empty`,
  `emptyMessage`, `emptyState`, `hint`...). Componente com `variant="box"|
  "inline"` e `tone="default"|"muted"` cobre os três padrões sem forçar um
  molde único; `attachments-field` (hint de campo de formulário, não empty
  state de lista) ficou de fora de propósito — é um caso visual realmente
  diferente. CSS morto removido de cada módulo depois da migração.

## Revisão adversarial do diff do dia (2026-09)

Depois de fechar a Fase 4, uma revisão de código (`/code-review --level high`)
sobre todo o diff do dia encontrou um bug real introduzido pela própria
correção do Focus Mode, além de pequenos itens de limpeza:

- **XP não creditado ao finalizar sessão órfã** — `LocalFocusSession.start()`
  finaliza uma sessão órfã vencida (ver seção "Focus Mode" acima) direto no
  repositório, sem passar pela orquestração que credita XP no mascote
  (`completeFocusSessionAction`, a única que chamava `addXp()` até então).
  O XP era gravado na própria sessão (aparecia no Histórico), mas nunca
  somava no mascote. Corrigido: `start()` agora devolve
  `finalizedExpiredSessionXp` no resultado (`domain/start.ts`), e
  `startFocusSessionAction` credita esse XP — mesmo padrão de orquestração
  de `completeFocusSessionAction`, o repositório continua sem saber nada do
  mascote. Validado numa reprodução real: sessão órfã inserida direto no
  banco depois do cliente já montado (pra não ser limpa pelo caminho
  antigo, via tick do cliente), clique em "Iniciar Foco", XP apareceu
  creditado no mascote e a nova sessão começou normalmente.
- **Canal de timing reabria a enumeração de conta na recuperação de
  senha** — a resposta genérica (ver decisão da seção "Guided Tour" acima)
  ainda esperava um envio de e-mail de verdade (SMTP) só quando a conta
  existe, retornando instantaneamente quando não existe — a diferença de
  tempo de resposta permitia descobrir quais e-mails têm conta, o mesmo
  problema que a mensagem genérica tentou fechar. Corrigido: quando a conta
  não existe, `requestPasswordResetAction` agora espera um atraso simulado
  (`SIMULATED_SEND_DELAY_MS`) comparável ao de um envio real antes de
  responder.
- Pequenos: `connection-schema.ts` normalizava e-mail no próprio schema
  zod (`.trim().toLowerCase()`) em vez de usar `normalizeEmail` — removido,
  a normalização já acontece em `local-connection.ts`, mesmo padrão de
  login/register/forgot-password. Rotas do "modo quieto" do mascote
  extraídas de uma cadeia de `startsWith` solta dentro do componente pra
  `engine/quiet-mode-routes.ts` (testado). CSS duplicado (`.boxMessage` e
  `.inline` idênticos) unificado dentro de `empty-state.module.css`.

## Fase 5 — auditoria visual real (2026-09)

4 agentes navegaram o app de verdade (Playwright, conta de teste própria,
desktop 1280px + mobile 390px, dados reais preenchidos) cobrindo landing +
auth, dashboard + foco + tarefas, hábitos/rotina/trackers de saúde, e
configurações/ciclo/estatísticas. Corrigido o que tinha alto valor e baixo
risco; o resto fica documentado abaixo pra não se perder.

### Corrigido

- **Modal com opacidade presa (~24%), ilegível, em desktop** — não
  reproduzi de forma determinística, mas o mecanismo mais provável: a
  opacidade final dependia inteiramente da animação `@keyframes` terminar
  limpa, sem nenhum valor de repouso declarado fora dela. `opacity: 1`
  agora declarado na base de `.overlay`/`.modal` (`components/modal/styles.module.css`)
  — a animação continua fazendo o fade visual, só nunca é a única fonte da
  opacidade final.
- **Bolha do assistente cobrindo conteúdo interativo no mobile** — achado
  por 3 dos 4 agentes, em telas diferentes (Configurações, Ciclo, Foco com
  sessão ativa, históricos de trackers). A bolha abria sozinha sempre que
  havia uma mensagem contextual, sem nenhuma noção do que havia por trás.
  Agora só abre sozinha em telas largas (`isMobile` via
  `matchMedia`, `assistant/components/widget/index.tsx`) — no celular fica
  só o avatar com o `pingDot` avisando, e o toque nele continua abrindo
  normalmente.
- **Widget do assistente duplicava a fala do mascote na tela de Foco** — o
  Foco já tem seu próprio balão contextualizado
  (`focus/components/mascot`); agora o widget global se esconde em
  `/home/focus`, mesmo padrão que `FocusMiniWidget` já seguia ali.
- **Aviso de notificação bloqueada duplicado** — `NotificationsToggle` e
  `PushToggle` liam a mesma permissão do navegador e mostravam o mesmo
  aviso lado a lado. `PushToggle` não repete mais.
- **Dashboard: "Tudo em dia" ao lado de tarefas pendentes de verdade** —
  `buildNextAction` só contava tarefa pendente como "próxima ação" se
  tivesse prioridade alta/crítica; uma tarefa média/baixa sem horário
  (o caso mais comum) nunca batia em nenhum critério e caía direto em
  "Tudo em dia". Corrigido: qualquer tarefa pendente conta, só o rótulo
  muda ("Prioridade alta" vs. "Tarefa pendente").
- **Cadastro: balão nativo de validação do navegador sobrepõe o campo de
  senha** — só `/register` usava `type="email"` no campo (login e
  esqueci-senha usam texto simples + validação própria); removido, mesmo
  padrão dos outros dois.
- **Landing mobile: seletor de tema some sem alternativa** — `ThemeToggle`
  ganhou uma variante `compact` (só ativa dentro do breakpoint mobile) em
  vez de sumir. "Entrar" ganhou área de toque real (era 38x19px, abaixo do
  mínimo recomendado). Marca ("Gerencie-se") não quebra mais em duas
  linhas disputando espaço com os dois.
- **Cartão de tarefa: último ícone de ação cortado pela borda arredondada
  em desktop** — com até 4 botões de ação visíveis + a tag, o cabeçalho
  ficava mais largo que o card (`overflow:hidden` cortava o resto). A tag
  agora trunca com reticências e cede espaço primeiro; os botões de ação
  nunca encolhem.
- Pequenos: badge de prioridade no dashboard mostrava o valor cru do banco
  ("Media", sem acento) em vez do rótulo (`PRIORITY_LABELS`); título da
  tela de Foco e uma recomendação de leitura estavam em inglês ("Focus
  Timer") no meio de um app em português.

### Encontrado, NÃO corrigido nesta fase (precisa de atenção dedicada)

- **Mascote (bichinho que anda pela tela) sobrepõe conteúdo real
  constantemente** — achado por 2 dos 4 agentes, em quase toda tela
  testada (desktop e mobile): cobre título de card, texto de botão, valor
  numérico, campo de formulário. O passeio autônomo não tem noção
  nenhuma da geometria real da página (mesma limitação já documentada em
  `mascot-pet/components/mascot-pet/index.tsx`, que hoje só resolve isso
  parando o passeio em 3 rotas específicas — Foco/Estatísticas/
  Configurações). Resolver de verdade exige um mecanismo de consciência
  de conteúdo (ex.: área de exclusão real por página, não só rotas
  inteiras "quietas") — engenharia própria, não um ajuste de CSS.
- **3 padrões visuais diferentes entre as 6 telas de tracker** (hábitos,
  rotina, hidratação, corrida, saúde, leitura) — cabeçalho alinhado à
  esquerda vs. centralizado, botão em pílula vs. retangular, criação via
  modal vs. formulário inline, grid de cards vs. lista de linhas vs.
  widget único. Cada tela funciona bem sozinha, mas juntas não parecem
  parte do mesmo sistema. Unificar exige decidir UM padrão e migrar as
  telas que divergem — mudança estrutural, não pontual.
- ~~Vitrine de mascotes da landing (mobile): rola horizontalmente sem
  indicador~~ — **achado obsoleto, verificado e corrigido pelo próprio
  código atual antes mesmo desta sessão**: `MascotSwarm`
  (`mascot-swarm/index.tsx`) já mostra só 3 personagens em mobile
  (`MOBILE_CHARACTER_IDS`), cada um confinado à própria raia dentro de um
  palco com `overflow: hidden` — não existe scroll horizontal nenhum
  nessa seção pra indicar. Corrigido aqui só a documentação, que estava
  desatualizada em relação ao código real.
- **Login/Esqueci a senha no mobile**: conteúdo centralizado verticalmente
  deixa ~45-50% da tela em branco no primeiro momento (tela mais curta que
  Cadastro).
- **Configurações → Aparência**: card do seletor de tema ocupa pouco
  espaço e deixa uma área vazia grande abaixo, destoando das seções
  vizinhas (Mascote, Notificações), mais densas.
- **Padrão de linha de lista diverge entre Rotina/Saúde/Leitura** mesmo
  quando o conteúdo é parecido (checkbox redondo vs. botão quadrado,
  agrupamento por categoria só em Saúde, dropdown de status embutido só
  em Leitura) — mesma raiz do ponto dos "3 padrões visuais" acima.

## Fase 6 — clareza de texto (2026-09)

Três agentes revisaram os textos visíveis ao usuário em áreas diferentes
do app (autenticação/onboarding/landing; tarefas/foco/objetivos/hábitos;
trackers/configurações/mensagens de sistema), seguindo
`editing-for-clarity-and-tone`: só mexe em texto confuso, redundante,
genérico ou inconsistente — nunca reescreve por reescrever, nunca inventa
funcionalidade.

### Corrigido

- **Telas de autenticação**: título "Login" → "Entrar" (única tela que
  destoava — Cadastrar/Entrar em todo o resto já usava verbo no
  infinitivo); link "Logar" → "Entrar" no rodapé do Cadastro (mesma tela,
  dois nomes pro mesmo destino). Placeholder de e-mail padronizado como
  exemplo real (`nome@exemplo.com`) nas 4 telas. Placeholders de senha
  redundantes com o próprio rótulo do campo ("Sua senha aqui", "Confirme
  sua nova senha aqui" etc.) removidos — o `<label>` já diz o que o campo
  é, o placeholder só repetia a mesma informação sem ajudar em nada.
- **Terminologia "tag" vs. "Tipo de Tarefa"**: o formulário de tarefa já
  rotulava o campo como "Tipo de Tarefa", mas a mensagem de validação
  ("Selecione uma tag") e o filtro da lista ("Listar tarefas por tag")
  ainda usavam o nome interno do campo — inconsistência visível pra quem
  nunca viu o código. Unificado pra "tipo" nos três lugares
  (`src/validation/task-schema.ts`, `tasks-list-header`, e o texto de
  ajuda da Captura Rápida, que dizia "categoria").
- **Confirmação de exclusão de item de rotina**: "Remover da rotina?" →
  "Excluir este item da rotina?" — toda outra exclusão de nível superior
  no app (tarefa, hábito, objetivo, anexo) usa "Excluir", só rotina
  destoava com "Remover" pro mesmo tipo de ação (apagar de vez, sem
  desfazer).
- **Erros de anexo genéricos demais**: "Falha de conexão." (upload e
  exclusão) não dizia se cabia tentar de novo — virou "Falha de conexão.
  Tente novamente.", mesmo padrão usado no resto do app pra erro de rede.
- **Botões da Corrida em Title Case** ("Salvar Corrida", "Finalizar
  Corrida", "Iniciar Corrida com GPS") destoavam de todo o resto do app,
  que usa frase normal em botão ("Nova Tarefa" é exceção isolada
  pré-existente, não o padrão) — normalizados pra minúsculas
  ("Salvar corrida", "Finalizar corrida", "Iniciar corrida com GPS").
- **E-mail de convite de conexão**: conferido linha a linha contra o que
  o recurso realmente compartilha (tarefas, rotina, hábitos e objetivos —
  ver `sharedWithUserId`/`isSharedWithMe` nos 4 domains) — o texto já
  batia com a funcionalidade real, nenhuma promessa vazia encontrada.
- **Mensagens genéricas de erro em `profile/health/guided-tour/onboarding
  actions.ts`** ("Não foi possível salvar. Tente novamente.") foram
  avaliadas e mantidas como estão — é o mesmo padrão consistente usado em
  praticamente toda Server Action do projeto pra falha inesperada de
  servidor (não uma falha de validação, que já tem mensagem específica);
  nomear o objeto em cada uma criaria variação sem ganho real de clareza
  pra um erro que, na prática, o usuário só vê se algo já estiver
  bem errado no backend.
- **Tom da Captura Rápida vs. formulário completo**: avaliado como
  intencional (o próprio recurso é vendido como "despejo mental" sem
  fricção — ver comentário em `quick-capture/index.tsx`) e mantido.

## Revisão adversarial do diff (Fase 6, 2026-09)

Nova rodada de `/code-review --level high` sobre o diff acumulado do dia
encontrou 10 problemas reais; os que eram bugs de correção (não só estilo)
foram corrigidos:

- **Regressão real introduzida na própria Fase 3**: `inviteConnectionSchema`
  tinha perdido o `.trim()` (só ficou o `.toLowerCase()`, movido pra
  `normalizeEmail`) sob a suposição de que a normalização ficaria toda na
  camada de dados — mas `.email()` roda ANTES disso, no schema, sobre o
  valor cru. Colar um e-mail com espaço nas pontas (comum ao copiar de um
  app de contatos) passava a ser rejeitado como inválido mesmo sendo um
  e-mail válido. Corrigido devolvendo `.trim()` ao schema (só o trim, não
  o lowercase — esse continua exclusivo de `normalizeEmail`, pra não
  reabrir uma segunda fonte de verdade pra essa regra).
- **Checagem de autoconvite usava `.toLowerCase()` direto** em vez de
  `normalizeEmail`, inconsistente com o próprio helper introduzido nesta
  sessão pra centralizar essa regra — corrigido em
  `local-connection.ts`.
- **Progresso do Guided Tour vazava entre contas diferentes no mesmo
  navegador**: a guarda adicionada na Fase 3 só limpava o passo salvo
  quando a NOVA conta tinha o tour inativo — se as duas contas ainda
  estivessem com o tour ativo (nenhuma dispensou), a conta B herdava o
  passo salvo da conta A. Corrigido isolando a chave do `sessionStorage`
  por `userId` (passado como prop desde `src/app/home/layout.tsx`).
- **Passo do tour salvo por índice numérico, não por identidade**: como a
  lista de passos disponíveis varia por rota/DOM (`computeInitialSteps`),
  o mesmo índice podia apontar pra um passo completamente diferente depois
  de um recarregamento em outra rota. Trocado pra salvar o `id` estável de
  cada passo (já existia em `GuidedTourStep`) e resolver o índice por
  correspondência de id, com fallback pro passo 0 se o id salvo não existir
  mais na lista atual.
- **`computeInitialSteps` (filtra passos + `document.querySelector` por
  passo) rodava 2x na mesma montagem** só porque `steps` e `stepIndex`
  precisavam do mesmo array inicial em dois `useState` separados —
  unificado com uma ref de cache lazy (mutação de ref durante a
  renderização é segura aqui: idempotente e só acontece uma vez).
- **Tela de Foco perdia o nome da tarefa quando a sessão era de uma
  tarefa compartilhada**: `task` vinha de `getTaskFetcher().getById()`,
  que só busca tarefas do PRÓPRIO usuário — mas o seletor de tarefa da
  mesma tela (`pendingTasks`) já oferece tarefas compartilhadas como
  opção. Selecionar uma delas fazia `getById` retornar `null` e a tela
  mostrar "nenhuma tarefa" mesmo com uma sessão de foco válida rodando.
  Corrigido reaproveitando `allTasks` (que já inclui compartilhadas) em
  vez de uma segunda consulta — corrige o bug E remove uma query
  redundante ao mesmo tempo.
- **`PRIORITY_LABELS`/`PRIORITY_OPTIONS` duplicados** entre
  `tasks/components/modal/interfaces.ts` e
  `goals/components/modal/interfaces.ts` (cópias idênticas), com
  `dashboard` importando a cópia de tasks só por não existir uma fonte
  compartilhada. Extraído pra `src/lib/priority.ts`; os dois `interfaces.ts`
  agora reexportam de lá (mantendo os imports existentes intactos) e
  `dashboard` importa direto da fonte compartilhada.

Não corrigidos nesta rodada (avaliados como desproporcionais ao risco/
esforço agora, ficam documentados como limitação conhecida):

- **Corrida entre duas chamadas concorrentes de `start()` de foco**: sem
  transação/lock/constraint única em `focus_session`, um duplo-clique ou
  duas abas simultâneas no exato momento em que existe uma sessão órfã
  expirada podem fazer as duas finalizarem a mesma sessão órfã (XP
  creditado 2x) e inserir duas sessões "running" ao mesmo tempo. Corrigir
  de verdade exige uma constraint única (`userId` + `status='running'`) via
  migração de banco — fora do escopo de uma correção pontual de texto/bug
  de UI; requer decisão e teste dedicados antes de alterar o schema em
  produção.
- **Delay simulado de 800ms na recuperação de senha pode não bater com a
  latência real do SMTP** (o próprio comentário do código já registra que
  Gmail é bem mais lento que uma API transacional dedicada), o que
  reabriria parcialmente o canal de timing que a mensagem genérica
  fechou. Mitigar por completo exigiria medir a latência real de envio em
  produção e calibrar o delay — mantido como está porque é uma
  degradação parcial de uma proteção que já era best-effort (a decisão de
  usar SMTP transacional via Gmail, não uma API dedicada, é anterior a
  esta sessão), não uma regressão nova.
- **`push-toggle.tsx` depende da ordem de renderização** de
  `NotificationsToggle` pra não duplicar a mensagem "notificações
  bloqueadas" — dependência real, mas só documentada em comentário, sem
  garantia em código. Baixo risco (os dois componentes vivem lado a lado
  na mesma tela de Configurações e não há indício de que serão
  reordenados), registrado aqui pra ficar rastreável se isso mudar.

## Fase 7 — auditoria final (2026-09)

Os 3 agentes especializados dessa fase (desktop, mobile, acessibilidade)
foram derrubados por limite de sessão da conta antes de reportar
(`rate_limit`, reset agendado pra mais tarde no mesmo dia) — a auditoria
foi refeita diretamente, via Playwright, cobrindo as mesmas 14 rotas de
`/home/**` em 1440×900 (desktop) e 390×844 com touch (mobile), mais uma
checagem de acessibilidade dirigida.

### Verificado sem achados novos

- Nenhuma das 14 rotas apresentou overflow horizontal (`scrollWidth` vs.
  `clientWidth`) em desktop nem mobile.
- Nenhum erro de console/`pageerror` durante a navegação completa nas
  duas resoluções.
- Foco reaparece corretamente no botão que abriu o modal ("Nova Tarefa")
  depois de fechar com Escape — sem essa verificação, um foco perdido
  após fechar modal é um dos erros de acessibilidade mais comuns.
- Nenhum botão só-ícone sem `aria-label` encontrado no header/sidebar de
  `/home`.
- 10 blocos de regra `@media (prefers-reduced-motion)` carregados nas
  folhas de estilo — cobre os pontos que já eram esperados (mascote,
  toggle de tema, avatar do assistente, ping de notificação).
- Gráfico de "Consistência" (Fase 3) confirmado se comportando
  exatamente como pedido: abre mostrando só a semana atual (ex.:
  `13/09/26 – 19/09/26`), e cada clique em "◄" soma exatamente 1 semana
  ao início mantendo o fim fixo em hoje (`06/09/26 – 19/09/26`, depois
  `30/08/26 – 19/09/26`) — testado com conta nova, criando um hábito e
  clicando duas vezes. A view em tabela mostra as colunas de dia
  (Dom–Sáb) corretamente.

### Corrigido: campo "Título" sem label acessível em 8 modais

Achado real, não superficial: o campo de título (primeiro campo, e
obrigatório) dos modais de **criar/editar tarefa, evento, hábito e
objetivo, e criar/editar item de rotina** (8 arquivos) não tinha
`<label>` associado nem `aria-label`/`aria-labelledby` — só um
`placeholder`, que não é um substituto válido de label (some ao digitar,
e leitores de tela não o tratam como nome acessível do campo de forma
confiável). Todos os OUTROS campos desses mesmos formulários (Prioridade,
Tipo de Tarefa, Descrição etc.) já tinham `Input.Label` — só o de título,
sendo o primeiro campo e o mais óbvio visualmente, tinha ficado pra trás
em todos eles. Corrigido adicionando `<Input.Label htmlFor="title">` em:
`tasks/components/modal/{add,edit}-task`,
`events/components/modal/{add,edit}-event`,
`habits/components/modal/{add,edit}-habit`,
`goals/components/modal/{add,edit}-goal`,
`routine/components/modal/{add,edit}-routine-item`. Verificado depois via
Playwright (inspeção de DOM) que os 5 modais de criação não têm mais
nenhum input sem label associado.

### Observado, não corrigido (mesma categoria já documentada)

- Em viewports de desktop mais estreitos (~1000px), o balão de fala do
  assistente (mascote, canto inferior direito, `position: fixed`) pode
  cobrir a última coluna da tabela de "Consistência" em Hábitos —
  mesma raiz do problema já registrado acima ("mascote sobrepõe conteúdo
  real constantemente"), só que pelo balão do assistente, não pelo bicho
  andando pela tela. É dispensável (botão ×) e temporário, então não foi
  tratado como um bug isolado — entra na mesma frente de trabalho futura
  de dar consciência de geometria real ao companheiro do app.

### Continuação da Fase 7 — itens da lista de limitações conhecidas revisitados

Depois do resumo final entregue ao usuário, ele pediu pra continuar — os
itens que ainda estavam na lista de "conhecido, não corrigido" foram
reabertos um a um, verificados contra o código/tela REAL antes de decidir
se ainda procedem (nem todo achado antigo continua válido):

- **Vitrine de mascotes da landing (mobile) "rola sem indicador"**:
  verificado e já corrigido pelo próprio código atual (achado
  desatualizado, não corrigido nesta sessão) — ver acima, já reclassificado
  no início desta seção.
- **Login/Cadastro/Esqueci senha no mobile com ~45-50% de tela em branco**:
  confirmado com screenshot antes de mexer. Causa: `.main` (o container do
  formulário) herdava `align-items:center` da regra base — pensada pra
  quando a ilustração (`.visual`) existe ao lado, em desktop — mesmo depois
  de `.visual{display:none}` no mobile, deixando cada formulário flutuar no
  meio de um container de `100dvh`, com metade do espaço vazio acima e
  metade abaixo (pior no Esqueci senha, o formulário mais curto). Corrigido
  trocando pra `align-items:flex-start` + `padding-top:var(--space-7)` só
  no mobile — o conteúdo agora começa perto do topo em TODAS as 4 telas de
  auth, com o espaço sobrando concentrado embaixo (padrão normal de página
  curta), não mais dividido de forma estranha. Verificado com screenshot
  antes/depois nas 3 telas.
- **Configurações → Aparência com área vazia grande**: confirmado com
  screenshot. Causa: ao contrário de "Mascote e assistente" (2 painéis
  dentro de `.settingGrid`, que dá a cada um só a largura de uma coluna),
  "Aparência" é um `.settingPanel` sozinho, sem grid ao redor — um
  `<section>` normal estica pra 100% da largura da coluna de conteúdo
  (~1045px em desktop), sobrando uma faixa vazia enorme DENTRO do próprio
  cartão branco, ao lado dos 3 botões de tema. Corrigido com uma nova
  classe `.settingPanelNarrow` (`max-width:28rem`) aplicada só nesta
  seção — o cartão agora tem a largura do conteúdo, na mesma linguagem
  visual dos painéis vizinhos (o espaço restante na página é whitespace
  normal, não mais um vazio dentro do cartão).

A frente do mascote sem consciência de colisão com conteúdo real segue de
propósito fora do escopo (decisão de engenharia maior, não um ajuste de
CSS pontual). As outras duas foram resolvidas nesta rodada:

## Corrida entre sessões de foco concorrentes — resolvido (2026-09)

Adicionada uma constraint de banco de verdade em vez de só confiar em
lógica da aplicação: **índice único parcial** em
`focus_session (user_id) WHERE status = 'running'` (migração
`drizzle/0026_fantastic_tyger_tiger.sql`, gerada via `npm run db:generate`
e já aplicada no banco de DEV LOCAL via `npm run db:migrate` — **a mesma
migração ainda precisa ser aplicada em qualquer outro ambiente
(staging/produção) na hora do deploy**, isto aqui não mexeu em nada além
do Postgres local).

Com o índice, dois pontos do código que antes assumiam "só eu estou
mexendo nisso agora" viraram operações condicionais que só um dos dois
lados de uma corrida pode vencer:

- `LocalFocusSession.finalizeExpiredSession`: o `UPDATE` que finaliza uma
  sessão órfã expirada ganhou `AND status = 'running'` no `WHERE` +
  `.returning()` — se outra chamada concorrente já finalizou a MESMA
  sessão órfã primeiro, esta atualiza 0 linhas e devolve XP 0 em vez de
  creditar de novo.
- `LocalFocusSession.start`: o `INSERT` da sessão nova ganhou
  `.onConflictDoNothing({ target: focusSessions.userId, where: ... })`
  mirando o índice parcial — mesmo padrão já usado em
  `local-mascot.ts` para o mesmo tipo de corrida na criação do
  `mascot_state`. Quem perde a corrida não recebe um erro: busca a sessão
  que realmente ganhou (`getActive()`) e devolve ela, como se sempre
  tivesse sido a sessão ativa.

Verificado com um teste direto contra o Postgres real (duas atualizações
condicionais concorrentes na mesma sessão órfã, dois inserts concorrentes
disputando o índice único) — confirmado: exatamente 1 vencedor em cada
disputa, exatamente 1 sessão "running" no final, nas duas rodadas.
Script de teste era um arquivo descartável, removido depois de rodar
(nunca fez parte do código do projeto).
