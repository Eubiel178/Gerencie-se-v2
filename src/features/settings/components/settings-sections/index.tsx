"use client";

import { useSearchParams } from "next/navigation";

import { Icon, IconName } from "@/components";

import styles from "./styles.module.css";

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
 * O estado de navegação é lido AQUI, num Client Component via
 * `useSearchParams()` - de propósito, nunca como prop vinda de um
 * Server Component que leia `searchParams`. Mesmo assim, TROCAR só o
 * `?section=` via `router.push` reexecutava o `Settings` inteiro no
 * servidor: o router client do Next 16 (segment-cache) trata qualquer
 * mudança só de query num page segment como um refresh (o key interno
 * do segmento inclui a query serializada), re-fazia o request RSC e
 * rodava de novo as ~10 consultas em paralelo de
 * `features/settings/index.tsx` - incluindo, se a agenda estiver
 * conectada, uma chamada de verdade à API do Google Calendar - a cada
 * clique (o achado "quando clico em algo demora pra acontecer, ou
 * quando clico em voltar"). Por isso a troca usa `history.pushState`
 * (integrado ao router do Next, então `useSearchParams`/`usePathname`
 * continuam reativos, inclusive no botão voltar do navegador via
 * popstate): o router não é acionado - só este Client Component
 * re-renderiza com a nova query, sem round-trip pro servidor.
 */
export function SettingsSections({ sections }: SettingsSectionsProps) {
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

  function removeGoogleOAuthResultParams(params: URLSearchParams) {
    params.delete("google_calendar_connected");
    params.delete("google_calendar_error");
    return params;
  }

  function openSection(id: string) {
    const params = removeGoogleOAuthResultParams(new URLSearchParams(searchParams.toString()));
    params.set("section", id);
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  function backToList() {
    const params = removeGoogleOAuthResultParams(new URLSearchParams(searchParams.toString()));
    params.delete("section");
    const query = params.toString();
    window.history.pushState(null, "", query ? `?${query}` : location.pathname);
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
