# Auditoria completa — Gerencie-se-v2

Data: 09/09/2026
Escopo: código-fonte completo do projeto, instalação de dependências, `npm run build`, `tsc --noEmit` e leitura de todos os módulos de domínio, dados, infraestrutura, apresentação e design system.

---

## 1. Como o projeto está atualmente

O Gerencie-se-v2 é uma aplicação Next.js 14 (App Router) com React 18 e TypeScript, estruturada em camadas inspiradas em Clean Architecture, com injeção de dependência via **inversify**:

```
src/
├── @core/
│   ├── container/       → configuração do inversify (DI)
│   ├── domain/           → contratos (interfaces) dos casos de uso
│   ├── data/              → implementação dos casos de uso (RemoteTask, RemoteEvent)
│   ├── infra/             → adapters HTTP (axios, fetch)
│   └── presentation/     → páginas/telas (home, event, login, register) + hooks
├── app/                    → rotas do Next (App Router): /, /login, /register, /home, /home/event
├── components/             → design system (Button, Input, Modal, Header, List, Typography, Notification, Wrapper)
├── providers/              → Context API (InputRootContext)
├── styles/                 → CSS global + Tailwind
├── utils/, validation/     → helpers de data e schemas Zod
└── @fakeapi/db.json        → banco fake servido via json-server
```

Duas funcionalidades reais existem hoje: **Tarefas** (`/home`) e **Eventos/Calendário** (`/home/event`), além de telas de **Login** e **Cadastro** que são apenas UI (sem autenticação real). Não há backend de verdade — os dados vêm de um `json-server` local (`src/@fakeapi/db.json`) chamado via Axios.

O próprio README (escrito por você) já traz uma autocrítica honesta e muito precisa: ações de editar/excluir incompletas, ausência de estado compartilhado (sugestão de Zustand), padronização de imports/ordem de hooks, troca de `<img>` por `<Image>`, e uso mais intencional de cache. Essa autoanálise bateu com quase tudo que encontrei na auditoria — o que é um ótimo sinal de mentalidade de produto.

---

## 2. O que já está bom (e não deve ser jogado fora)

- **Separação em camadas (domain/data/infra/presentation)** é real, não é só pasta vazia: cada caso de uso (`CreateTask`, `LoadAllTasks`, `DeleteTask`) tem contrato próprio e implementação (`RemoteTask`) desacoplada do adapter HTTP.
- **Injeção de dependência com inversify** funciona e é um diferencial de currículo — a troca do adapter (Axios → Fetch, por exemplo) não exige tocar nos casos de uso.
- **Composition Pattern já é praticado**, principalmente no `Input` (`Input.Root`, `Input.Label`, `Input.Field`, `Input.HelperText`, `Input.FieldSelect`, `Input.FieldPassword`, `Input.FieldTextarea`) e no `Form` (`Form.Root`, `Form.Wrapper`). Isso é exatamente o padrão que você pediu para manter e expandir.
- **Design system com variantes via `tailwind-variants`** (`tv()`) já centraliza estilos de `Button`, `Wrapper`, `List`, `Header`, evitando classes soltas espalhadas — a base para um Design System sério já existe, só falta desacoplar do Tailwind.
- **Validação com Zod + React Hook Form + `@hookform/resolvers`** está bem aplicada em todos os formulários (tarefa, evento, login, registro), com mensagens de erro em português.
- **`tsc --noEmit` roda 100% limpo** (zero erros de tipo) e o `next build` também não acusa nenhum erro de TypeScript — a tipagem de domínio (`ITask`, `IEvent`, namespaces `LoadAllTasks`, `CreateEvent` etc.) é consistente.
- **ESLint (`next/core-web-vitals`) só acusa 2 warnings**, ambos de `<img>` vs `<Image>` — não há uso de `any`, não há regras desligadas para esconder problema.
- **`.env` + `next.config.js`** já isolam a URL da API fake, e o `.gitignore` está correto e completo.

Essas partes serão preservadas e evoluídas, não recriadas do zero.

---

## 3. Principais problemas encontrados

### 3.1 Bugs reais de funcionamento (não é só "código antigo")

