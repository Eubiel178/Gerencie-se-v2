# Guia de estudos — Gerencie-se-v2

Lista de artigos e vídeos pra entender os conceitos usados no projeto hoje.
Organizado do mais fundamental (por que a pasta é assim) pro mais específico
(cada tecnologia). Onde fez sentido, apontei o arquivo do projeto onde aquele
conceito aparece de verdade, pra você conseguir ler a teoria e already ver
ela aplicada.

---

## 1. Clean Architecture (por que existe `domain/` e `data/` separados)

A ideia central: as regras de negócio (`domain/`) nunca podem depender de
detalhes técnicos (banco de dados, framework). É o banco que depende das
regras, nunca o contrário — isso é a "Inversão de Dependência" (o D do
SOLID, seção 2).

- **Vídeo (o próprio criador explicando)**: [Clean Code: Architecture, Episode 67 — Screaming Architecture, por Robert "Uncle Bob" Martin](https://cleancoders.com/episode/clean-code-episode-67)
- **Artigo oficial (o post original)**: [Screaming Architecture — Clean Coder Blog](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- **Livro/resumo**: [Book Review: Clean Architecture by Robert C. Martin](https://reflectoring.io/book-review-clean-architecture/)
- **No projeto**: `src/features/tasks/domain/task.ts` (a regra de negócio, sem Drizzle) vs. `src/features/tasks/data/local-task.ts` (quem implementa usando Drizzle).

## 2. Screaming Architecture (por que `features/tasks/`, não `@core/domain/`)

Por que a pasta de primeiro nível é `features/tasks/`, `features/events/` —
e não `controllers/`, `models/`, `services/`. A ideia (do mesmo Uncle Bob):
olhando a estrutura de pastas, alguém devia conseguir adivinhar o que o
sistema faz, não qual framework ele usa.

- **Artigo original**: [Screaming Architecture — Clean Coder Blog](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- **Explicação mais didática**: [Screaming Architecture — Milan Jovanović](https://milanjovanovic.tech/blog/screaming-architecture)
- **Artigo introdutório**: [What is Screaming Architecture? — DEV Community](https://dev.to/nilebits/what-is-screaming-architecture-442o)

## 3. SOLID (as 5 regras por trás de tudo isso)

Os 5 princípios (Single Responsibility, Open/Closed, Liskov Substitution,
Interface Segregation, Dependency Inversion). O mais importante pra este
projeto é o último — é ele que justifica `domain/` e `data/` serem pastas
separadas.

- **Artigo em português-friendly**: [SOLID Principles Explained in Plain English — freeCodeCamp](https://www.freecodecamp.org/news/solid-principles-explained-in-plain-english/)
- **Vídeo rápido (5 min)**: [SOLID Principles Explained in 5 Minutes](https://www.youtube.com/watch?v=WBPxN2C_PNg)
- **Vídeo mais completo**: [SOLID Principles Explained](https://www.youtube.com/watch?v=V3TUEeB0kW0)
- **No projeto**: `src/features/tasks/data/local-task.ts` — a classe `LocalTask implements domain.CreateTask, domain.LoadAllTasks, ...` é Interface Segregation (várias interfaces pequenas) + Dependency Inversion (a classe depende do contrato do `domain/`, o `domain/` não sabe que `LocalTask` existe).

## 4. Next.js App Router — Server Components e Server Actions

O `app/` roda em cima disso. Entender a diferença entre Server Component
(roda só no servidor, pode acessar banco direto) e Client Component (roda
no navegador, não pode) é essencial pra entender por que `"use client"` e
`"use server"` aparecem espalhados pelo código.

- **Documentação oficial**: [Next.js Docs — App Router](https://nextjs.org/docs/app)
- **Documentação oficial — Server Actions**: [Data Fetching: Server Actions and Mutations](https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-actions-and-mutations)
- **Guia completo 2026**: [Next.js Server Actions: The Complete Guide (2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions)
- **Artigo prático sobre Server Components**: [React Server Components in practice — Medium](https://medium.com/@vyakymenko/react-server-components-in-practice-next-js-d1c3c8a4971f)
- **No projeto**: `src/features/tasks/actions.ts` (Server Actions, `"use server"`) chamado pelos formulários em `src/features/tasks/components/modal/add-task/index.tsx` (Client Component, `"use client"`).

## 5. Drizzle ORM + PostgreSQL

O ORM que troca SQL cru por código TypeScript tipado. Essencial pra
entender `src/db/schema.ts` e como rodar as migrations.

- **Documentação oficial — primeiros passos**: [Drizzle ORM — Get started](https://orm.drizzle.team/docs/get-started)
- **Documentação oficial — Postgres especificamente**: [Get Started with Drizzle and PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new)
- **Configurar Postgres localmente**: [Drizzle ORM — How to setup PostgreSQL locally](https://orm.drizzle.team/docs/guides/postgresql-local-setup)
- **Tutorial passo a passo**: [Drizzle ORM Tutorial: Type-Safe Postgres in 13 Steps (2026)](https://tech-insider.org/drizzle-orm-tutorial-typescript-postgres-2026/)
- **No projeto**: `src/db/schema.ts` (as tabelas), `drizzle.config.ts` (configuração), comandos `npm run db:generate` / `npm run db:migrate`.

## 6. Auth.js (NextAuth v5) — login e sessão

A biblioteca de autenticação usada (`src/lib/auth.ts`, `src/lib/auth.config.ts`).
Explica por que existem dois arquivos de configuração (um "edge-safe" pro
middleware, outro completo pro resto).

- **Guia completo 2026 (Next.js 16)**: [Auth.js v5 with Next.js 16: The Complete Authentication Guide (2026)](https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg)
- **Guia com Credentials provider (o que o projeto usa)**: [Auth.js (NextAuth v5) Credentials Authentication in Next.js App Router](https://medium.com/@vetriselvan_11/auth-js-nextauth-v5-credentials-authentication-in-next-js-app-router-complete-guide-ef77aaae7fdf)
- **Guia anotado**: [Next-auth App Router Credentials — An Annotated Guide](https://dev.to/rafaatxyz/next-auth-app-router-credentials-an-annotated-guide-4ijp)
- **No projeto**: `src/lib/auth.ts` (config completa), `src/lib/auth.config.ts` (edge-safe, usada em `src/proxy.ts`).

## 7. Zustand — estado compartilhado no cliente

Por que `src/features/tasks/task-store.ts` existe: pra lista de tarefas
atualizar na tela sem precisar recarregar a página inteira depois de
criar/editar/excluir.

- **Documentação oficial**: [Zustand Docs](https://zustand.docs.pmnd.rs/)
- **Guia de aprendizado oficial**: [Learn — Zustand Docs](https://zustand.docs.pmnd.rs/learn/)
- **Quando usar (comparado com Context/Redux)**: [State management in 2025: when to use Context, Redux, Zustand or Jotai — DEV Community](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- **No projeto**: `src/features/tasks/task-store.ts`, usado em `src/features/tasks/components/tasks-list/card/index.tsx`.

---

## Ordem sugerida pra estudar

1. SOLID (seção 3) — a base de tudo.
2. Clean Architecture (seção 1) — como SOLID vira estrutura de pastas.
3. Screaming Architecture (seção 2) — o porquê do nome das pastas.
4. Next.js App Router (seção 4) — o framework em si.
5. Drizzle + Postgres (seção 5) e Auth.js (seção 6) — em paralelo, são independentes.
6. Zustand (seção 7) — o mais rápido de entender, deixa por último.
