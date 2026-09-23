import styles from "./loading.module.css";

export default function LoginLoading() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>Carregando...</p>
    </div>
  );
}