# Guia de Deploy — Gerencie-se

Passo a passo para publicar o projeto (hoje ele só roda local, com Postgres
na sua máquina). Cobre banco de dados, variáveis de ambiente e o deploy em
si. Assume Vercel como host (é o mais direto para Next.js, feito pela
mesma empresa), mas os passos de banco/env valem para qualquer host.

---

## 1. Banco de dados (Postgres hospedado)

Hoje seu `DATABASE_URL` aponta para um Postgres local — só existe na sua
máquina. Para publicar, você precisa de um Postgres hospedado, sempre
ligado. Três opções com plano gratuito, escolha uma:

- **[Neon](https://neon.tech)** — Postgres serverless, integração nativa
  com Vercel (recomendado se for usar Vercel).
- **[Supabase](https://supabase.com)** — Postgres + extras (não precisa
  usar os extras).
- **[Railway](https://railway.app)** — Postgres simples, bom se preferir
  hospedar o app lá também.

Passos (usando Neon como exemplo — os outros são parecidos):

1. Crie uma conta e um projeto novo.
2. Copie a **connection string em modo "pooled"/"pgbouncer"** (Neon e
   Supabase mostram as duas variantes — a pooled costuma ter `-pooler` no
   host ou porta `6543`). Use sempre a pooled em produção na Vercel: cada
   deploy pode rodar várias Serverless Functions ao mesmo tempo, cada uma
   abrindo sua própria conexão — sem um pooler na frente, isso pode
   estourar o limite de conexões do plano gratuito do banco.
3. Guarde essa URL — ela vira o `DATABASE_URL` de produção (nunca o mesmo
   valor do seu `.env` local).

---

## 2. Variáveis de ambiente

Nenhuma variável de `.env` é lida do arquivo em produção — cada host tem
seu próprio painel para configurá-las (o `.env` local nunca é enviado no
deploy, ele está no `.gitignore` de propósito). Configure estas, com
valores de produção:

| Variável | Valor em produção |
|---|---|
| `DATABASE_URL` | Connection string do Postgres hospedado (passo 1) |
| `AUTH_SECRET` | Gere um novo, só para produção: `openssl rand -base64 32` (nunca reaproveite o do `.env` local) |
| `AUTH_GOOGLE_ID` | Mesmo Client ID do Google Cloud (ver passo 3 se precisar recriar) |
| `AUTH_GOOGLE_SECRET` | Mesmo Client Secret |
| `GOOGLE_CALENDAR_CLIENT_ID` | Pode reaproveitar o mesmo Client ID acima |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Pode reaproveitar o mesmo Client Secret acima |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://SEU-DOMINIO.com/api/google-calendar/callback` (com o domínio real, não localhost) |
| `RESEND_API_KEY` | Chave da conta Resend (ver `EMAIL_SETUP.md`) — opcional; sem ela, o convite de compartilhamento é criado normalmente, só o e-mail não é enviado |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-DOMINIO.com` (usado para montar o link dentro do e-mail de convite) |
| `CRON_SECRET` | Gere um valor aleatório (`openssl rand -base64 32`) — obrigatório para o resumo semanal automático funcionar (ver seção 7) |
| `TOKEN_ENCRYPTION_KEY` | Gere um valor novo (`openssl rand -base64 32`) — protege os tokens do Google Agenda salvos no banco. **Nunca reaproveite o valor do seu `.env` local nem troque depois de definido em produção**: trocar invalida todas as conexões já feitas, forçando todo mundo a reconectar o Google Agenda |

Na Vercel: **Project Settings → Environment Variables**. Em outro host,
procure por "Environment Variables" ou "Config Vars" no painel.

Se hospedar em qualquer lugar que **não** seja a Vercel (self-host atrás
de outro proxy), defina também `AUTH_TRUST_HOST=true` — sem ela, o login
falha, porque o app só confia automaticamente no header `Host` quando
detecta que está rodando na própria Vercel.

---

## 3. Atualizar o Google Cloud Console para produção

O login com Google e a integração com o Google Agenda usam URIs de
redirecionamento que hoje só apontam para `localhost`. Antes do primeiro
deploy:

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/) →
   **APIs e serviços → Credenciais** → seu Client ID OAuth.
2. Em **URIs de redirecionamento autorizados**, adicione (mantendo os de
   localhost, que continuam valendo para desenvolvimento):
   - `https://SEU-DOMINIO.com/api/auth/callback/google`
   - `https://SEU-DOMINIO.com/api/google-calendar/callback`
3. Se o app ainda estiver em modo **Teste** na tela de consentimento OAuth,
   ele continua funcionando em produção — só usuários adicionados como
   "usuários de teste" conseguem logar. Para abrir para qualquer usuário
   Google, é preciso publicar o app (sai do modo de teste), o que exige
   verificação do Google por causa do escopo do Calendar (ver
   `GOOGLE_SETUP.md`, seção 2).

---

## 4. Migrations no banco de produção

Antes (ou logo após) o primeiro deploy, aplique o schema no banco novo:

```bash
# localmente, apontando DATABASE_URL para o banco de PRODUÇÃO
DATABASE_URL="sua-connection-string-de-producao" npm run db:migrate
```

No Windows (PowerShell):
```powershell
$env:DATABASE_URL="sua-connection-string-de-producao"; npm run db:migrate
```

Isso roda as migrations existentes em `drizzle/` contra o banco novo —
não precisa gerar migrations novas para isso.

Opcional: `npm run db:seed` (mesma forma) cria um usuário de demonstração
— normalmente você **não** quer isso em produção real, pule este passo se
o banco for para uso de verdade.

---

## 5. Deploy (Vercel)

1. Suba o repositório para o GitHub (se ainda não estiver — hoje o
   branch `modernizacao` só existe local).
2. Em [vercel.com](https://vercel.com), **Add New → Project**, importe o
   repositório.
3. Framework preset: Next.js (detectado automaticamente).
4. Configure as variáveis de ambiente do passo 2 antes de clicar em
   **Deploy**.
5. Deploy. A cada novo push no branch de produção (geralmente `main`),
   a Vercel publica automaticamente.

---

## 6. Depois do primeiro deploy

- Teste o login (e-mail/senha e Google) e a conexão com o Google Agenda
  no domínio real — os fluxos de OAuth só funcionam com HTTPS e o domínio
  cadastrado no passo 3.
- Confirme que `AUTH_SECRET` de produção é **diferente** do local (se
  vazar um, o outro continua seguro).
- Guarde a connection string de produção em um cofre de senhas — ela não
  fica em nenhum arquivo do repositório.

---

## 7. Resumo semanal automático (cron externo)

O app não tem agendador próprio — `/api/cron/weekly-summary` precisa ser
chamado periodicamente por algo de fora (ex. [cron-job.org](https://cron-job.org),
gratuito). Configure lá uma chamada `POST` semanal para
`https://SEU-DOMINIO.com/api/cron/weekly-summary` com o header:

```
Authorization: Bearer <o mesmo valor de CRON_SECRET>
```

Sem `CRON_SECRET` configurado na Vercel, a rota sempre responde 503 e
nenhum e-mail é enviado — nada quebra, só fica desligado.

---

## 8. Segurança — pendências conhecidas para depois do primeiro deploy

- **Login por e-mail/senha sem bloqueio de conta.** Implementado, de
  propósito, sem lockout: em vez de bloquear a conta após senhas erradas
  repetidas (o que poderia trancar o próprio usuário fora dela), o app
  envia um e-mail de alerta ("tentativas de login na sua conta") depois
  de 5 tentativas malsucedidas em 30 minutos, com um cooldown de 1 hora
  entre alertas (ver `src/lib/login-attempt-guard.ts` e
  `login-attempt-tracker.ts`). Requer `RESEND_API_KEY` configurada — sem
  ela, o alerta simplesmente não é enviado (mesmo comportamento tolerante
  a falha do resumo semanal). A conta nunca fica bloqueada, mesmo sem
  e-mail configurado.
- **"Esqueceu sua senha?" na tela de login ainda é um link vazio**
  (`href="#"`) — um fluxo de recuperação de senha via e-mail (token,
  expiração, tela dedicada) não foi implementado nesta rodada. O que
  existe hoje é trocar a senha **estando logado** (Configurações → Conta
  → Trocar senha, exige a senha atual) — não ajuda quem esqueceu a senha
  de verdade e não consegue entrar.
- Ver também `TOKEN_ENCRYPTION_KEY` acima (seção 2) — já implementado,
  mas trocar essa chave depois de configurada em produção invalida as
  conexões existentes do Google Agenda.

---

## Resumo rápido (se já souber o que está fazendo)

1. Criar Postgres hospedado (Neon/Supabase/Railway), usando a connection
   string **pooled** → copiar `DATABASE_URL`.
2. Gerar novo `AUTH_SECRET` para produção.
3. Adicionar URIs de redirecionamento de produção no Google Cloud Console.
4. Configurar as 10 variáveis de ambiente no painel do host (as 6 de
   sempre + `RESEND_API_KEY`/`NEXT_PUBLIC_APP_URL`/`CRON_SECRET`/
   `TOKEN_ENCRYPTION_KEY`, ver `EMAIL_SETUP.md`).
5. Rodar `npm run db:migrate` apontando para o banco de produção.
6. Deploy (push para o GitHub + importar na Vercel, ou equivalente).
7. Configurar um cron externo (cron-job.org ou similar) chamando
   `/api/cron/weekly-summary` com o `CRON_SECRET` — ver seção 7.
