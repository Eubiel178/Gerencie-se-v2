# Gerencie-se

Escolhi este projeto porque ele representa muito da minha evolução como desenvolvedor. Existem duas versões: a primeira foi feita no começo dos meus estudos e esta segunda começou depois que entrei na Codie Digital.

Na época, a empresa estava começando a trabalhar com injeção de dependências. Eu aproveitei o projeto para praticar esse conceito junto com Clean Architecture, SOLID, Design System e Composition Pattern. Foi um dos projetos em que comecei a pensar não só em fazer funcionar, mas também em como o código seria organizado e mantido depois.

Hoje, olhando novamente para ele, vejo que a componentização é um ponto forte. Os componentes de formulário, por exemplo, já foram pensados para serem reutilizados e compostos em vez de repetidos em cada tela. A separação entre domínio, dados, infraestrutura e interface também foi uma forma de estudar como cada parte da aplicação pode ter uma responsabilidade diferente.

## O que eu melhoraria hoje

Se eu fosse refatorar o projeto hoje, eu não começaria mudando toda a arquitetura. Primeiro, eu melhoraria os fluxos que já existem.

Hoje a aplicação já possui botões para editar e excluir tarefas e eventos, mas essas ações ainda não estão completas na camada de dados. Eu implementaria essas operações de ponta a ponta antes de criar novas funcionalidades.

Isso deixaria o projeto mais coerente: se o usuário vê uma ação na tela, ela realmente funciona e atualiza a lista depois da resposta da API.

Eu também tiparia melhor as respostas da API e criaria testes para os fluxos principais: criar, editar e excluir. Isso evita que um erro de requisição seja tratado como se fosse um dado válido e dá mais segurança para refatorar depois.

Também criaria um padrão de importação para todo o projeto. Por exemplo: primeiro importaria as bibliotecas nativas do React, depois as do Next.js, depois as bibliotecas externas e só então os componentes da aplicação. Isso deixaria os arquivos mais consistentes e fáceis de ler.

Eu também padronizaria a ordem das declarações dentro dos componentes. Primeiro viriam os hooks, como `useTask`; depois os valores derivados, como estilos ou constantes; em seguida as funções de ação; e, por último, o retorno JSX. No componente `Card`, por exemplo, o `useTask` ficaria antes da constante que monta os estilos. Essa organização facilita entender rapidamente de onde vêm os dados e o que o componente faz alem de ser um padrão do react os estados serem declarados no começo do componente.

Também refatoraria o estilo de toda a aplicação, buscando uma maior padronização visual entre as telas e componentes.

Para as listagens, utilizaria `display: grid` de forma mais consistente, permitindo um controle melhor sobre o posicionamento, espaçamento e responsividade dos elementos. Isso facilitaria a manipulação das listas e permitiria que a interface se adaptasse melhor a diferentes tamanhos de tela e trocaria a tag "img" por "Image".

Por fim, eu usaria o cache do Next.js de forma mais intencional. Dados que não mudam a todo momento poderiam ser armazenados em cache para evitar requisições desnecessárias. Quando uma tarefa ou evento fosse criado, editado ou excluído, a aplicação invalidaria apenas os dados relacionados e carregaria a lista atualizada. Dessa forma, o projeto teria uma navegação mais rápida sem mostrar informações desatualizadas.

## Execução local

```bash
npm install

npm run dev
```
