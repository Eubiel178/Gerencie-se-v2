# Configuração de e-mail (Gmail SMTP)

Este guia cobre a configuração necessária para o app conseguir enviar os
e-mails transacionais que envia hoje, todos através do mesmo `sendEmail()`
em `src/lib/email.ts`:

- **Convite de compartilhamento** — ao compartilhar uma tarefa, item de
  rotina, hábito ou objetivo com outra pessoa (`src/features/connections`).
- **Aviso de tentativas de login** — várias senhas erradas seguidas na
  mesma conta (`src/lib/login-attempt-tracker.ts`).
- **Redefinição de senha** — link enviado em "Esqueceu sua senha?" na
  tela de login (`src/lib/password-reset.ts`).
- **Resumo semanal** — ativado em Configurações → Notificações
  (`src/features/weekly-summary`).

Sem essa configuração, o app funciona normalmente — só não envia esses
e-mails. O convite ainda é criado no banco e aparece pra pessoa convidada
assim que ela entrar ou criar conta usando o mesmo e-mail; o aviso de
login some sem consequência (nunca bloqueia a conta); e a redefinição de
senha/resumo semanal simplesmente não chegam.

## Por que Gmail SMTP, e não um provedor tipo Resend/SendGrid

Qualquer provedor de e-mail transacional dedicado exige um **domínio
próprio verificado por DNS** para entregar e-mail pra qualquer
destinatário — sem isso, eles só entregam pro e-mail da própria conta que
criou a chave de API (útil só pra testar sozinho). Comprar um domínio não
é gratuito (~R$40-60/ano). Usar a infraestrutura do Gmail — uma conta
comum + uma "Senha de app" — entrega pra qualquer destinatário sem
precisar de domínio nenhum, porque quem está enviando "de verdade" é o
próprio Google (confiável o bastante pra não cair em spam), não você.

A troca: o remetente aparece como um Gmail comum
(`Gerencie-se <segerenciese@gmail.com>`), não um endereço com marca
própria (`contato@seudominio.com`) — e o limite é de aproximadamente 500
e-mails/dia, bem acima do que um app pessoal usa.

## 1. Ativar verificação em duas etapas

Senha de app só existe depois disso. Em
[myaccount.google.com/security](https://myaccount.google.com/security),
ative "Verificação em duas etapas" na conta que vai enviar os e-mails
(ex.: `segerenciese@gmail.com`).

## 2. Gerar a Senha de app

1. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Digite um nome pra identificar (ex.: "Gerencie-se") e crie.
3. Copie o código de 16 caracteres gerado (aparece só uma vez) — os
   espaços que o Google mostra ao exibir são só visuais, pode colar com
   ou sem eles.

## 3. Variáveis de ambiente

Veja `.env.example` para o modelo completo:

```
GMAIL_USER=segerenciese@gmail.com       # a conta que envia
GMAIL_APP_PASSWORD=...                  # a senha de app gerada no passo 2
NEXT_PUBLIC_APP_URL=http://localhost:3000   # usado para montar o link dentro do e-mail
```

Em produção, troque `NEXT_PUBLIC_APP_URL` pelo domínio real (HTTPS) e
configure `GMAIL_USER`/`GMAIL_APP_PASSWORD` no mecanismo de variáveis de
ambiente do seu provedor de hospedagem — nunca no código. Marque
`GMAIL_APP_PASSWORD` como "Sensitive"/"Secret" no painel (é uma senha de
verdade da conta).

## 4. O que acontece se o limite diário for excedido

O Gmail simplesmente rejeita o envio quando o limite (~500/dia) é
excedido — não existe fila automática que reenvia no dia seguinte.
`sendEmail()` trata esse retorno como qualquer outra falha de envio: o
convite continua existindo no banco (a pessoa consegue aceitar assim que
entrar), só o e-mail de aviso não é entregue. Para o volume esperado
deste app (uso pessoal, poucas conexões) isso não deve ser um problema
na prática.
