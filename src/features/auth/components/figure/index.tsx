import styles from "../../auth-page.module.css";

/** Ilustração decorativa compartilhada por toda tela de autenticação
 * (login, cadastro, recuperar senha) — era duplicada byte a byte em
 * `login`/`register` antes de existir aqui. */
export function Figure() {
  return (
    <figure className={styles.visual}>
      {/* eslint-disable-next-line @next/next/no-img-element --
          SVG vetorial de ~2KB: não passa pelo otimizador de imagens do
          Next (que só ajuda com raster) e não sofre de LCP/banda. */}
      <img
        className={styles.image}
        src="/images/auth-visual.svg"
        alt=""
        width={520}
        height={480}
      />
    </figure>
  );
}
