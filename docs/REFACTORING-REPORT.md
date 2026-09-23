# Relatório de Refatoração — Gerencie-se v2

**Data:** 21/09/2026
**Escopo:** Refatoração estrutural progressiva (sem alterar UX, UI ou regras de negócio)

---

## Resumo Executivo

Foram executadas **9 etapas** de refatoração estrutural, abordando: separação de camadas, padronização de imports, correção de bugs de estado, unificação de componentes, extração de helpers e validação final.

---

## Etapas Concluídas

### ETAPA 1 — Separação de Page Components dos Feature Barrels

**Problema:** 15 features misturavam componente de página (Next.js `page.tsx`) com barrel exports (`index.tsx`) no mesmo arquivo.

**Solução:** Cada `index.tsx` de feature foi dividido em:
- `index.ts` — barrel limpo (re-exports de domínio, ações, tipos)
- `home.tsx` — componente de página extraído

**Features alteradas:** tasks, habits, events, goals, reading, running, hydration, health, routine, menstrual-cycle, stats, settings, dashboard, focus (14 arquivos `.tsx` → 14 `.ts` + 14 `.tsx`)

**Arquivos de rota atualizados:** Todos os `src/app/home/*/page.tsx` passaram a importar de `@/features/X/home`.

---

### ETAPA 2 — Movimentação de `use-params-url`

**Problema:** `use-params-url.ts` estava em `src/hooks/` (global), mas só era consumido por features de tasks.

**Solução:** Movido para `src/features/tasks/hooks/use-params-url.ts`. Dois consumidores atualizados.

---

### ETAPA 3 — Organização de `calendar-status-banner-from-url`

**Problema:** Componente de settings estava solto sem pasta própria.

**Solução:** Movido para `src/features/settings/components/calendar-status-banner-from-url/index.tsx` com import relativo corrigido.

---

### ETAPA 4 — Unificação de StepsEditor

**Problema:** Dois componentes quase idênticos (`TaskSteps` e `GoalSteps`) com CSS duplicado.

**Solução:**
- Criado `src/components/steps-editor/` com tipo genérico `StepsEditor<T extends StepLike>`
- `TaskSteps` e `GoalSteps` viraram re-exports finos com aliases de tipo (`TaskStepsDraft`, `GoalStepsDraft`)
- CSS duplicado mesclado em um único `styles.module.css`
- Arquivos CSS antigos removidos

---

### ETAPA 5 — Correção de useEffect Sync (AccountPanel + MascotSettings)

**Problema:** Dois formulários de edição usavam `useEffect(() => { reset({...props}) }, [props])` para sincronizar com props atualizadas. Isso causava flash de valores antigos entre `router.refresh()` e execução do effect.

**Solução:** Substituído pelo padrão "adjust state during render" (React 18+):
- `AccountPanel`: `useState` + `if (prop !== previousProp)` + `reset()` inline
- `MascotSettings`: Mesmo padrão aplicado; `useEffect` removido do import

---

### ETAPA 6 — Sincronização de goalInput no HydrationTracker

**Problema:** Campo de meta de hidratação não sincronizava com a prop após save.

**Solução:** "Adjust state during render" — `goalInput` sincroniza com `today.goalMl` quando a prop muda e o usuário NÃO está editando.

---

### ETAPA 7 — Script de Typecheck

**Problema:** Não havia comando rápido para validar tipos.

**Solução:** Adicionado `"typecheck": "tsc --noEmit"` ao `package.json`.

---

### ETAPA 8 — Extração de Helpers do TaskCard

**Problema:** `src/features/tasks/components/tasks-list/card/index.tsx` tinha ~488 linhas com lógica de negócio misturada com JSX.

**Solução:**
- Extraído `deadline-helpers.ts` — funções puras: `formatDeadline`, `isOverdue`, `formatRemaining`
- Extraído `use-task-card-actions.ts` — hook com toda lógica de ações: toggle complete, mark started, work status, retry sync, toggle step, delete

Card component ficou com ~200 linhas (apenas JSX + layout).

---

### ETAPA 9 — Validação Final

| Ferramenta | Resultado |
|---|---|
| `tsc --noEmit` | ✅ 0 erros |
| `eslint .` | ✅ 0 errors, 3 warnings menores (cosméticos) |
| `tsx --test` | ✅ 282/283 pass (1 falha pre-existente: `local-provider.test.ts` importa `server-only`) |

---

## Métricas

| Métrica | Valor |
|---|---|
| Etapas executadas | 9 |
| Arquivos criados | 5 (deadline-helpers.ts, use-task-card-actions.ts, steps-editor/*, home.tsx files) |
| Arquivos removidos | 3 (use-step-checklist.ts, use-capture-timezone.ts old, CSS duplicados) |
| Arquivos movidos | 3 (use-params-url, calendar-status-banner, stats components) |
| Features refatoradas | 15 (barrel split) |
| Tipos genéricos criados | 2 (StepLike, StepsDraft<T>) |
| Componentes unificados | 2 → 1 (TaskSteps + GoalSteps → StepsEditor) |
| useEffects eliminados | 3 (AccountPanel, MascotSettings, HydrationTracker) |

---

## Padrões Estabelecidos

1. **Barrel exports:** Cada feature tem `index.ts` (barrel) separado do componente de página (`home.tsx`)
2. **Component folders:** Cada componente tem sua pasta com `index.ts` entrypoint
3. **Form state:** Draft state tipado + mapper puro + updates imutáveis + initialize no edit (não via useEffect)
4. **Import order:** Node → React/Next → external → shared (`@/`) → features → relative → type-only → assets → styles
5. **Server/client boundary:** `"use server"` e `"server-only"` respeitados; `"use client"` só quando necessário
6. **Render-time sync:** `useState` + `if (prop !== previous)` em vez de `useEffect` para sincronizar estado com props

---

## Próximas Etapas (Priorizado)

| # | Prioridade | Descrição |
|---|---|---|
| 10 | Alta | Padronizar 54 imports de `Icon` de `@/components/icon` → `@/components` |
| 11 | Alta | Criar barrel `@/lib/shared` (3 utilitários) |
| 12 | Média | Criar barrel `@/lib/ai` (4 consumers) |
| 13 | Média | Padronizar barrel `@/lib/email` (8 callers) |
| 14 | Média | Padronizar barrel `@/utils` (3 callers) |
| 15 | Média | Organizar components do stats (6 arquivos soltos) |
| 16 | Baixa | Mover `speak-text.ts` de `@/lib/` para `@/hooks/` |
| 17 | Baixa | Criar barrels para 6 features sem `index.ts` |
| 18 | Baixa | Split `db/schema.ts` (949 linhas) |
| 19 | Baixa | Reorganizar landing page CSS (637 linhas) |

---

*Documento gerado automaticamente em 21/09/2026.*