1. **`next build` quebra na geração estática das páginas `/home` e `/home/event`** com o erro `Functions cannot be passed directly to Client Components`. Causa raiz: em `AxiosAdapter.request` (`src/@core/infra/adapters/axios-adapter/index.ts`), o `catch` faz `return error;` — ou seja, quando a chamada HTTP falha (o que acontece sempre em build/SSR, porque o `json-server` não está rodando nesse momento), o adapter devolve o **objeto de erro do Axios inteiro** como se fosse a lista de tarefas/eventos. Esse objeto contém funções internas (`toJSON`, `config.adapter`, etc.), e o React não consegue serializar isso na fronteira Server→Client Component, derrubando o build. Isso é exatamente o tipo de "erro escondido" que você pediu para eu não deixar passar — a causa raiz é tratamento de erro incorreto, não um problema do Next.
2. **`useParamsUrl.get` está quebrado em runtime**: o hook retorna `get: searchParams.get` (a referência do método "solta", sem o `this` do `URLSearchParams`). Ao chamar `paramsUrl.get("tag")` em `TasksList`, isso lança `TypeError: Method get called on incompatible receiver` — ou seja, o filtro de tarefas por tag provavelmente já está quebrado hoje em produção/dev.
3. **Exclusão de tarefa e de evento não funciona**: `RemoteTask.delete` e `RemoteEvent.delete` estão implementados como corpo vazio (código comentado). O botão de lixeira na UI existe, dispara a chamada, mas nada acontece — exatamente o que o seu README já apontava.
4. **Edição de tarefa não persiste**: em `EditTask`, a chamada `fetcher.update(data)` está comentada; o formulário abre, valida, mas o `handleFormSubmit` não faz nada.
5. **Login e Cadastro são 100% decorativos**: `handleOnSubmit` só faz `console.log(data)`. Não há chamada de API, não há sessão, não há redirecionamento, não há proteção de rotas (`/home` é acessível sem login).
6. **Botão com `loading` não fica de fato desabilitado**: `Button` aplica apenas a classe visual de "disabled" quando `loading=true`, mas não repassa o atributo HTML `disabled` — o usuário pode clicar múltiplas vezes durante o envio (double submit).
7. **CSS morto por causa de migração incompleta do Pages Router**: `globalStyle.css` estiliza `#__next`, seletor que só existia no antigo Pages Router. No App Router atual esse elemento não existe, então metade da regra nunca é aplicada.
8. **Classe Tailwind inválida**: `Wrapper` usa `text-blacks` (typo), que não corresponde a nenhuma classe do Tailwind — não tem efeito nenhum, silenciosamente.
9. **`console.log` esquecido em produção**: dentro de `useFormTags.tagExists`.

### 3.2 Organização e nomenclatura

- Mistura de convenções de nomeclatura: pastas em `PascalCase` (`EventList/`) convivendo com `kebab-case` (`event-list-header/`, `tasks-list/`) e `camelCase` em arquivos de validação (`eventSchema.ts`) enquanto o resto do projeto usa `kebab-case`. **Combinado com você**: a partir de agora todo o projeto vai seguir o padrão que você definiu agora mesmo — nomes de arquivo e pasta em minúsculo, separados por hífen (ex.: `InputRootContext` → `input-root-context`, `EventList` → `event-list`). Vou aplicar isso de forma consistente em toda a base durante a Fase 3 (Arquitetura).
- `@core` e `@fakeapi` usam `@` no nome da pasta — funciona, mas é incomum e confunde com alias de import (`@/*`). Vale renomear para algo como `core/` e `fake-api/` (ou eliminar a fake API em favor de um mock service dedicado).
- `tsconfig.json` tem duas entradas de `include` **apontando para arquivos que não existem**: `src/components/Layout/layout.js` e `src/@core/presentation/event/components/modal/index.ts` (esse último, o real, é `modal/index.ts` mas dentro de `event/components/modal`, plausivelmente correto — já o `Layout/layout.js` é resíduo de um Pages Router antigo que nunca foi removido).
- Padrão inconsistente de export: alguns componentes usam `export function X()`, outros `export const X = () =>`, sem critério aparente.
- `RemoteEvent`/`RemoteTask` moram em arquivos chamados **`remote-event.ts`** dentro da pasta `task/` — nome copiado e colado da pasta de eventos, o que confunde bastante (o arquivo de `task` deveria se chamar `remote-task.ts`).

### 3.3 Dependências

