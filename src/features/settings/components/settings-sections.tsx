"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Icon, IconName } from "@/components/icon";

import styles from "./settings-sections.module.css";

export interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: IconName;
  content: React.ReactNode;
}

interface SettingsSectionsProps {
  sections: SettingsSection[];
}

/**
 * Navegação hierárquica de Configurações: uma lista de categorias por
 * padrão, e só o conteúdo de UMA categoria por vez depois de clicar -
 * nunca as configurações todas juntas numa tela só. O estado mora na URL
 * (`?section=id`), não em `useState`: assim o botão "voltar" do
 * navegador funciona pra sair de uma categoria (volta pra lista), e a
 * URL de uma categoria específica é compartilhável/atualizável sem
 * perder o lugar. Cada categoria já vem com o conteúdo TODO renderizado
 * (Server Component, buscado de uma vez só em `Settings`) - aqui só
 * decide qual mostrar, nunca busca dado de novo.
 *
 * Todo o estado de navegação (`?section=`, e o caso especial do retorno
 * do OAuth do Google Agenda) é lido AQUI, num Client Component via
 * `useSearchParams()` - de propósito, nunca como prop vinda de um
 * Server Component que leia `searchParams`. Um Server Component que
 * declara `searchParams` faz o Next.js tratar a rota inteira como
 * dependente da query string: TROCAR só o `?section=` (clicar numa
 * categoria, ou "Voltar") reexecutava o `Settings` inteiro no servidor -
 * as ~10 consultas em paralelo em `features/settings/index.tsx`
 * (incluindo, se a agenda estiver conectada, uma chamada de verdade à
 * API do Google Calendar) rodavam de novo a cada clique, mesmo a troca
 * de categoria sendo, na intenção original, 100% do lado do cliente
 * (achado relatado: "quando clico em algo demora pra acontecer, ou
 * quando clico em voltar"). Sem nenhum componente no caminho lendo
 * `searchParams` do lado do servidor, o Next.js não tem motivo pra
 * invalidar o cache da rota só porque a query string mudou - clicar
 * numa categoria vira troca de estado puramente no cliente.
 */
export function SettingsSections({ sections }: SettingsSectionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retorno do OAuth do Google Agenda: chega com
  // `?google_calendar_connected=...`/`?google_calendar_error=...` mas
  // sem `?section=` - sem isto, o usuário voltaria pra lista de
  // categorias em vez de ver direto o resultado da conexão que acabou
  // de tentar. Lido aqui (não em `Settings`) pelo mesmo motivo do
  // comentário acima.
  const cameFromGoogleCalendarRedirect =
    searchParams.get("google_calendar_connected") !== null || searchParams.get("google_calendar_error") !== null;
  const requestedId = searchParams.get("section") ?? (cameFromGoogleCalendarRedirect ? "integracoes" : null);
  const active = sections.find((section) => section.id === requestedId) ?? null;

  function openSection(id: string) {
    router.push(`/home/settings?section=${id}`, { scroll: false });
  }

  function backToList() {
    router.push("/home/settings", { scroll: false });
  }

  if (!active) {
    return (
      <ul className={styles.categoryList}>
        {sections.map((section) => (
          <li key={section.id}>
            <button type="button" className={styles.categoryItem} onClick={() => openSection(section.id)}>
              <span className={styles.categoryIcon} aria-hidden="true">
                <Icon name={section.icon} />
              </span>
              <span className={styles.categoryText}>
                <span className={styles.categoryLabel}>{section.label}</span>
                <span className={styles.categoryDescription}>{section.description}</span>
              </span>
              <Icon name="FaChevronRight" aria-hidden="true" className={styles.categoryChevron} />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <button type="button" className={styles.backButton} onClick={backToList}>
        <Icon name="FaChevronLeft" aria-hidden="true" />
        Voltar
      </button>

      <h2 className={styles.sectionTitle}>{active.label}</h2>

      <div className={styles.sectionContent}>{active.content}</div>
    </div>
  );
}
