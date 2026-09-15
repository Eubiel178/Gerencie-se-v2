# Configuração do Google Cloud (Login + Google Agenda)

Este guia cobre a configuração necessária no Google Cloud Console para o
login com Google e, separadamente, a futura integração com o Google
Agenda. As informações abaixo foram conferidas na documentação oficial do
Google em setembro de 2026 (links ao final).

## 1. Criar o projeto

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/) e
   crie um projeto novo (ou use um existente).

## 2. Tela de consentimento OAuth

1. No menu, vá em **APIs e serviços → Tela de consentimento OAuth**.
2. Tipo de usuário: **Externo** (a menos que você tenha um Google Workspace
   e queira restringir ao seu domínio).
3. Preencha nome do app, e-mail de suporte e e-mail de contato do
   desenvolvedor.
4. Enquanto o app estiver em **Teste** (modo padrão), só usuários
   adicionados manualmente à lista de "usuários de teste" conseguem fazer
   login — é o suficiente para desenvolvimento e uso pessoal. Adicione seu
   próprio e-mail Google nessa lista.
5. **Publicar para produção** (fora do modo de teste) com o escopo do
   Google Agenda exige processo de verificação do Google, porque
   `calendar.events` é classificado como **escopo sensível**. Para uso
   pessoal/local, **não é necessário publicar** — manter em modo de teste é
   suficiente e evita esse processo.

## 3. Criar as credenciais OAuth

1. Vá em **APIs e serviços → Credenciais → Criar credenciais → ID do
   cliente OAuth**.
2. Tipo de aplicativo: **Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adicione:
   - Para o login (Auth.js): `http://localhost:3000/api/auth/callback/google`
   - Para o Google Agenda (fluxo próprio, separado do login):
     `http://localhost:3000/api/google-calendar/callback`
   - Em produção, repita os dois com o domínio real (`https://seu-dominio.com/...`).
4. Ao salvar, o Google mostra o **Client ID** e o **Client Secret**. Esses
   dois valores preenchem `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` no `.env`
   (você pode reutilizar o mesmo par para `GOOGLE_CALENDAR_CLIENT_ID` /
   `GOOGLE_CALENDAR_CLIENT_SECRET`, desde que a Calendar API esteja
   habilitada no mesmo projeto — não é obrigatório ser um client OAuth
   separado, mas também não há problema em criar um segundo se preferir
   isolar melhor o escopo de cada fluxo).

## 4. Habilitar a API do Google Agenda

1. Vá em **APIs e serviços → Biblioteca**, busque **Google Calendar API** e
   clique em **Ativar**.
2. Isso só é necessário para a integração do Google Agenda — o login com
   Google não depende dela.

## 5. Escopos usados por este projeto

O login e a integração de agenda usam **conjuntos de escopo
completamente separados**, de propósito — ver `src/lib/auth.config.ts`
(login) e a futura implementação em `src/lib/google-calendar.ts`
(Agenda):

| Uso | Escopo | Por quê |
|---|---|---|
| Login (Auth.js) | `openid email profile` | Identifica o usuário (nome, e-mail, id único do Google). Nunca inclui acesso à Agenda. |
| Google Agenda — eventos | `https://www.googleapis.com/auth/calendar.events` | Criar/ler/editar/excluir eventos individuais. Não dá acesso a configurações ou compartilhamento do calendário. |
| Google Agenda — listar calendários | `https://www.googleapis.com/auth/calendar.calendarlist.readonly` | Só para preencher o seletor de qual calendário sincronizar nas Configurações — somente leitura. |

Confirmado na documentação oficial (setembro de 2026): não existe um
escopo "só para criar eventos, sem listar calendários" — por isso são
necessários os dois escopos acima para a experiência completa (escolher o
calendário + sincronizar tarefas nele). Ainda assim, o conjunto é bem mais
restrito do que o escopo genérico `.../auth/calendar`, que também libera
mudanças nas configurações e no compartilhamento do calendário — algo que
esta integração não precisa e por isso não pede.

