# Arquitetura do Gerencie-se

Este documento descreve a organização atual do produto. Ele é um mapa de
manutenção, não uma especificação de funcionalidades futuras.

## Visão geral

O Gerencie-se é uma aplicação pessoal de organização e bem-estar. A área
autenticada está sob `/home`; autenticação, recuperação de acesso e a landing
page ficam fora dela.

As áreas de produto são: painel, tarefas, rotina, hábitos, objetivos, foco,
calendário, leitura, corrida, hidratação, saúde, ciclo menstrual,
estatísticas e configurações. O ciclo só aparece na navegação para perfis que
o habilitaram nas configurações.

## Stack

- Next.js (App Router) e React com TypeScript estrito.
- PostgreSQL acessado com Drizzle ORM.
- Auth.js para sessão e provedores de autenticação.
- React Hook Form e Zod para formulários e validação.
- Zustand para estados compartilhados de interface que precisam sobreviver a
  interações dentro da página.
- CSS Modules e tokens CSS em `src/design-system/tokens`; Tailwind não é
  utilizado.

## Organização do código

```
src/app/                 rotas, layouts, endpoints HTTP e estados de rota
src/features/<domínio>/  UI e regras de cada área do produto
src/components/          componentes reutilizáveis de interface
src/design-system/       tokens, tema e regras globais de movimento
src/lib/                 infraestrutura compartilhada (auth, banco, serviços)
src/validation/          schemas de entrada compartilhados
src/hooks/               hooks genéricos de cliente
```

Em um domínio maior, o fluxo esperado é:

```
Página/Componente → Server Action ou endpoint → repositório → Drizzle/PostgreSQL
```

As Server Actions devem validar entradas no servidor, obter o usuário atual e
limitar leituras/escritas ao respectivo proprietário antes de alterar dados.

## Dados e atualização da interface

As páginas de dados são renderizadas no servidor quando possível. Ações de
criar, editar e remover persistem no servidor e invalidam a rota afetada.
Tarefas e eventos também possuem stores de cliente para manter a interface
responsiva durante interações locais. Não crie uma store global por padrão:
use estado local quando os dados não forem compartilhados.

## Design e responsividade

Os tokens de cor, espaço, tipografia, raio, elevação e movimento são a fonte
de verdade visual. Componentes novos não devem adicionar cores soltas.

A navegação principal é uma sidebar em telas amplas e um painel de menu em
até 720px. O painel mantém todas as rotas acessíveis sem depender de hover.
Modais devem continuar utilizáveis em mobile; o componente base já os adapta
para uma apresentação de bottom sheet em telas pequenas.

Animações precisam ter objetivo de feedback ou orientação e respeitar
`prefers-reduced-motion` por meio de `src/design-system/tokens/motion.css`.

## Integrações e limites de segurança

- Google: login e conexão opcional ao Calendar.
- Resend: e-mails transacionais, quando configurado.
- Edge TTS: fala opcional do mascote, limitada a 280 caracteres no endpoint.
- Uploads: endpoints específicos de anexos, com validação de tipo e tamanho.

Segredos pertencem exclusivamente às variáveis de ambiente. Nunca exponha
chaves de integração em componentes de cliente. Antes de adicionar um endpoint
ou Action, valide dados, autenticação e autorização no servidor.

## Qualidade local

```bash
npm run lint
npm test
npm run build
```

Os testes atuais priorizam regras de domínio, cálculo de métricas, filtros,
exportação e validações puras. Ao corrigir um bug de regra de negócio, acrescente
um teste de unidade reproduzindo o caso antes ou junto da correção.

## Decisões vigentes

- Não usar Tailwind em código novo.
- Preferir CSS Modules e tokens existentes a uma segunda estratégia de estilos.
- Manter PixiJS, quando usado pelo mascote, isolado da interface React comum.
- Não aplicar migrações destrutivas sem inventário de dependências e estratégia
  de reversão ou compatibilidade.
