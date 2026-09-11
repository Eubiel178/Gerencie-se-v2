import Link from "next/link";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiClock,
  FiHeart,
  FiTarget,
  FiZap,
} from "@/components/icon";
import { ThemeToggle } from "@/design-system/theme/theme-toggle";
import styles from "./landing-page.module.css";

const highlights = [
  {
    icon: FiCheck,
    title: "Prioridades claras",
    text: "Veja o que realmente merece sua atenção hoje.",
  },
  {
    icon: FiClock,
    title: "Foco com intenção",
    text: "Transforme tempo protegido em progresso real.",
  },
  {
    icon: FiHeart,
    title: "Ritmo sustentável",
    text: "Hábitos e bem-estar sem sobrecarregar sua rotina.",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link
          className={styles.brand}
          href="/"
          aria-label="Gerencie-se, página inicial"
        >
          <span className={styles.brandMark}>
            <FiZap aria-hidden="true" />
          </span>
          Gerencie-se
        </Link>
        <nav className={styles.navigation} aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
        </nav>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link className={styles.loginLink} href="/login">
            Entrar
          </Link>
        </div>
      </header>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span /> Seu dia, no seu ritmo
          </p>
          <h1>
            Faça espaço para o que <em>importa.</em>
          </h1>
          <p className={styles.intro}>
            Organize tarefas, construa hábitos e encontre foco sem transformar a
            sua rotina em mais uma cobrança.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/register">
              Começar agora <FiArrowRight aria-hidden="true" />
            </Link>
            <a className={styles.secondaryAction} href="#como-funciona">
              Conhecer a plataforma
            </a>
          </div>
          <p className={styles.note}>
            Planejamento simples. Progresso que você consegue sentir.
          </p>
        </div>
        <div
          className={styles.dashboardPreview}
          aria-label="Prévia do painel de produtividade"
        >
          <div className={styles.previewTopbar}>
            <div>
              <p>quarta-feira</p>
              <strong>Bom dia, você.</strong>
            </div>
            <span className={styles.avatar}>G</span>
          </div>
          <div className={styles.previewGrid}>
            <article className={`${styles.previewCard} ${styles.progressCard}`}>
              <div className={styles.cardTitle}>
                <span>Seu foco hoje</span>
                <FiTarget aria-hidden="true" />
              </div>
              <div className={styles.progressValue}>
                72<small>%</small>
              </div>
              <div className={styles.progressTrack}>
                <span />
              </div>
              <p>3 de 4 prioridades concluídas</p>
            </article>
            <article className={`${styles.previewCard} ${styles.focusCard}`}>
              <div className={styles.cardTitle}>
                <span>Em foco</span>
                <FiClock aria-hidden="true" />
              </div>
              <strong>24:18</strong>
              <p>Projeto pessoal</p>
              <button type="button" aria-label="Pausar sessão de foco">
                Ⅱ
              </button>
            </article>
          </div>
          <article className={`${styles.previewCard} ${styles.taskCard}`}>
            <div className={styles.cardTitle}>
              <span>Próximas ações</span>
              <a href="#recursos">Ver tudo</a>
            </div>
            <div className={styles.task}>
              <span className={styles.done}>
                <FiCheck aria-hidden="true" />
              </span>
              <span>Planejar a semana</span>
              <small>09:30</small>
            </div>
            <div className={styles.task}>
              <span className={styles.circle} />
              <span>Estudar inglês</span>
              <small>11:00</small>
            </div>
            <div className={styles.task}>
              <span className={styles.circle} />
              <span>Caminhada leve</span>
              <small>18:00</small>
            </div>
          </article>
          <div className={styles.previewCaption}>
            <span className={styles.pulse} /> Uma visão calma do seu dia
          </div>
        </div>
      </section>
      <section className={styles.proof} aria-label="Benefícios do Gerencie-se">
        <p>Menos pressão, mais direção.</p>
        <div>
          <span>Planeje</span>
          <i /> <span>Foque</span>
          <i /> <span>Evolua</span>
        </div>
      </section>
      <section className={styles.features} id="recursos">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>
            <span /> Feito para a vida real
          </p>
          <h2>Produtividade não precisa ser complicada.</h2>
        </div>
        <div className={styles.featureGrid}>
          {highlights.map(({ icon: Icon, title, text }) => (
            <article className={styles.feature} key={title}>
              <span className={styles.featureIcon}>
                <Icon aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.steps} id="como-funciona">
        <div className={styles.stepsCopy}>
          <p className={styles.eyebrow}>
            <span /> Uma rotina possível
          </p>
          <h2>Comece pequeno. Continue com leveza.</h2>
          <p>
            O Gerencie-se transforma objetivos distantes em próximos passos que
            cabem no seu dia.
          </p>
          <Link className={styles.textLink} href="/register">
            Criar minha conta <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <ol className={styles.stepList}>
          <li>
            <span>01</span>
            <div>
              <h3>Defina seu norte</h3>
              <p>Escolha uma prioridade que vai guiar sua semana.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Proteja seu tempo</h3>
              <p>Organize tarefas e reserve momentos de foco.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Reconheça seu progresso</h3>
              <p>Acompanhe consistência, não apenas listas concluídas.</p>
            </div>
          </li>
        </ol>
      </section>
      <section className={styles.cta}>
        <FiBarChart2 className={styles.ctaIcon} aria-hidden="true" />
        <p className={styles.eyebrow}>
          <span /> Seu próximo capítulo
        </p>
        <h2>Um dia mais intencional começa agora.</h2>
        <Link className={styles.primaryAction} href="/register">
          Criar conta grátis <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Gerencie-se</span>
        <span>Feito para dias que fazem sentido.</span>
      </footer>
    </main>
  );
}