## 6. Variáveis de ambiente

Veja `.env.example` para o modelo completo. Resumo:

```
AUTH_SECRET=...                        # gerado localmente, único por ambiente
AUTH_GOOGLE_ID=...                     # Client ID do passo 3
AUTH_GOOGLE_SECRET=...                 # Client Secret do passo 3
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

Nunca comite o `.env` real — ele já está no `.gitignore`. Em produção, use
o mecanismo de variáveis de ambiente do seu provedor de hospedagem (nunca
coloque essas credenciais em código).

## 7. Diferença dev vs. produção

- **Dev (localhost)**: URIs de redirecionamento com `http://localhost:3000/...`,
  app em modo de Teste na tela de consentimento.
- **Produção**: troque os URIs de redirecionamento para o domínio real
  (HTTPS obrigatório), gere um `AUTH_SECRET` novo e próprio do ambiente de
  produção, e avalie se publicar o app (sair do modo de Teste) — o que, com
  o escopo sensível do Calendar, passa pelo processo de verificação do
  Google.

## 8. Verificação de propriedade do domínio (obrigatória pra publicar o app)

Ao clicar em "Publicar app" (sair do modo Teste) ou pedir a verificação de
marca no **Google Auth Platform → Branding**, o Google recusa com uma
mensagem do tipo:

> O site do URL da sua página inicial `https://SEU-DOMINIO` não está
> registrado para você.

Isso não é sobre o conteúdo do app — é sobre provar, no **Google Search
Console**, que o domínio configurado como página inicial é seu.

**Se o domínio for um subdomínio `*.vercel.app`**: a verificação por DNS
(TXT record) **não é uma opção viável** — quem controla o DNS de
`vercel.app` é a própria Vercel, não o dono do projeto. O Search Console
precisa oferecer um método alternativo: **"tag HTML"** (um `<meta
name="google-site-verification">` no `<head>`) ou **"arquivo HTML"** (um
arquivo estático servido na raiz do domínio). Ambos já têm suporte pronto
neste projeto:

- **Tag HTML** (recomendado — mais simples): copie só o valor do atributo
  `content` que o Search Console mostrar e cole na variável de ambiente
  `GOOGLE_SITE_VERIFICATION` (ver `.env.example`). A tag é renderizada
  automaticamente em `src/app/layout.tsx` — sem essa variável, ela
  simplesmente não aparece.
- **Arquivo HTML**: se o Search Console oferecer só esse método, baixe o
  arquivo (`googleXXXXXXXXXXXXXXXX.html`) e coloque em `public/` — a
  Vercel serve qualquer arquivo dessa pasta na raiz do domínio sem
  configuração extra.

Depois de verificado no Search Console, volte em **Google Auth Platform →
Branding** e confira que **Página inicial**, **Política de privacidade**
e **Domínio autorizado** apontam todos para o mesmo domínio verificado, e
peça a nova verificação.

**Requisitos que o Google confere na página inicial** (já cobertos pela
landing page deste projeto, `src/app/page.tsx`):

- pública, sem exigir login — ✅ (`/` é a landing page, o login fica em `/login`);
- explica o que o app é e o que faz — ✅ (seção hero + "Como funciona" + "Recursos");
- link visível para a Política de Privacidade — ✅ no rodapé (`/privacy-policy`, `/terms-of-service`).

**Domínio definitivo ou domínio próprio depois?** Se a ideia é trocar
`gerenciese.vercel.app` por um domínio próprio mais adiante, vale decidir
isso *antes* de fazer a verificação — trocar de domínio depois exige
repetir toda a verificação (Search Console + Branding) e atualizar as
URIs de redirecionamento no passo 3 deste guia outra vez.

## Fontes consultadas (setembro de 2026)

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/protocols/oauth2/scopes
- https://developers.google.com/workspace/calendar/api/v3/reference/calendarList/list
- https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