- **`yup` está instalado mas nunca é usado** em nenhum lugar do código (confirmado via busca em todo o `src/`) — todos os formulários usam `zod`. Dependência morta.
- **`"add": "^2.0.6"`** está nas dependências de produção — isso é um pacote npm real, mas tudo indica ser resultado de um `npm add <algo>` digitado errado (rodou `npm install add`). Não há nenhuma importação de `add` no código. É lixo de dependência.
- **`json-server` está em `dependencies`**, mas é uma ferramenta de desenvolvimento (mock de API) — deveria estar em `devDependencies`, ou melhor, ser substituída por um mock mais robusto (MSW, por exemplo) já que o objetivo final é ter uma persistência real (local/offline-first, como você pediu no item 46).
- **Next 14.1.0** — atual é a série 14/15; vale avaliar upgrade controlado (App Router já é usado, então a migração para Next 15 tende a ser tranquila, mas farei isso como etapa isolada e testada).
- **`next/font/google` (Inter)** exige acesso à internet **em tempo de build** para baixar a fonte do Google. Isso é uma fragilidade real de arquitetura: qualquer ambiente de build sem acesso à internet (CI restrito, rede corporativa, sandbox) quebra o build só por causa da fonte. (Foi o que aconteceu no meu ambiente de auditoria — corrigi temporariamente para conseguir ver os outros erros, e já revertive essa mudança.) Recomendo hospedar a fonte localmente (`next/font/local`) ou usar uma fonte de sistema.
- **Tailwind + `tailwind-variants` + `tailwind-merge`**: as três funcionam juntas hoje, mas nenhuma cor customizada foi definida — o `tailwind.config.ts` tem a seção `colors` inteira comentada. Ou seja, hoje **não existe tema centralizado**: as cores usadas nos componentes (`bg-sky-600`, `text-red-500`, `bg-gray-600` etc.) são valores crus do Tailwind espalhados pelo código, sem nenhum design token.

### 3.4 Estado, dados e UX

- Não existe estado compartilhado: cada página busca sua própria lista (`await fetcher.loadAll(...)` dentro do próprio Server Component) e passa como prop para os componentes client. Criar/editar/excluir não atualiza a tela sem um F5 manual — exatamente o diagnóstico que você já tinha feito no README.
- Não há tratamento de erro visível ao usuário em nenhum fluxo (nem loading state de carregamento inicial, nem mensagem de erro caso a API caia) — quando a API falha, o erro vira dado (ver 3.1.1) em vez de virar uma UI de erro.
- Não existem: testes, PWA, notificações, dark mode, empty state ilustrado (existe um texto simples "Nenhuma tarefa adicionada", o que já é melhor do que nada, mas pode evoluir), atalhos de teclado, acessibilidade formal (sem `aria-label` nos botões de ícone como o de excluir/editar, por exemplo).
- Responsividade existe apenas parcialmente: o `Header` tem lógica mobile/desktop via `tailwind-variants`, mas as telas de conteúdo (listas de tarefas, calendário, modais) não têm tratamento específico para telas pequenas — o modal, por exemplo, tem largura fixa (`w-[23rem]`), o que pode estourar em telas muito pequenas mesmo estando centralizado.

---

## 4. Erros de build (resultado real da execução)

Rodei `npm install`, `npm run build` e `npx tsc --noEmit` no projeto, com os seguintes resultados:

| Verificação | Resultado |
|---|---|
| `npm install` | ✅ Sem erros (424 pacotes) |
| `npx tsc --noEmit` | ✅ Zero erros de tipo |
| ESLint (via `next build`) | ⚠️ 2 warnings (`no-img-element` em `login/figure` e `register/figure`) — nenhum erro |
| `next build` | ❌ Falha na etapa de **prerender** de `/home` e `/home/event`: `Error: Functions cannot be passed directly to Client Components` (causa raiz descrita em 3.1.1) |
| `next build` (ambiente de auditoria) | ❌ Falha adicional só neste sandbox: `next/font/google` não consegue baixar a fonte Inter por falta de acesso à `fonts.googleapis.com` — isso é uma limitação de rede do meu ambiente de auditoria, não necessariamente do seu ambiente local, mas é um risco arquitetural real (ver 3.3) |

**Conclusão**: o build **não passa hoje**, e a causa é um bug de tratamento de erro genuíno (item 3.1.1), não um problema de configuração do Next/TypeScript. Esse será o primeiro item corrigido na Fase 1, antes de qualquer modernização visual.

---

## 5. Dependências desatualizadas / a revisar

