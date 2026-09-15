/**
 * Recomendações/tendências de livros — DADOS MOCKADOS, escritos à mão
 * neste arquivo. Não vêm de nenhuma API externa (nenhuma existe integrada
 * ao projeto ainda) e não devem ser apresentados como dado real/dinâmico
 * na interface — sempre com um rótulo deixando claro que é uma lista
 * fixa, não uma tendência ao vivo.
 *
 * Preparado para troca futura: se uma fonte externa real for integrada,
 * basta trocar a implementação desta função por uma chamada HTTP mantendo
 * a mesma assinatura — nenhum componente que a usa precisa mudar.
 */
export interface IBookRecommendation {
  title: string;
  author: string;
  reason: string;
}

const MOCK_RECOMMENDATIONS: IBookRecommendation[] = [
  {
    title: "Hábitos Atômicos",
    author: "James Clear",
    reason: "Direto sobre como pequenas rotinas constroem grandes resultados.",
  },
  {
    title: "Essencialismo",
    author: "Greg McKeown",
    reason: "Ajuda a decidir o que realmente importa fazer.",
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    reason: "Sobre foco profundo — conecta direto com o Foco do app.",
  },
];

export function getMockedReadingRecommendations(): IBookRecommendation[] {
  return MOCK_RECOMMENDATIONS;
}
