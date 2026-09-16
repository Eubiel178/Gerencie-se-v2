# Como funcionam as migrations (Drizzle + Postgres)

Complementa o `GUIA-DE-ESTUDOS.md` (seção 5, Drizzle ORM). Aqui a ideia é
a mesma do `COMO-FUNCIONA-CRIAR-TAREFA.md`: nada de teoria solta — vamos
usar as DUAS migrations reais que você acabou de rodar
(`0027_remarkable_epoch.sql` e `0028_backfill_existing_users_as_email_verified.sql`)
como exemplo vivo.

---

## O problema que migration resolve

Seu banco de produção e seu banco local são dois bancos DIFERENTES, cada
um com seus próprios dados. Quando você muda `src/db/schema.ts` (por
exemplo, adiciona uma tabela nova), essa mudança só existe no seu código
— o banco de verdade (local ou produção) não sabe disso até alguém rodar
o `ALTER TABLE`/`CREATE TABLE` correspondente nele.

Migration é esse `ALTER TABLE`/`CREATE TABLE` salvo em arquivo, numerado
em ordem, pra poder ser aplicado em QUALQUER banco (local, produção, o
banco de um colega) e sempre chegar no mesmo resultado. Sem isso, cada
banco viraria uma "árvore genealógica" própria de mudanças manuais,
impossível de reproduzir com confiança em outro lugar.

## As duas pontas do fluxo Drizzle

```
src/db/schema.ts  →  npm run db:generate  →  drizzle/000X_nome.sql  →  npm run db:migrate  →  banco de verdade
   (você edita)        (Drizzle compara          (fica no seu             (você roda, aponta
                        contra a última            repositório,            pro banco que
                        migration salva e           versionado)             quiser)
                        gera o SQL da
                        diferença)
```

Dois comandos, dois momentos MUITO diferentes:

- **`db:generate`** roda no seu computador, não precisa de conexão real
  com banco nenhum — só olha `schema.ts` e compara com o que já existe
  em `drizzle/`. Produz um ARQUIVO `.sql`. Isso é o que eu fiz quando
  adicionei a tabela `email_verification_code`.
- **`db:migrate`** precisa de uma conexão real (`DATABASE_URL`) — é ele
  quem de fato conecta no Postgres e roda o SQL pendente. Isso é o
  comando que você acabou de rodar.

## Exemplo real 1: uma migration "normal" (gerada do schema)

Eu editei `src/db/schema.ts` adicionando:

```ts
export const emailVerificationCodes = pgTable("email_verification_code", {
  userId: text("user_id").primaryKey().references(() => users.id, ...),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  attempts: integer("attempts").notNull().default(0),
});
```

Rodei `npm run db:generate`, e o Drizzle escreveu sozinho
`drizzle/0027_remarkable_epoch.sql`:

```sql
CREATE TABLE "email_verification_code" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_verification_code" ADD CONSTRAINT "email_verification_code_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
```

Repare: isso é **SQL puro**, gerado automaticamente comparando o `schema.ts`
novo contra o `schema.ts` de quando a última migration foi gerada. Você
nunca escreve esse SQL à mão nesse caso — só edita o TypeScript e deixa o
Drizzle calcular a diferença.

## Exemplo real 2: uma migration "custom" (escrita à mão)

Nem toda mudança necessária é uma mudança de SCHEMA (criar/alterar
tabela). Às vezes você precisa mudar DADOS que já existem. No seu caso: a
coluna `email_verified` já existia desde sempre (vem do Auth.js), só que
NINGUÉM tinha esse campo preenchido até agora — e a partir de agora, o
app passou a EXIGIR ele preenchido pra liberar acesso (`src/app/home/layout.tsx`).
Sem tratar isso, toda conta que já existia (inclusive a sua) ficaria
trancada na primeira visita depois do deploy.

Isso não é uma mudança de schema (a coluna já existe) — é uma mudança de
DADO. Pra isso existe `drizzle-kit generate --custom`, que cria um
arquivo `.sql` VAZIO (o Drizzle não sabe gerar isso sozinho, porque não é
uma diferença de schema) pra você escrever à mão. Foi assim que nasceu
`drizzle/0028_backfill_existing_users_as_email_verified.sql`:

```sql
UPDATE "user" SET "email_verified" = now() WHERE "email_verified" IS NULL;
```

