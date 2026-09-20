<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

@AGENTS.md

## Convenções

- Preferir `Record<>` com if/else a switch/case para error messages (ver `src/lib/auth.ts`)
- Template literals preferidos sobre concatenação de strings
- Todas as strings user-facing em PT-BR com acentos corretos
- Cada componente nova tem seu próprio `styles.module.css`
- Nunca expor chaves de API (Gemini, etc.) no client-side
- O mascote NÃO é um chatbot — é um companion que reage ao contexto

## Feature: Execution Companion (Companheiro de Execução)

O mascot entende o contexto do usuário e acompanha a execução de tarefas de forma integrada. A infraestrutura (ExecutionSession, Gemini, eventos) é invisível — o mascote É o companion.

### Princípios

- **MENOS INTERFACE. MAIS CONTEXTO. MAIS PRESENÇA.**
- O mascote PixiJS + widget do Assistant = camada visível do Companion
- NÃO criar chatbot, widget separado ou novo centro de IA
- NÃO decompor automaticamente toda tarefa — só oferecer quando complexa E usuário aceitar
- `task.steps` = única fonte de verdade para estrutura da tarefa
- ExecutionSession armazena contexto (qual passo, progresso), NÃO checklist paralelo
- Micro-ações = sugestões contextuais temporárias, NÃO persistidas como passos
- Silêncio é comportamento: durante execução normal, mascote fica presente visualmente mas calado. Fala só em: início, retorno de ausência, pedido de ajuda, conclusão
- Na volta do app: linguagem neutra ("Como está indo?") — NÃO marcar distração automaticamente

### Arquitetura

```
src/features/execution-companion/
├── domain/types.ts              # IExecutionSession (simplificado)
├── data/local-execution-session.ts  # CRUD no Postgres via Drizzle
├── actions.ts                   # Server actions (start, pause, resume, complete, abandon)
├── execution-companion-store.ts # Zustand store (session + intention)
├── execution-companion-context.tsx  # React context + provider
└── index.tsx                    # Barrel exports

src/lib/ai/
├── types.ts                     # IAssistantProvider interface + Zod schemas
├── gemini-provider.ts           # Gemini com prompts por personalidade
├── fallback-provider.ts         # ~20 mensagens contextuais (4 por personalidade)
└── index.ts                     # Factory: Gemini se GEMINI_API_KEY senão fallback

src/features/assistant/
├── services/assistant-service.ts  # Snapshot inclui executionSession + executionTaskTitle
├── components/widget/index.tsx    # Widget mostra contexto de execução quando ativo
└── index.tsx                      # Passa executionSession pro Widget

src/app/api/cron/execution-checkin/route.ts  # Push check-in para sessões paradas
```

### Fluxo

1. Usuário clica "Começar" num card → `startExecutionSessionAction`
2. Sessão criada no DB (taskId, currentStepIndex=0) — sem steps paralelos
3. Widget do Assistant mostra contexto: "Você está fazendo: [tarefa]. Continue quando quiser."
4. Task card mostra badge sutil: "Fazendo agora"
5. Se pedir ajuda → Gemini gera sugestão contextual via Assistant widget
6. Se voltar de ausência → linguagem neutra ("Como está indo?")
7. Cron a cada 5-10min → push para sessões paradas há 30+ min

### Personalidades do mascote

- **afetuoso**: acolhedor, gentil, paciente
- **sarcastico**: direto, com ironia leve
- **engracado**: descontraído, usa humor
- **motivador**: encorajador, energético
- **zen**: calmo, mindfulness, sem pressão

### DB

Tabela simplificada em `src/db/schema.ts`:
- `execution_session`: id, userId, taskId, status, currentStepIndex, startedAt, pausedAt, completedAt, updatedAt, lastCheckinSentAt
- `active_intention` e colunas `steps`/`mascotMessage` foram removidos na V1

### Notificações (Cron)

`POST /api/cron/execution-checkin` — protegida por `CRON_SECRET`:
- Sessão active sem update há 30+ min → "Como tá indo com [tarefa]?"
- Sessão paused sem update há 15+ min → "Quando quiser voltar, é só clicar"
- Anti-spam: 1 check-in por sessão a cada 30 min via `lastCheckinSentAt`

### Imports

```tsx
// Layout (server component)
import { ExecutionCompanionProvider } from "@/features/execution-companion";
import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";

// Task card (client component)
import { useExecutionCompanionStore } from "@/features/execution-companion";

// Context hook (dentro do provider)
import { useExecutionCompanion } from "@/features/execution-companion";
```

### Validação

Schemas Zod em `src/validation/execution-session-schema.ts`:
- `startExecutionSessionSchema`: { taskId: string }
- `executionActionSchema`: { sessionId: string }
