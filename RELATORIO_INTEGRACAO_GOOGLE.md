# Relatório final — Login com Google + Google Agenda

Este relatório documenta o que foi implementado, testado e entregue para o
pedido de integração com login Google e sincronização opcional com o
Google Agenda. Todos os arquivos abaixo já foram copiados para a sua pasta
do projeto (`C:\Users\dev12\Desktop\Gerencie-se-v2`).

## 1. Decisão importante tomada durante a implementação: Prisma → Drizzle

O plano original (aprovado por você) previa Prisma + SQLite como camada de
persistência. Durante a implementação, os binários nativos do Prisma
(`query-engine`) se mostraram bloqueados pela política de rede deste
ambiente de desenvolvimento, tornando `prisma generate`/`migrate`
inutilizáveis aqui. A alternativa adotada foi **Drizzle ORM + better-sqlite3**
— também uma solução consolidada e oficialmente documentada para
Next.js/SQLite, sem esse problema de rede, com um workflow de migrations
equivalente (`drizzle-kit generate`/`migrate`). Toda a modelagem de dados
descrita no plano original foi preservada; só o ORM mudou. Essa
substituição foi explicitamente sinalizada a você, que confirmou manter
Drizzle antes de eu prosseguir.

## 2. Arquivos criados

**Google Agenda — biblioteca e rotas**
- `src/lib/google-calendar.ts` — toda a lógica de OAuth do Calendar (URLs
  de autorização, troca de código por tokens, refresh automático,
  criar/atualizar/excluir evento, ler snapshot de um evento, listar
  calendários do usuário, conectar/desconectar).
- `src/app/api/google-calendar/connect/route.ts` — inicia o fluxo de
  autorização do Calendar (gera `state` para proteção CSRF).
- `src/app/api/google-calendar/callback/route.ts` — recebe o retorno do
  Google, valida `state`, salva a conexão.
- `src/features/google-calendar/actions.ts` — Server Actions de
  desconectar e trocar o calendário selecionado.

**Configurações (tela nova)**
- `src/@core/presentation/settings/index.tsx` — página de Configurações,
  com as seções "Conta" e "Integrações" claramente separadas.
- `src/@core/presentation/settings/components/calendar-status-banner.tsx`
  — mensagens de sucesso/erro do fluxo de conexão.
- `src/@core/presentation/settings/components/connection-card.tsx` —
  card de status (conectado/não conectado), e-mail da conta, seletor de
  calendário, botões conectar/desconectar.
- `src/app/home/settings/page.tsx` — rota `/home/settings`.

**Sincronização de tarefas**
- `src/@core/presentation/home/components/modal/sync-with-google/index.tsx`
  — checkbox "Sincronizar com Google Agenda" reutilizado nos modais de
  criar/editar tarefa, com o aviso exato pedido quando não há conexão.
- `src/features/tasks/sync.ts` — orquestração da sincronização
  App→Google (`syncTaskToGoogle`) e Google→App (`syncTasksFromGoogle`).

**Banco de dados**
- `drizzle/0001_lyrical_steve_rogers.sql` (+ `drizzle/meta/...`) —
  migration que adiciona `scheduled_at` e `google_event_updated_at` à
  tabela `task`.

**Documentação**
- `GOOGLE_SETUP.md` — passo a passo de configuração no Google Cloud
  Console (projeto, tela de consentimento, credenciais OAuth, API do
  Calendar, variáveis de ambiente), com fontes oficiais consultadas.

## 3. Arquivos alterados

- `src/db/schema.ts` — novos campos em `tasks`.
- `src/@core/domain/use-cases/task/{task,create,update}.ts` — `ITask`
  ganhou `scheduledAt`, `syncEnabled`, `syncStatus`, `syncError`,
  `googleEventId`, `googleEventUpdatedAt`.
- `src/@core/data/use-cases/task/local-task.ts` — `getById`,
  `updateSyncState`, `unlinkFromGoogle`, `applyGoogleUpdate` (suporte à
  sincronização), além do CRUD já existente.
- `src/features/tasks/actions.ts` — `createTaskAction`/`updateTaskAction`
  agora chamam `syncTaskToGoogle` depois de salvar localmente;
  `deleteTaskAction` remove o evento do Google em melhor esforço; nova
  `retryTaskSyncAction`.