Uma linha só, mas crítica — sem ela, o deploy quebraria login pra todo
mundo. **Migration não é só "mudar a estrutura da tabela"** — pode (e
às vezes DEVE) também consertar/preparar os dados que já estão lá.

## Como o Drizzle sabe o que já rodou (e por que rodar de novo não duplica nada)

Você deve ter reparado nas mensagens que apareceram quando rodou
`db:migrate`:

```
NOTICE: schema "drizzle" already exists, skipping
NOTICE: relation "__drizzle_migrations" already exists, skipping
```

Isso é o Postgres avisando (não é erro) que duas coisas de controle já
existiam: um schema (`drizzle`, um "namespace" dentro do banco, separado
das suas tabelas normais) e uma TABELA dentro dele,
`__drizzle_migrations` — é aí que o Drizzle anota "já rodei a migration
tal, nesta data". Cada vez que você chama `db:migrate`, ele:

1. Olha `drizzle/meta/_journal.json` (a lista de TODAS as migrations que
   existem no seu repositório, na ordem certa — `0000_fast_calypso`,
   `0001_tricky_quicksilver`, ..., até `0028_backfill_...`).
2. Olha a tabela `__drizzle_migrations` NO BANCO ALVO, pra saber quais
   dessas ele já aplicou ali.
3. Roda só as que faltam, na ordem.

Por isso rodar `db:migrate` de novo num banco que já está em dia não
quebra nada — ele simplesmente não encontra nada pendente e termina sem
fazer nada. Essa é a peça-chave que faz o processo ser seguro de repetir.

## O que realmente muda entre "migrar local" e "migrar produção"

Nenhum comando muda. O que muda é **uma única variável de ambiente**:
`DATABASE_URL`. O comando `npm run db:migrate` não sabe (nem precisa
saber) se está falando com seu Postgres local ou com o Neon de produção
— ele só lê `DATABASE_URL` do ambiente em que foi chamado e conecta lá.

- Sem nada especial: `npm run db:migrate` usa o `DATABASE_URL` que está
  no seu `.env` local → migra o banco local.
- Com a variável trocada NA HORA (só pra esse comando, sem editar o
  `.env`): migra onde quer que essa URL aponte.

No PowerShell (Windows), é exatamente o que você acabou de fazer:

```powershell
$env:DATABASE_URL="sua-connection-string-de-producao"; npm run db:migrate
```

Isso define a variável só para essa sessão do terminal (ou só para esse
comando, dependendo de como você rodou) — não sobrescreve seu `.env`
local. Da próxima vez que você abrir um terminal novo e rodar `npm run
dev`, ele volta a usar o `DATABASE_URL` do `.env`, apontando pro seu
banco local de novo.

## O risco real (por que a ORDEM importa)

Seu código (o app rodando) e o schema do banco precisam estar de acordo.
Se você faz deploy do código ANTES de migrar produção:

- O código novo tenta usar a tabela `email_verification_code`, que ainda
  não existe lá → erro.
- Pior: `src/app/home/layout.tsx` passa a EXIGIR `email_verified`
  preenchido — sem o backfill (migration 0028) já ter rodado, TODA conta
  existente (inclusive a sua) fica bloqueada na hora.

Por isso a ordem certa é sempre: **migrar primeiro, código depois** (ou,
na pior das hipóteses, os dois quase juntos, mas nunca código antes de
migration quando a migration é necessária pro código novo funcionar).

## Resumindo o que você acabou de fazer

1. Copiou a connection string de produção (Neon/Supabase/etc.).
2. Rodou `db:migrate` com `DATABASE_URL` apontando pra ela.
3. O Drizzle comparou `drizzle/meta/_journal.json` contra
   `__drizzle_migrations` DAQUELE banco, viu que faltavam `0027` e
   `0028`, e rodou os dois SQL na ordem.
4. Agora o banco de produção tem a tabela nova E toda conta existente
   já está marcada como verificada — só falta o deploy do código em si
   (`docs/DEPLOY.md`, seção 5) pra essas mudanças entrarem em uso.

## Pra praticar

Da próxima vez que eu (ou você) mudar `schema.ts`, tente prever ANTES de
rodar `db:generate`: vai ser um `CREATE TABLE`, um `ALTER TABLE
ADD COLUMN`, ou algo que precisa de uma migration `--custom` (dado, não
estrutura)? Depois confere se acertou lendo o `.sql` gerado.
