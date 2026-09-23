# Divulgação — Gerencie-se

Guia de lançamento pra depois que o deploy já está no ar (hoje:
`gerenciese.vercel.app`). Cobre o checklist técnico final, a decisão do
Google OAuth que muda quem consegue entrar, os princípios de
comportamento usados de forma honesta na divulgação, e o plano de
divulgação em duas fases.

Ver também `docs/DEPLOY.md` (passo a passo técnico do deploy em si) e
`docs/GOOGLE_SETUP.md` (configuração do Google Cloud, incluindo a seção 8
sobre verificação de domínio no Search Console).

---

## 1. Checklist técnico pós-deploy

Antes de divulgar pra qualquer pessoa fora de você:

- [ ] Login por e-mail e senha testado no domínio real (cadastro novo de
      ponta a ponta, não só uma conta já existente)
- [ ] "Continuar com Google" testado no domínio real
- [ ] Conectar o Google Agenda testado no domínio real
- [ ] Migrations aplicadas no Postgres de produção (`npm run db:migrate`
      apontando pro banco de produção)
- [ ] `AUTH_SECRET` e `TOKEN_ENCRYPTION_KEY` de produção são valores
      novos, nunca reaproveitados do `.env` local
- [ ] Resumo semanal agendado num cron externo (`docs/DEPLOY.md`, seção 7)
- [ ] Lembretes push agendados, se configurou VAPID (`docs/DEPLOY.md`,
      seção 7b)
- [ ] E-mail transacional configurado — opcional, sem ele o app funciona
      normal, só não envia e-mail (`docs/EMAIL_SETUP.md`)
- [ ] Domínio verificado no Google Search Console e Branding do Google
      Auth Platform atualizado (`docs/GOOGLE_SETUP.md`, seção 8) — só
      necessário se for publicar o login Google pra qualquer usuário, ver
      decisão abaixo

---

## 2. A decisão que define quem consegue entrar

A tela de consentimento OAuth do Google Cloud tem dois modos, e isso **só
afeta quem consegue usar "Continuar com Google"** — o cadastro por
e-mail e senha já funciona pra qualquer pessoa hoje, nos dois modos.

| Caminho | O que muda | Custo |
|---|---|---|
| **Continuar em modo Teste** (nada a fazer) | Só e-mails cadastrados manualmente na tela de consentimento conseguem logar com Google. Todo o resto usa e-mail/senha normalmente. | Nenhum |
| **Publicar o app no Google** | Abre "Continuar com Google" pra qualquer conta Google. Exige verificação (escopo do Calendar é sensível) e, antes disso, verificar o domínio no Search Console — ver `docs/GOOGLE_SETUP.md` seção 8. | Alguns dias de espera pela revisão do Google |

Dá pra fazer o lançamento fechado (fase 1 abaixo) sem decidir isso agora
— só quem for convidado por e-mail/senha entra sem barreira nenhuma.

**Domínio definitivo ou domínio próprio depois?** Se a ideia é trocar
`gerenciese.vercel.app` por um domínio próprio mais adiante, vale decidir
antes de fazer a verificação de domínio — trocar depois exige repetir a
verificação inteira e atualizar as URIs de redirecionamento no Google
Cloud Console de novo.

---

## 3. Princípios de comportamento (uso ético)

O Gerencie-se já usa gatilho→recompensa (XP, mascote) e sequência
(streaks) pra manter alguém engajado dentro do app. Os mesmos
princípios, usados com honestidade — nunca número inventado, nunca
escassez fabricada — funcionam pra fazer alguém abrir o app pela
primeira vez.

- **Modelo do Gancho** (Nir Eyal) — gatilho → ação → recompensa variável
  → investimento é literalmente o loop que o app já roda (concluir
  tarefa → XP → mascote reage). Mostre esse ciclo inteiro nos primeiros
  segundos de qualquer vídeo — não descreva em texto, deixe a reação
  acontecer na tela.
