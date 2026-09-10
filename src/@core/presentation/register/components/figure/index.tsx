import Image from "next/image";
import styles from "../../../auth-page.module.css";

export function Figure() {
  return (
    <figure className={styles.visual}>
      <Image
        className={styles.image}
        src="/images/register.png"
        alt="Figura de usuário se cadastrando"
        width={2000}
        height={2000}
        priority
      />
    </figure>
  );
}
