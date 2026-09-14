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
  /** Categoria pra abrir direto (sem passar pela lista) quando não há
   * `?section=` na URL — usado só pelo retorno do OAuth do Google Agenda
   * (`?google_calendar_connected=...`/`?google_calendar_error=...`), que
   * sempre é sobre a categoria "Integrações". Sem isso, o usuário
   * voltaria do Google pra lista de categorias em vez de ver o resultado
   * da conexão que acabou de tentar. */
  defaultSectionId?: string;
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
 */
export function SettingsSections({ sections, defaultSectionId }: SettingsSectionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("section") ?? defaultSectionId ?? null;
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
