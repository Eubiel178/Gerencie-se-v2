import Link from "next/link";

const NotFound = () => {
  return (
    <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Página não encontrada
      </h1>
      <p style={{ marginTop: "0.75rem", color: "var(--color-text-muted)" }}>
        O que você procurava não existe ou foi movido.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: "1.5rem",
          padding: "0.6rem 1.2rem",
          borderRadius: "var(--radius-md)",
          background: "var(--color-highlight)",
          color: "var(--color-on-info)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Voltar para o início
      </Link>
    </main>
  );
};

export default NotFound;
