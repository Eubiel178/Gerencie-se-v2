import Link from "next/link";

import styles from "./legal-document.module.css";

interface LegalDocumentProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

/**
 * Layout compartilhado pelas páginas públicas de Política de Privacidade
 * e Termos de Serviço — exigidas pela tela de consentimento OAuth do
 * Google (ver docs/GOOGLE_SETUP.md). Página estática, sem autenticação,
 * pensada pra ser linkável de qualquer lugar (inclusive fora do app).
 */
export function LegalDocument({ title, updatedAt, children }: LegalDocumentProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Gerencie-se
        </Link>
        <Link href="/login" className={styles.backLink}>
          Voltar para o login
        </Link>
      </header>

      <article className={styles.article}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updatedAt}>Última atualização: {updatedAt}</p>

        <div className={styles.prose}>{children}</div>
      </article>
    </div>
  );
}
