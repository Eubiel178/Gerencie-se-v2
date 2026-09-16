# Como funciona: criar uma tarefa (do clique ao banco e de volta)

Este documento complementa o `GUIA-DE-ESTUDOS.md` (que é uma lista de
leitura por conceito). Aqui a ideia é diferente: seguir UMA requisição
real, de ponta a ponta, com o código de verdade do projeto em cada
passo — pra você ver as camadas conversando entre si, não só saber que
elas existem.

O exemplo escolhido: o que acontece quando você clica em "Nova Tarefa",
preenche o formulário e clica em "Cadastrar".

---

## Visão geral (o mapa antes de andar por ele)

```
[Navegador]                                    [Servidor]

AddTask (Client Component)
  │ preenche formulário
  │ clica "Cadastrar"
  ▼
useFormModal (hook compartilhado)
  │ valida no CLIENTE (zod)
  │ chama a Server Action
  ▼
createTaskAction ──────────────────────────►  roda no servidor
                                                │ valida de novo (zod, no SERVIDOR)
                                                │ descobre o userId da sessão
                                                ▼
                                               LocalTask.create (repositório)
                                                │ monta o INSERT
                                                ▼
                                               Drizzle ORM ──► PostgreSQL
                                                │
                                                ◄─── { id: "uuid-novo" }
  ◄─────────────────────────────────────────────
  │ fecha o modal
  │ router.refresh() → Next.js busca a lista atualizada
  ▼
Tela mostra a tarefa nova
```

Cada seta que cruza a linha pontilhada (cliente → servidor) é uma
requisição de rede de verdade, mesmo que o código pareça uma chamada de
função comum (`await createTaskAction(data)`). Isso é o "truque" das
Server Actions do Next.js — parece uma função local, mas o `"use server"`
no topo do arquivo faz o Next.js embrulhar isso numa requisição HTTP
automaticamente. Vamos destrinchar cada camada.

---

## 1. O clique — Client Component

Arquivo: `src/features/tasks/components/modal/add-task/index.tsx`

```tsx
"use client";
```

