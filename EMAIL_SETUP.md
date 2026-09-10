# Configuração de e-mail (Resend) — convites de compartilhamento

Este guia cobre a configuração necessária no [Resend](https://resend.com)
para o app conseguir enviar o e-mail de convite quando você compartilha
uma tarefa, item de rotina, hábito ou objetivo com outra pessoa (ver
`src/lib/email.ts` e `src/features/connections`).

Sem essa configuração, o app funciona normalmente — só não envia o
e-mail. O vínculo (convite) ainda é criado no banco e aparece pra pessoa
convidada assim que ela entrar ou criar conta usando o mesmo e-mail que
você convidou.

## 1. Criar a conta

1. Acesse [resend.com](https://resend.com) e crie uma conta gratuita
   (não pede cartão de crédito).
2. O plano grátis inclui **3.000 e-mails/mês** e **100 e-mails/dia** —
   folga enorme pra convites entre poucas pessoas (uso pessoal/casal).

## 2. Gerar a chave de API

1. No painel do Resend, vá em **API Keys → Create API Key**.
2. Dê um nome (ex.: "Gerencie-se") e permissão de **Sending access**.
3. Copie a chave gerada (só é exibida uma vez) e cole em `RESEND_API_KEY`
   no seu `.env`.

## 3. Remetente do e-mail

Por padrão, o app envia pelo domínio de teste do próprio Resend
(`onboarding@resend.dev`, ver `FROM_ADDRESS` em `src/lib/email.ts`). Esse
domínio **só entrega para o e-mail da conta que criou a chave de API** —
suficiente para testar sozinho, mas não para convidar outra pessoa de
verdade.

Para enviar convites para qualquer e-mail (uso real):

1. Vá em **Domains → Add Domain** no painel do Resend e siga o passo a
   passo (adicionar alguns registros DNS no seu domínio).
2. Depois de verificado, troque `FROM_ADDRESS` em `src/lib/email.ts` para
   um endereço desse domínio (ex.: `"Gerencie-se <convites@seudominio.com>"`).

Se você não tiver um domínio próprio, pode deixar como está: o convite
ainda é criado normalmente, só o e-mail não chega — a pessoa convidada
consegue aceitar o vínculo assim que criar conta com o e-mail convidado,
mesmo sem ter recebido nada.

## 4. Variáveis de ambiente

Veja `.env.example` para o modelo completo:

```
RESEND_API_KEY=...              # chave gerada no passo 2
NEXT_PUBLIC_APP_URL=http://localhost:3000   # usado para montar o link dentro do e-mail
```

Em produção, troque `NEXT_PUBLIC_APP_URL` pelo domínio real (HTTPS) e
configure `RESEND_API_KEY` no mecanismo de variáveis de ambiente do seu
provedor de hospedagem — nunca no código.

## 5. O que acontece além do limite diário/mensal

O Resend simplesmente rejeita o envio quando o limite é excedido — não
existe fila automática que reenvia no dia seguinte. `sendEmail()` trata
esse retorno como qualquer outra falha de envio: o convite continua
existindo no banco (a pessoa consegue aceitar assim que entrar), só o
e-mail de aviso não é entregue. Para o volume esperado deste app (uso
pessoal, algumas conexões) isso não deve ser um problema na prática.