| Pacote | Situação | Ação recomendada |
|---|---|---|
| `yup` | Não usado em nenhum lugar | Remover |
| `add` | Dependência "lixo" (typo de instalação) | Remover |
| `json-server` | Ferramenta de dev em `dependencies` | Mover para `devDependencies` ou substituir por mock mais robusto |
| `moment` | Biblioteca de datas legada (grande, mutável, em modo de manutenção) | Migrar para `date-fns` ou `dayjs` (mais leves, imutáveis, tree-shakeable) — útil desde já para toda a parte de Rotina/Hábitos/Ciclo que depende muito de datas |
| `tailwind` + `tailwind-variants` + `tailwind-merge` | Autorizado a manter temporariamente, mas sem novo código novo usando Tailwind (ver seção 9) | Congelar, não expandir, migrar gradualmente |
| `next` 14.1.0 | Não é "antigo", mas há versões mais novas na série 14/15 | Atualizar dentro da Fase 2, com build validado a cada passo |
| `inversify` + `reflect-metadata` | Atual e coerente com a decisão arquitetural de DI | Manter |
| `axios` | Atual | Manter (mas corrigir o tratamento de erro) |
| `zod`, `react-hook-form`, `@hookform/resolvers` | Atuais e bem usados | Manter |
| `@fullcalendar/*` | Atual, mantém funcionalidades de calendário | Manter — será a base do módulo de Calendário mais amplo |
| `react-icons` | Funciona bem, mas vale avaliar `lucide-react` (mais moderno, tree-shakeable, visual mais consistente com produtos atuais) no Design System novo | Avaliar durante a Fase 4 |

---

## 6. O que precisa ser modernizado

- Arquitetura de pastas: migrar de "camadas técnicas dentro de `@core`" para **features por domínio** (`features/tasks`, `features/routine`, `features/habits`, `features/goals`, `features/focus`, `features/hydration`, `features/running`, `features/health`, `features/reading`, `features/assistant`), mantendo o espírito de Clean Architecture dentro de cada feature (domain/data/infra/presentation viram pastas internas menores, não uma árvore paralela gigante).
- Corrigir os bugs reais listados na seção 3.1 antes de qualquer coisa (é a Fase 1).
- Introduzir Zustand por domínio (tasks, routine, habits, goals, focus, hydration, running, assistant) — hoje não existe gerenciamento de estado global algum.
- Criar tema centralizado com CSS Variables + Design Tokens (hoje não existe nenhuma cor customizada, é tudo Tailwind cru).
- Dark mode / light mode (hoje inexistente).
- Corrigir responsividade real de listas, modais e calendário para mobile.
- Acessibilidade básica: `aria-label` em botões de ícone, foco visível, `prefers-reduced-motion`.
- Troca de `<img>` por `next/image`.
- Padronizar nomenclatura de arquivos/pastas (kebab-case, minúsculo — conforme você definiu).
- Resolver a fragilidade do `next/font/google` migrando para fonte local ou de sistema.

## 7. O que deve ser preservado

- A separação domain/data/infra por caso de uso (contratos + implementação) — vira a base de cada feature nova.
- Injeção de dependência via inversify.
- Composition Pattern do `Input` e do `Form`.
- `tailwind-variants` como mecanismo de variantes **enquanto o Tailwind ainda não for totalmente migrado** (a lógica de variantes em si — não a sintaxe Tailwind — é reaproveitável em CSS puro/CSS Modules).
- Zod + React Hook Form para validação.
- FullCalendar para o calendário.
- O fake API (`json-server` + `db.json`) como ambiente de desenvolvimento, até existir uma camada de persistência real (local-first, conforme os itens 46/61 do seu briefing).
- O tom e a identidade visual de partida (paleta escura com destaque em azul `#38bdf8`), como ponto de partida do novo tema.

---

## 8. Proposta de arquitetura

```text
src/
├── app/                       → rotas (App Router) — finas, só compõem features
├── features/
│   ├── tasks/
│   ├── routine/
│   ├── habits/
│   ├── goals/
│   ├── focus/
│   ├── hydration/
│   ├── running/
│   ├── health/
│   ├── reading/
│   └── assistant/            → JARVIS
│         cada feature com, quando necessário:
│         components/ hooks/ services/ stores/ types/ utils/ domain/
├── design-system/             → Button, Input, Modal, Card, Badge, Tabs, Toast, etc.
├── components/                → composições genéricas que não têm dono de domínio (ex.: AppShell, Sidebar)
├── services/                  → clientes HTTP, adapters, integrações externas (não dependem de UI)
├── stores/                    → apenas stores realmente cross-feature (ex.: sessão do usuário, tema)
├── hooks/                     → hooks genéricos (useMediaQuery, useLocalStorage…)
├── utils/
├── types/
└── styles/                    → tokens, tema, globals.css
```

