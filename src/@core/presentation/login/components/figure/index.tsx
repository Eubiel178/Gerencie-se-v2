import styles from "../../../auth-page.module.css";

export function Figure() {
  return (
    <figure className={styles.visual}>
      {/* eslint-disable-next-line @next/next/no-img-element --
          SVG vetorial de ~6KB: não passa pelo otimizador de imagens do
          Next (que só ajuda com raster) e não sofre de LCP/banda. */}
      <img
        className={styles.image}
        src="/images/login.svg"
        alt="Figura de usuário entrando"
        width={870}
        height={520}
      />
    </figure>
  );
}