- **Lacuna de curiosidade** (Loewenstein) — uma pergunta em aberto prende
  atenção mais que uma afirmação fechada. Abra o post/vídeo com uma
  pergunta real ("por que um bicho virtual me fez terminar mais tarefa
  que qualquer lembrete?"), nunca com "conheça o app X".
- **Regra do Pico-Fim** (Kahneman) — a lembrança de uma experiência é
  dominada pelo pico emocional e por como ela termina, não pela média. O
  pico emocional real do produto é a comemoração do mascote — termine o
  vídeo ali, nunca numa tela de configurações.
- **Efeito de posse (endowment)** — quanto mais alguém personaliza algo,
  mais apego cria e mais reluta em abandonar. No convite da fase 1,
  insista pra pessoa nomear/escolher a espécie do mascote antes de sair
  do primeiro uso — prediz retenção melhor que qualquer lembrete.
- **Escassez real** (Cialdini) — acesso limitado aumenta valor percebido,
  mas só funciona quando o limite é verdadeiro. A fase 1 (convite
  fechado de verdade) já é isso.
- **Prova social real** (Cialdini) — confiamos mais numa decisão que
  vemos alguém parecido com a gente já ter tomado. Peça aos beta testers
  da fase 1 um print ou uma frase real de depoimento. Nunca fabrique
  número de usuários ou avaliação.

---

## 4. Plano de divulgação

### Fase 1 — Lançamento fechado

5 a 15 pessoas próximas (amigos, família, colegas) usando por uma a duas
semanas antes de qualquer post público. O objetivo não é audiência — é
achar o que quebra com gente de verdade antes que vire feedback público.

- [ ] Convite enviado ao grupo fechado (pode usar o próprio recurso de
      compartilhamento do app, Configurações → Compartilhamento, ou só
      mandar o link)
- [ ] Cada convidado personaliza o mascote no primeiro uso (nome, espécie)
- [ ] Feedback recolhido, bugs reais corrigidos, 1-2 depoimentos guardados

### Fase 2 — Lançamento público

O diferencial real deste app não é "lista de tarefas" — é o mascote que
reage, o foco com XP e o assistente que puxa contexto do seu dia. É isso
que precisa aparecer nos primeiros 5 segundos de qualquer material.

**Rascunho de pitch** (abre com pergunta, não afirmação):

> "Por que um bichinho virtual me fez terminar mais tarefa do que
> qualquer lembrete?" Gerencie-se: tarefas, hábitos, foco e Google
> Agenda com um mascote que evolui junto com você.

Canais, em ordem de esforço crescente:

- Stories/feed pessoal
- Grupos de produtividade (WhatsApp/Telegram/Discord)
- Instagram/TikTok — vídeo curto do mascote reagindo
- Twitter/X — thread com prints
- Reddit (r/brdev, r/productivity)
- Indie Hackers
- Product Hunt

- [ ] Vídeo curto (15-30s) gravado — roteiro cena a cena abaixo
- [ ] Primeiro post público feito

### Roteiro do vídeo (15-30s)

| Tempo | Cena | Por quê |
|---|---|---|
| 0:00–0:03 | Texto na tela (ou fala): *"Por que um bichinho virtual me fez terminar mais tarefa que qualquer lembrete?"* | Gancho de curiosidade — abre pergunta, não afirmação |
| 0:03–0:08 | Corta pro Dashboard (`/home`), mostra uma tarefa pendente, marca como concluída | Contexto rápido, sem enrolação |
| 0:08–0:14 | XP sobe na hora + mascote reage (estado "celebrating") | O ciclo do Modelo do Gancho: ação → recompensa visível |
| 0:14–0:20 | Corta pro Foco (`/home/focus`), inicia uma sessão curta, cronômetro rodando com o mascote no estado "trabalhando" | Mostra o outro motor de XP do app |
| 0:20–0:26 | Sessão termina → XP maior → mascote na reação mais forte que ele tem | O pico emocional real do produto |
| 0:26–0:30 | Congela nessa cena, texto: "Gerencie-se" + link | Regra do Pico-Fim — termina no auge, não numa tela de configurações |

**Gravar sem instalar nada** (Windows): `Win + G` abre o Xbox Game Bar,
grava a tela com um clique, nativo do Windows 10/11. Pra cortar/legendar
depois, o CapCut (gratuito, é o mais usado hoje pra Reels/TikTok/Shorts,
já tem legenda automática) resolve em poucos minutos.

---

## 5. Depois do primeiro post

Não precisa de analytics sofisticado pra um público pequeno — pedir
feedback direto (um campo simples ou o próprio grupo fechado) rende mais
sinal do que um dashboard de métricas nesta fase. Se quiser números
básicos de visitas mais adiante, o Vercel Analytics é gratuito no plano
atual e liga em um clique no painel do projeto.
