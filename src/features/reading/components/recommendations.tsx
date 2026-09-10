import { getMockedReadingRecommendations } from "@/features/reading/recommendations";

import styles from "../reading.module.css";

export function Recommendations() {
  const recommendations = getMockedReadingRecommendations();

  return (
    <div className={styles.recommendations}>
      <h2 className={styles.recommendationsTitle}>Sugestões</h2>
      <p className={styles.mockTag}>
        Lista fixa selecionada pela equipe — ainda não vem de nenhuma fonte externa.
      </p>

      {recommendations.map((book) => (
        <div key={book.title} className={styles.recCard}>
          <p className={styles.recTitle}>
            {book.title} — {book.author}
          </p>
          <p className={styles.recReason}>{book.reason}</p>
        </div>
      ))}
    </div>
  );
}