Essa linha no topo do arquivo é a primeira coisa a entender. Por padrão,
TODO componente no Next.js App Router roda só no SERVIDOR (é um "Server
Component") — ele nunca manda JavaScript pro navegador, só HTML já
pronto. Isso é ótimo pra performance, mas um componente assim não
consegue reagir a clique, não tem `useState`, não sabe o que é "agora"
no navegador.

`"use client"` é uma exceção: diz ao Next.js "este componente específico
precisa rodar no navegador também, porque ele tem estado e interação".
`AddTask` precisa disso porque controla se o modal está aberto
(`isOpen`), lê o que a pessoa digitou, etc.

Dentro do componente:

```tsx
const {
  register,
  setValue,
  control,
  formState: { errors, isSubmitting },
  isOpen,
  openModal,
  closeModal,
  submitError,
  handleFormSubmit,
} = useFormModal<FormData>({
  schema: validationSchema,
  defaultValues: { tag: "", title: "", /* ... */ },
  onSubmit: (data) => createTaskAction(data),
});
```

Repare: `AddTask` não sabe NADA sobre banco de dados, SQL, ou como a
tarefa é salva. Ele só sabe "quando o formulário for enviado com sucesso,
chama `createTaskAction(data)`". Essa separação é o ponto central da
arquitetura do projeto (ver seção 1 do `GUIA-DE-ESTUDOS.md`, Clean
Architecture) — o componente de UI não deveria precisar saber como os
dados são persistidos.

## 2. O hook compartilhado — `useFormModal`

Arquivo: `src/hooks/use-form-modal.ts`

```ts
export function useFormModal<TFormData extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
}: UseFormModalOptions<TFormData>) {
```

Aqui aparece um **generic** de TypeScript: `<TFormData extends
FieldValues>`. Leia assim: "este hook funciona com QUALQUER formato de
formulário, mas quero que o TypeScript saiba qual é esse formato
específico em cada uso, pra `data` dentro de `onSubmit` ter o tipo certo
(não `any`)". Quando `AddTask` escreve `useFormModal<FormData>(...)`, ele
está "preenchendo" esse generic com o tipo `FormData` daquele formulário
específico — dali pra frente, o TypeScript sabe exatamente quais campos
existem.

Esse hook existe porque **7 modais diferentes do projeto** (tarefa,
objetivo, hábito, item de rotina, evento...) tinham o mesmíssimo
molde: abrir/fechar modal, validar com zod, chamar uma action, mostrar
erro, fechar e atualizar a tela. Em vez de copiar esse bloco 7 vezes
(e arriscar cada cópia divergir um pouquinho com o tempo), ele virou
UMA função reutilizável. Isso é o princípio DRY (Don't Repeat Yourself) —
vale a pena procurar sobre isso também.

A parte que dispara tudo:

```ts
const handleFormSubmit = form.handleSubmit(async (data) => {
  setSubmitError(null);
  const result = await onSubmit(data);   // ← aqui chama createTaskAction

  if (result.error) {
    setSubmitError(result.error);
    return;
  }

  closeModal();
  router.refresh();
});
```

`form.handleSubmit` é do `react-hook-form` — ele só deixa a função de
dentro rodar se a validação do **zod** (a lib `schema`) passar primeiro.
Ou seja: antes mesmo de tentar chamar o servidor, o navegador já
bloqueia um título vazio, um e-mail mal formatado, etc. Isso é validação
"otimista" — rápida, sem esperar rede, mas **nunca é a única linha de
defesa** (ver próxima seção).

## 3. Atravessando a fronteira — a Server Action

Arquivo: `src/features/tasks/actions.ts`

```ts
"use server";

export async function createTaskAction(
  data: domain.CreateTask.Params
): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  // ...
}
```

`"use server"` é o espelho de `"use client"` — diz ao Next.js "esta
função só pode rodar no servidor, nunca no navegador". Quando o código
do navegador chama `createTaskAction(data)`, o Next.js:

1. Serializa `data` (transforma em JSON);
2. Manda numa requisição HTTP pro servidor;
3. Roda a função de verdade lá;
4. Serializa o retorno e manda de volta.

Do ponto de vista de quem escreve o código, parece uma chamada de função
normal — mas por baixo é uma requisição de rede real, com toda a
latência, possibilidade de falha de conexão, etc. Entender isso é
importante pra não estranhar por que existe `try/catch`,
`isSubmitting`, tratamento de erro de rede, etc. — são exatamente os
mesmos cuidados que você teria com `fetch()`.

**Por que valida os dados nesta camada TAMBÉM**, se já validou no
navegador? Porque o navegador não é confiável — alguém pode desligar o
JavaScript, usar uma ferramenta pra chamar a Server Action diretamente
sem passar pelo formulário, ou simplesmente haver um bug no formulário.
A regra é: **validação no cliente é UX (feedback rápido); validação no
servidor é SEGURANÇA (nunca pode ser pulada)**. As duas usam o mesmo
`zod`, muitas vezes o mesmo schema exato — ver `src/validation/task-schema.ts`.

Mais adiante na mesma função:

```ts
const repo = getTaskFetcher();
const userId = await requireUserId();
const { id } = await repo.create(data);
```

`requireUserId()` lê a sessão de quem está logado — **nunca** confia
num `userId` vindo do formulário (isso seria uma falha de segurança
grave: qualquer pessoa poderia mandar `userId: "outra-pessoa"` e criar
tarefa na conta de outro usuário). O dono do dado é sempre descoberto
no servidor, a partir do cookie de sessão.

## 4. O repositório — onde o SQL de verdade acontece

Arquivo: `src/features/tasks/data/local-task.ts`

```ts
export class LocalTask
  implements
    domain.CreateTask,
    domain.LoadAllTasks,
    domain.UpdateTask,
    // ... mais 6 interfaces
{
  async create(params: domain.CreateTask.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(tasks).values({
      id,
      userId,
      tag: params.tag,
      title: params.title,
      // ...
    });

    return { id };
  }
```

`db.insert(tasks).values({...})` é **Drizzle ORM** — ele traduz esse
código TypeScript pra um `INSERT INTO task (...) VALUES (...)` de SQL de
verdade, rodando contra o Postgres. A vantagem de usar isso em vez de
escrever `INSERT INTO...` como texto puro: o TypeScript sabe o formato
exato da tabela `task` (ver `src/db/schema.ts`) e avisa em tempo de
compilação se você esquecer um campo obrigatório ou usar o tipo errado
(string onde devia ser número, por exemplo).

Repare o `implements domain.CreateTask, domain.LoadAllTasks, ...` — a
classe promete cumprir VÁRIOS contratos pequenos (um por operação:
criar, listar, atualizar...), não um contrato gigante "TaskRepository".
Isso é Interface Segregation (o "I" do SOLID — está no
`GUIA-DE-ESTUDOS.md`, seção 3): cada parte do sistema que usa
`LocalTask` só precisa conhecer a fatia que realmente usa.

## 5. O contrato — `domain/create.ts`

Arquivo: `src/features/tasks/domain/create.ts`

```ts
export type CreateTask = {
  create: (params: CreateTask.Params) => Promise<{ id: string }>;
};

export namespace CreateTask {
  export type Params = Omit<
    ITask,
    | "id"
    | "userId"
    | "syncStatus"
    | "completed"
    | "completedAt"
    // ...
  >;
}
```

Dois conceitos de TypeScript pra reparar aqui:

- **`Omit<Tipo, "campo1" | "campo2">`**: pega o tipo `ITask` (que
  descreve uma tarefa JÁ CRIADA, com `id`, `completed`, etc.) e produz um
  tipo NOVO removendo os campos que não fazem sentido pedir pra CRIAR
  uma tarefa — afinal, o `id` é gerado pelo servidor, `completed` começa
  sempre `false`, etc. Isso evita ter que escrever um tipo `CreateTaskParams`
  do zero e duplicar manualmente os ~15 campos que `ITask` já tem —
  se `ITask` ganhar um campo novo amanhã, `CreateTask.Params` já reflete
  isso automaticamente (menos um `Omit`, se for um campo que também não
  deveria vir na criação).
- **`namespace CreateTask`**: um jeito de "agrupar" o tipo `CreateTask`
  (uma função) com `CreateTask.Params` (o tipo dos parâmetros dela) sob
  o mesmo nome, como se fossem parentes. É por isso que em outros
  arquivos você vê `domain.CreateTask.Params` — está navegando dentro
  desse agrupamento.

Esse arquivo é "domain" (domínio) porque descreve uma REGRA DE NEGÓCIO
("pra criar uma tarefa, você precisa disso") sem mencionar Drizzle,
Postgres, nem HTTP. Quem implementa de verdade é a `LocalTask` (camada
`data/`) — mas o `domain/` nem sabe que ela existe. Se um dia o projeto
trocasse Postgres por outro banco, só a camada `data/` mudaria; `domain/`
e os componentes continuariam iguais. Essa é a "Inversão de Dependência"
mencionada no `GUIA-DE-ESTUDOS.md`.

## 6. A volta — atualizando a tela

De volta em `useFormModal`:

```ts
const result = await onSubmit(data);

if (result.error) {
  setSubmitError(result.error);
  return;
}

closeModal();
router.refresh();
```

`router.refresh()` (do Next.js) não recarrega a página inteira (isso
seria lento e perderia o estado do resto da tela) — ele só pede pro
servidor buscar de novo os dados dos Server Components afetados
(a lista de tarefas) e atualiza só essa parte. Some com isso um detalhe
que só faz sentido lembrar do lado do servidor: em `actions.ts` tem uma
chamada `revalidatePath("/home")` — ela avisa ao Next.js "os dados da
rota /home podem ter mudado, não sirva a versão em cache da próxima vez".
As duas coisas juntas (`revalidatePath` no servidor + `router.refresh()`
no cliente) são o que faz a tarefa nova aparecer na lista sem F5.

---

## O que estudar, na ordem que este documento seguiu

1. **`"use client"` / `"use server"` e o modelo de Server/Client
   Components do Next.js** — sem entender isso, o resto não faz
   sentido. Ver seção 4 do `GUIA-DE-ESTUDOS.md`.
2. **react-hook-form + zod** (validação de formulário) — como os dois
   se conectam via `zodResolver`.
3. **Generics do TypeScript** (`<TFormData extends FieldValues>`) — pra
   entender `useFormModal` de verdade, não só copiar o padrão.
4. **`Omit<T, K>` e outros "utility types" do TypeScript** (`Partial`,
   `Pick`, `Record` — vale procurar os 3 juntos) — usados o tempo
   inteiro no `domain/` do projeto.
5. **Drizzle ORM** — ver seção 5 do `GUIA-DE-ESTUDOS.md`.
6. **SOLID, principalmente Dependency Inversion** — pra entender por
   que `domain/create.ts` e `data/local-task.ts` são arquivos
   separados em vez de um só.

## Próximo passo sugerido

Esse documento seguiu o caminho de CRIAR algo (uma escrita/mutação).
Um bom próximo exercício — em vez de eu escrever, tente você: abra
`src/features/tasks/index.tsx` (o Server Component que MOSTRA a lista de
tarefas) e tente narrar, do mesmo jeito, o caminho de LEITURA: como os
dados chegam do banco até aparecer na tela, sem nenhum clique envolvido
(é bem mais curto — Server Components podem buscar dado direto, sem
Server Action nenhuma). Se travar em algum ponto, me chama.