Cada feature herda o espírito domain/data/infra que já existe hoje, só que em escala menor e junto do resto da feature (ex.: `features/tasks/domain`, `features/tasks/data`, em vez de uma árvore `@core` paralela para todo o app). Isso resolve o problema de "tudo dentro de `@core`" sem jogar fora a arquitetura em camadas que você já pratica.

---

## 9. Estratégia para remover/migrar Tailwind

Como você pediu para não usar Tailwind em código novo, mas sem quebrar o que já funciona:

1. **Congelar** o Tailwind: nenhuma tela ou componente novo usa classes Tailwind a partir de agora.
2. Manter o Tailwind instalado e funcionando **apenas** para as telas ainda não migradas (Login, Cadastro, Header, Modal, Wrapper, Input, Button, Calendar, Cards de tarefa/evento) até que cada uma seja reescrita com CSS Modules + tokens.
3. Migrar por ordem de prioridade: primeiro o **Design System** (Fase 4) — Button, Input, Modal, Card etc. — porque uma vez migrados, toda tela nova já nasce sem Tailwind.
4. Depois migrar as telas existentes (Fases 8 a 11), reaproveitando a lógica de variantes do `tailwind-variants` (a ideia de "slots" e "variants" é boa e será recriada com CSS Modules + funções utilitárias, só a sintaxe de classes Tailwind é trocada).
5. Ao final da migração das telas existentes, remover `tailwindcss`, `tailwind-variants`, `tailwind-merge`, `postcss.config.js` e `tailwind.config.ts` do projeto.

## 10. Estratégia de Design System

- Construir `design-system/` com componentes atômicos reutilizáveis (Button, Input, Select, Checkbox, Switch, Modal, Dialog, Card, Badge, Tooltip, Dropdown, Tabs, Progress, Avatar, Toast, Skeleton, Spinner, Calendar wrapper, Timer, EmptyState, LoadingState, ErrorState), todos usando CSS Modules + CSS Variables (tokens de tema).
- Reaproveitar o padrão de composição já usado no `Input`/`Form` atual (Root + subcomponentes) para os componentes compostos (`Card.Header`, `Card.Content`, `Card.Footer`, `Modal.Header/Body/Footer`, etc.), conforme o exemplo que você deu.
- Cada componente do design system recebe variantes via props tipadas (sem Tailwind), com os tokens de cor/espaçamento vindos do tema central (seção 13).

## 11. Estratégia de Zustand

- Um store por domínio, dentro da própria feature (`features/tasks/stores/task-store.ts`, etc.) em vez de um `globalStore` único.
- Cada store guarda: dados carregados da API, estado de loading/erro, e as ações de criar/editar/excluir/otimista-atualizar a lista — resolvendo diretamente o problema descrito no seu próprio README (falta de estado compartilhado entre telas).
- Estado de UI puramente local (modal aberto/fechado, campo de formulário) continua em `useState` local — não vira Zustand.
- Um store pequeno e transversal (`stores/` na raiz) só para coisas realmente globais: tema (dark/light), usuário autenticado, preferências do JARVIS.

## 12. Estratégia de JARVIS (assistente)

- Fica em `features/assistant/`, com `components/`, `hooks/`, `services/`, `stores/`, `prompts/`, `types/`, `utils/`.
- O `AssistantService` nunca acessa dados diretamente: ele conversa com `TasksService`, `RoutineService`, `GoalsService`, `FocusService`, `HabitsService`, `HydrationService`, `RunningService` — cada um desses serviços é a mesma camada `data/domain` que a feature correspondente já expõe.
- Se/quando um provedor de IA for integrado, a chamada ao provedor fica atrás de uma interface (`IAssistantProvider`), com a implementação concreta trocável (ex.: `OpenAIProvider`, `AnthropicProvider`, `RuleBasedProvider` para funcionar sem custo de IA nenhuma). Nenhuma chave de API no frontend — isso exigiria uma rota de API do próprio Next (`app/api/assistant/route.ts`) fazendo de proxy para o provedor, nunca uma chamada direta do client.
- Presença visual (andando/observando pela tela) fica isolada em componentes próprios (`AssistantAvatar`, com estados idle/listening/thinking/speaking/warning/celebrating), configurável e desativável pelo usuário.

## 13. Estratégia de tema

