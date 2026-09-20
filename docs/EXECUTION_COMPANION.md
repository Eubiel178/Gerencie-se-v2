# Relatório Final — Execution Companion (Companheiro de Execução)

## Visão Geral

Feature que permite ao usuário quebrar tarefas em passos pequenos com accompagnamento do mascote, suporte contextual via Gemini, e notificações push para sessões paradas.

---

## O que foi implementado

### Infraestrutura de IA (`src/lib/ai/`)

- Interface `IAssistantProvider` com 3 métodos: `decomposeTask`, `helpWhenStuck`, `resumeAfterDistraction`
- Provider Gemini com system prompts personalizados (5 personalidades do mascote)
- Provider Fallback com 150 frases PT-BR (10 × 3 contextos × 5 personalidades)
- Factory que escolhe automaticamente: Gemini se `GEMINI_API_KEY` estiver configurada, senão fallback

### Backend (`src/features/execution-companion/`)

- Domain types: `IExecutionSession`, `IActiveIntention`, `ExecutionSessionStep`
- Data layer: CRUD completo no Postgres via Drizzle, com serialização JSON dos passos
- 7 Server Actions: start, pause, resume, complete, abandon, toggleStep, getHelp
- Validação Zod em todos os endpoints
- Zustand store + React context para estado client-side

### Frontend (4 componentes novos)

- `StartWithMeButton` — botão "Começar comigo" nos cards de tarefa
- `ExecutionFloatingBar` — barra flutuante no rodapé com progresso e ações rápidas
- `ExecutionPanel` — painel expandido com lista de passos, checkboxes, pausar/continuar/sair
- `IntentionBanner` — banner no topo da lista "Você estava fazendo: [tarefa]"

### Notificações

- Cron route `/api/cron/execution-checkin` — push para sessões paradas há 30+ min
- Anti-spam via `lastCheckinSentAt` (1 check-in por sessão a cada 30 min)

### Mascote

- 6 novos eventos: execution-started, execution-step-done, execution-stuck, execution-distracted, execution-resumed, execution-completed
- Reações correspondentes em `behavior.ts`

---

## Fluxo completo

1. Usuário clica "Começar comigo" → `startExecutionSessionAction`
2. Busca tarefa, chama `provider.decomposeTask()` → Gemini retorna passos + primeira mensagem
3. Sessão criada no DB com steps JSON, intenção registrada em `active_intention`
4. Painel flutuante aparece com passos, botões de ação
5. Usuário completa passo → `toggleExecutionStepAction` → próximo passo destacado
6. Se travar → `getHelpWhenStuckAction` → Gemini gera sugestão contextual
7. Se distrair → `pauseExecutionSessionAction` → painel mostra "Pausado"
8. Ao voltar → banner "Você estava fazendo: [tarefa]. Continuar?"
9. Cron a cada 5-10min → push para sessões paradas há 30+ min

---

## Personalidades do mascote

| Personalidade | Tom |
|---------------|-----|
| afetuoso | acolhedor, gentil, paciente |
| sarcástico | direto, com ironia leve |
| engraçado | descontraído, usa humor |
| motivador | encorajador, energético |
| zen | calmo, mindfulness, sem pressão |

---

## DB

Tabelas adicionadas em `src/db/schema.ts`:

- `execution_session`: id, userId, taskId, status, currentStepIndex, steps (JSON), mascotMessage, startedAt, pausedAt, completedAt, updatedAt, lastCheckinSentAt
- `active_intention`: userId (PK), taskId, taskTitle, executionSessionId, createdAt, updatedAt

---

## Notificações (Cron)

`POST /api/cron/execution-checkin` — protegida por `CRON_SECRET`:

- Sessão active sem update há 30+ min → "Como tá indo com [tarefa]?"
- Sessão paused sem update há 15+ min → "Quando quiser voltar, é só clicar"
- Anti-spam: 1 check-in por sessão a cada 30 min via `lastCheckinSentAt`

**Para ativar:** configurar um cron externo (Vercel Cron, cron-job.org, etc.) para chamar a rota a cada 5-10 minutos.

---

## Imports

```tsx
// Layout (server component)
import { ExecutionCompanionProvider, ExecutionFloatingBar, ExecutionPanel } from "@/features/execution-companion";
import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";

// Task card (client component)
import { StartWithMeButton } from "@/features/execution-companion";

// Tasks list (client component)
import { IntentionBanner } from "@/features/execution-companion";

// Context hook (dentro do provider)
import { useExecutionCompanion } from "@/features/execution-companion";
```

---

## Validação

Schemas Zod em `src/validation/execution-session-schema.ts`:

- `startExecutionSessionSchema`: { taskId: string }
- `executionActionSchema`: { sessionId: string }
- `toggleExecutionStepSchema`: { sessionId, stepIndex, completed }

---

## Verificação

| Check | Status |
|-------|--------|
| ESLint | 0 erros |
| TypeScript | 0 erros |
| Testes | 207/207 passando |
| Build | OK |
