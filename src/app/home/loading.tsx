import styles from "./state-message.module.css";

export default function HomeLoading() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>Carregando...</p>
    </div>
  );
}
