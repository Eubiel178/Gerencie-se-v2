import Link from "next/link";
import { Icon } from "@/components/icon";
import { ThemeToggle } from "@/design-system/theme/theme-toggle";
import { MascotSwarm } from "@/features/mascot-pet/components/mascot-swarm/lazy";
import styles from "./landing-page.module.css";

const highlights = [
  {
    icon: "FiCheck",
    title: "Prioridades claras",
    text: "Veja o que realmente merece sua atenção hoje.",
  },
  {
    icon: "FiClock",
    title: "Foco com intenção",
    text: "Um bloco de tempo só pra uma coisa, sem trocar de aba a cada dois minutos.",
  },
  {
    icon: "FiHeart",
    title: "Hábitos sem culpa",
    text: "Constrói aos poucos, e um dia perdido não zera o esforço todo.",
  },
] as const;

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
            <Icon name="FiZap" aria-hidden="true" />
          </span>
          Gerencie-se
        </Link>
        <nav className={styles.navigation} aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
        </nav>
        <div className={styles.headerActions}>
          <ThemeToggle compact />
          <Link className={styles.loginLink} href="/login">
            Entrar
          </Link>
          <Link className={styles.headerCta} href="/register">
            Começar grátis
          </Link>
        </div>
      </header>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span /> Clareza para o seu próximo passo
          </p>
          <h1>
            Pare de carregar tudo na <em>cabeça.</em>
          </h1>
          <p className={styles.intro}>
            O Gerencie-se reúne suas tarefas, hábitos e blocos de foco em um lugar
            simples para você saber o que fazer agora — sem virar refém de listas.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/register">
              Começar grátis <Icon name="FiArrowRight" aria-hidden="true" />
            </Link>
            <a className={styles.secondaryAction} href="#como-funciona">
              Conhecer a plataforma
            </a>
          </div>
          <p className={styles.note}>
            Gratuito para começar. Sem cartão de crédito.
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
                <Icon name="FiTarget" aria-hidden="true" />
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
                <Icon name="FiClock" aria-hidden="true" />
              </div>
              <strong>24:18</strong>
              <p>Projeto pessoal</p>
              <span className={styles.previewControl} aria-hidden="true">
                Ⅱ
              </span>
            </article>
          </div>
          <article className={`${styles.previewCard} ${styles.taskCard}`}>
            <div className={styles.cardTitle}>
              <span>Próximas ações</span>
              <a href="#recursos">Ver tudo</a>
            </div>
            <div className={styles.task}>
              <span className={styles.done}>
                <Icon name="FiCheck" aria-hidden="true" />
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
        <p>Quando o seu dia pede direção, não mais uma ferramenta complicada.</p>
        <div>
          <span>Planeje</span>
          <i /> <span>Foque</span>
          <i /> <span>Evolua</span>
        </div>
      </section>
      <section className={styles.features} id="recursos">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>
            <span /> Menos atrito, mais avanço
          </p>
          <h2>Um sistema que trabalha com a sua rotina.</h2>
        </div>
        <div className={styles.featureGrid}>
          {highlights.map(({ icon, title, text }) => (
            <article className={styles.feature} key={title}>
              <span className={styles.featureIcon}>
                <Icon name={icon} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.mascots} aria-label="Mascotes do Gerencie-se">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Você não está sozinho nessa</p>
          <h2>Escolha um companheiro.</h2>
          <p className={styles.mascotsIntroText}>
            Ele anda pela tela, comemora quando você termina algo, e também
            aceita um cafuné de vez em quando. Passe o mouse ou toque em cada um
            pra conhecer.
          </p>
        </div>

        <MascotSwarm />
      </section>

      <section className={styles.steps} id="como-funciona">
        <div className={styles.stepsCopy}>
          <p className={styles.eyebrow}>Uma rotina possível</p>
          <h2>Comece em poucos passos. Use no seu ritmo.</h2>
          <p>
            Você não precisa organizar a vida inteira hoje. Comece pelo que importa
            agora e deixe o sistema acompanhar o restante.
          </p>
          <Link className={styles.textLink} href="/register">
            Criar conta grátis <Icon name="FiArrowRight" aria-hidden="true" />
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
        <Icon
          name="FiBarChart2"
          className={styles.ctaIcon}
          aria-hidden="true"
        />
        <p className={styles.eyebrow}>Seu próximo capítulo</p>
        <h2>Seu próximo passo claro começa agora.</h2>
        <Link className={styles.primaryAction} href="/register">
          Começar grátis <Icon name="FiArrowRight" aria-hidden="true" />
        </Link>
      </section>
      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} Gerencie-se — Feito para dias que fazem
          sentido.
        </span>
        <nav className={styles.footerLinks} aria-label="Legal">
          <Link href="/privacy-policy">Política de Privacidade</Link>
          <Link href="/terms-of-service">Termos de Uso</Link>
        </nav>
      </footer>
    </main>
  );
}