- `src/validation/taskSchema.ts` — `scheduledAt` obrigatório somente
  quando `syncEnabled` está marcado.
- `src/@core/presentation/home/index.tsx` — dispara a sincronização
  Google→App a cada carregamento da Home, quando há conexão.
- `src/@core/presentation/home/components/modal/{interfaces,add-task,edit-task}`,
  `tasks-list-header`, `tasks-list`, `tasks-list/card` — thread do estado
  `isGoogleConnected` e exibição de status/erro/retry de sincronização no
  card da tarefa.
- `src/components/header/index.tsx` — link "Configurações" no menu.
- `src/lib/auth.ts` — nova função `isGoogleAccountLinked` (diz se o login
  do usuário está vinculado ao Google, para a seção "Conta").
- `src/lib/auth.config.ts` — `trustHost: true` (ver seção 6).
- `package.json` / `package-lock.json` — dependência `googleapis`.
- `.env.example` — variáveis `GOOGLE_CALENDAR_*`.

## 4. Dependências novas

- `googleapis` — biblioteca oficial do Google para Node.js, usada para
  toda a integração com a Calendar API (OAuth2Client, `calendar.events`,
  `calendar.calendarList`).

Nenhuma outra dependência nova foi necessária — Auth.js e Drizzle já
faziam parte da base após a Fase 1 (autenticação).

## 5. Migrations

Uma migration nova: `drizzle/0001_lyrical_steve_rogers.sql`, que adiciona
`scheduled_at` (texto, formato `datetime-local`) e
`google_event_updated_at` (timestamp) à tabela `task`. Ela já foi aplicada
e testada neste ambiente (`npm run db:migrate`). **No seu computador, você
precisa rodar `npm run db:migrate` uma vez** para aplicar essa migration
ao seu `dev.db` local (o arquivo `.db` em si nunca é versionado/copiado —
só as migrations).

## 6. Variáveis de ambiente necessárias

Veja `.env.example` (atualizado) e `GOOGLE_SETUP.md` para o passo a passo
completo de como obtê-las no Google Cloud Console. Resumo:

```
AUTH_GOOGLE_ID=...                     # já devia existir da Fase 1 (login)
AUTH_GOOGLE_SECRET=...                 # já devia existir da Fase 1 (login)
GOOGLE_CALENDAR_CLIENT_ID=...          # novo — pode reusar o mesmo Client ID acima
GOOGLE_CALENDAR_CLIENT_SECRET=...      # novo — pode reusar o mesmo Client Secret acima
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback   # novo
```