- CSS Variables no `:root` (e um seletor `[data-theme="dark"]` ou `.dark` para o modo escuro), com os tokens: `--color-primary`, `--color-secondary`, `--color-tertiary`, `--color-highlight`, `--color-background`, `--color-surface`, `--color-surface-elevated`, `--color-text`, `--color-text-muted`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-border`, `--color-shadow`.
- Ponto de partida: a paleta atual do projeto (`#1f2233`, `#23253a`, `#2b2e41`, destaque `#38bdf8`), ajustando contraste onde necessário para acessibilidade (ex.: garantir contraste mínimo AA em texto sobre `--color-surface`).
- Um hook/contexto `useTheme()` lê/persiste a preferência (local, com respeito a `prefers-color-scheme` como padrão inicial).
- Nenhuma cor "solta" em componentes: tudo referencia uma variável do tema.

## 14. Estratégia de animações

- Transições com `transform`/`opacity` (fade, scale, slide) via CSS puro (`@keyframes` + classes utilitárias no design system), sem biblioteca pesada de início; avaliar `framer-motion` apenas se a complexidade de orquestração (ex.: animações do mascote, celebrações de XP) justificar.
- Toda animação respeita `@media (prefers-reduced-motion: reduce)`.
- Prioridade de aplicação: microinterações do design system (hover, foco, loading) → transições de modal → Focus Timer/mascote → gamificação (XP, conquistas).

## 15. Novas ideias que recomendo (justificadas pelo objetivo do produto)

- **"Próxima ação"** em destaque no dashboard: em vez de listar todas as tarefas, destacar qual é a próxima coisa a fazer agora — reduz a paralisia de decisão (liga direto com o item 25, anti-procrastinação).
- **Mensagens contextuais do JARVIS baseadas em dado real** (ex.: "Você concluiu 2 de 3 tarefas prioritárias hoje"), e não frases motivacionais genéricas — você já pediu isso, reforço que é a diferença entre um assistente útil e um "personagem decorativo".
- **Cache/estado otimista** ao criar/editar/excluir (a lista atualiza na hora, antes mesmo da confirmação do servidor, com rollback em caso de erro) — resolve a sensação de app "travado" que existe hoje.
- **Persistência local-first** (ex.: IndexedDB via uma camada de storage no `services/`) para tarefas, rotina, hábitos e hidratação funcionarem offline, com sincronização quando a API real existir — conecta diretamente com os itens 46/61 do seu briefing.
- Não recomendo investir em scraping de influenciadores/tendências de livros agora (item 36/35): a arquitetura será preparada (uma interface `IContentSource` trocável), mas a implementação fica mockada e claramente sinalizada como mock, evitando um recurso frágil que quebra sozinho no futuro.

## 16. Riscos da migração

- **Risco baixo-médio**: migrar Tailwind → CSS Modules tela por tela pode introduzir regressões visuais temporárias; mitigo fazendo isso por Design System primeiro (uma vez que os componentes base mudam, o impacto visual é previsível e comparável antes/depois).
- **Risco baixo**: upgrade do Next 14.1 → versão mais nova pode exigir pequenos ajustes de config; será feito isolado, com build validado antes de seguir.
- **Risco médio**: introduzir Zustand + estado otimista exige revisar todos os pontos de criação/edição/exclusão ao mesmo tempo (tasks e events) — vou tratar isso como uma fase própria e fechada (Fase 7), sem misturar com a criação de features novas.
- **Risco baixo**: trocar `moment` por `date-fns`/`dayjs` é mecânico, mas toca vários arquivos de formatação de data — será feito com testes unitários dos utilitários de data antes da troca.
- **Risco a monitorar, não a eliminar sozinho**: a dependência de rede do `next/font/google` no build. Vou resolver localmente (fonte hospedada no projeto), mas vale confirmar que o seu ambiente de build/deploy real tem acesso à internet até lá.

## 17. Ordem de implementação sugerida

Sigo a ordem que você já propôs no briefing (Fases 1 a 25), com um ajuste: a **Fase 1 (correção de build)** primeiro resolve o bug do `AxiosAdapter`/erro serializado — sem isso, nenhuma fase seguinte tem como validar build de forma confiável. Depois de cada fase, rodo `npm run build` novamente e só avanço com build limpo.

---

## Próximo passo

Este documento é só o diagnóstico — nenhuma refatoração grande foi feita ainda (o único arquivo tocado foi uma cópia temporária de `layout.tsx` dentro do meu ambiente de auditoria, para conseguir ver os erros por trás da falha de fonte; já revertido).

Fico no aguardo da sua aprovação para começar pela **Fase 1 (correção de build e bugs críticos)**. Se quiser, posso já começar por ela isoladamente e te mostrar o `diff` + build passando antes de seguir para as fases seguintes.