Sem essas duas últimas variáveis (`GOOGLE_CALENDAR_*`) preenchidas, o
botão "Conectar Google Agenda" mostra uma mensagem clara ("integração
ainda não configurada") em vez de quebrar — testei esse caminho
especificamente, porque é exatamente o estado em que este ambiente de
desenvolvimento ficou (não tenho como testar o fluxo real do Google aqui,
ver seção 8).

## 7. Configuração necessária no Google Cloud

Passo a passo completo em `GOOGLE_SETUP.md`, já copiado para sua pasta.
Resumo do que falta você fazer (nenhuma dessas etapas pode ser feita por
mim, exigem sua conta Google):

1. Criar/reaproveitar um projeto no [console.cloud.google.com](https://console.cloud.google.com/).
2. Na tela de consentimento OAuth, manter em modo **Teste** (suficiente
   para uso pessoal — evita o processo de verificação de escopo sensível).
3. Nas credenciais OAuth existentes (da Fase 1, login), adicionar mais uma
   URI de redirecionamento autorizada: `http://localhost:3000/api/google-calendar/callback`.
4. Ativar a **Google Calendar API** em "APIs e serviços → Biblioteca".
5. Preencher as variáveis `GOOGLE_CALENDAR_*` no seu `.env` real (nunca
   commitado — ele está no `.gitignore`).

## 8. Como testar

**Testável sem credenciais reais do Google** (já testei todos estes,
via script automatizado com Playwright, contra um build de produção
limpo — `npx next build` sem erros, `tsc --noEmit` e `next lint` limpos):

- Botão "Continuar com Google" aparece em `/login`.
- Login com e-mail/senha continua funcionando normalmente.
- Configurações mostra corretamente "○ Não conectado" e distingue a seção
  "Conta" (como você loga) da seção "Integrações" (Google Agenda).
- Link "Conectar Google Agenda" aponta para a rota correta.
- Criar uma tarefa funciona normalmente com o Google desconectado
  (independência).
- Marcar "Sincronizar com Google Agenda" sem estar conectado mostra a
  mensagem exata pedida e permite cancelar e continuar criando a tarefa
  normalmente (a criação nunca trava esperando o Google).
- Editar uma tarefa continua funcionando com os novos campos.
- O fluxo de conexão nunca quebra com erro 500 quando as credenciais não
  estão configuradas — redireciona para Configurações com mensagem clara.
- Cancelamento do consentimento do Google (`access_denied`) é tratado sem
  quebrar o app.
- `state` inválido/ausente no callback é rejeitado (proteção CSRF).
- Logout funciona normalmente.
- Nenhum erro de console/JavaScript apareceu durante todo esse fluxo.

**Só testável com credenciais reais do Google, no seu computador** (este
ambiente de desenvolvimento não tem acesso de rede a `accounts.google.com`
nem credenciais reais):

- Cadastro/login real via Google (conta nova).
- Login de um usuário que já existe.
- Vínculo de conta Google a uma conta já existente com o mesmo e-mail —
  por segurança, isso **não é vinculado automaticamente** só porque o
  e-mail bate (ver seção 9); hoje, tentar logar com Google num e-mail que
  já tem conta local resulta em erro claro (`OAuthAccountNotLinked`),
  sem sessão inválida criada.
- Conectar o Google Agenda de verdade, escolher o calendário, criar/editar
  uma tarefa sincronizada e ver o evento aparecer/mudar no Google.
- Mudar o evento diretamente no Google e ver a tarefa atualizar ao
  recarregar a Home (sincronização reversa, por polling).
- Excluir o evento no Google e ver a tarefa se desvincular sem ser
  apagada.
- Token expirado/renovação automática.
- Desconectar e reconectar (garantir que não duplica eventos).

Para rodar esses testes, depois de preencher as variáveis de ambiente:
`npm run dev`, logar, ir em Configurações → Integrações e clicar em
"Conectar Google Agenda".

## 9. Limitações conhecidas (decisões documentadas no código)

- **Vínculo de conta por e-mail**: um usuário que já tem conta local
  (e-mail/senha) e tenta entrar com Google usando o mesmo e-mail recebe um
  erro claro em vez de ter as contas mescladas automaticamente — mesclar
  automaticamente só por e-mail bater seria inseguro (qualquer um que
  descobrisse esse e-mail no Google poderia assumir a conta). Um fluxo de
  "vincular Google a partir de uma conta já logada" ficou fora deste
  primeiro entrega — pode ser adicionado depois como uma ação explícita em
  Configurações, exigindo confirmação de senha antes de vincular.
- **Sincronização Google→App por polling, não webhook**: como o app roda
  localmente sem domínio público, não é possível receber notificações
  push do Google. A sincronização reversa acontece a cada carregamento da
  página inicial. Numa versão hospedada, isso pode evoluir para webhooks
  (`watch`) do Google Calendar.
- **Fuso horário**: os horários de evento assumem que o fuso do
  computador que roda o servidor é o fuso do usuário — válido para este
  app local de um único usuário; numa versão hospedada/multiusuário, isso
  precisaria vir do perfil de cada usuário.
- **`trustHost: true` no Auth.js**: necessário para o app funcionar em
  modo de produção (`next start`) sem um domínio público configurado.
  Documentado no código (`src/lib/auth.config.ts`) como uma decisão válida
  para uso local; numa hospedagem real atrás de proxy, o recomendado é
  configurar `AUTH_URL`/`AUTH_TRUST_HOST` no ambiente em vez de fixar isso
  no código.
- **Duração padrão do evento**: 30 minutos, já que as tarefas não têm
  campo de "hora de término" — só de início.

## 10. O que NÃO foi tocado

Nenhuma tela, fluxo ou dado fora do escopo pedido (login Google + Google
Agenda) foi alterado nesta etapa. O padrão visual e a arquitetura
existente (Clean Architecture em `@core`, features em `features/`,
Server Actions) foram seguidos à risca, sem reescrever nada
desnecessariamente.
