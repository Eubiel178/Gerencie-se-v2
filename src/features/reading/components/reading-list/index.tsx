"use client";

import { useState } from "react";

import { EmptyState, Input } from "@/components";
import { Icon } from "@/components/icon";
import { IReadingItem, ReadingStatus } from "@/features/reading/domain";
import { filterReadingItems } from "@/features/reading/filter-reading-items";

import styles from "../shared/styles.module.css";

import { AddForm } from "./add-form";
import { Item } from "./item";


type ReadingTab = ReadingStatus | "all";

const STATUS_TABS: Array<{ label: string; value: ReadingTab }> = [
  { label: "Todos", value: "all" },
  { label: "Lendo", value: "reading" },
  { label: "Quero ler", value: "want_to_read" },
  { label: "Concluído", value: "finished" },
];

interface ReadingListProps {
  items: IReadingItem[];
}

export function ReadingList({ items }: ReadingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReadingTab>("all");
  const [openedItemId, setOpenedItemId] = useState<string | null>(null);
  const [readingItems, setReadingItems] = useState(items);

  // Ressincroniza sempre que o server manda uma lista nova (revalidação,
  // livro compartilhado atualizado por outra pessoa etc.) — sem isso, a
  // tela só refletia a lista original recebida no primeiro render.
  const [previousItems, setPreviousItems] = useState(items);
  if (items !== previousItems) {
    setPreviousItems(items);
    setReadingItems(items);
  }

  const filteredItems = filterReadingItems(readingItems, {
    searchQuery,
    statusFilter,
  });

  function closeSearch() {
    setSearchQuery("");
  }

  return (
    <div className={styles.library}>
      <div className={styles.libraryHeader}>
        <div>
          <h2>
            Estante <span>— visão geral</span>
          </h2>
        </div>

        <div className={styles.libraryActions}>
          {!isAdding && (
            <button
              type="button"
              className={styles.addBookButton}
              aria-expanded={isAdding}
              onClick={() => setIsAdding(!isAdding)}
            >
              <Icon name="FiPlus" aria-hidden="true" />
              Adicionar livro
            </button>
          )}
        </div>
      </div>

      <div className={styles.searchRow} id="reading-library-search">
        <Input.Root>
          <Input.Wrapper>
            <Input.Field
              autoFocus
              type="search"
              placeholder="Buscar por título ou autor..."
              aria-label="Buscar na lista de leitura"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>
        <button
          type="button"
          className={styles.closeSearchButton}
          onClick={closeSearch}
        >
          Limpar
        </button>
      </div>

      {isAdding && (
        <AddForm
          onCreated={(item) => {
            setReadingItems((current) => [item, ...current]);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {readingItems.length === 0 ? (
        <EmptyState>
          Escolha o próximo livro que você quer acompanhar. O título já basta
          para começar.
        </EmptyState>
      ) : (
        <section className={styles.shelfPanel} aria-label="Livros da sua estante">
          <div className={styles.statusTabs} role="tablist" aria-label="Status dos livros">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                className={
                  statusFilter === tab.value
                    ? styles.statusTabActive
                    : styles.statusTab
                }
                onClick={() => {
                  setStatusFilter(tab.value);
                  setOpenedItemId(null);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              variant="box"
              action={searchQuery ? { label: "Limpar busca", onClick: closeSearch } : undefined}
            >
              Nenhum livro aparece nesta aba com a busca atual.
            </EmptyState>
          ) : (
            <ul className={styles.list}>
              {filteredItems.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  onUpdated={(updatedItem) =>
                    setReadingItems((current) =>
                      current.map((currentItem) =>
                        currentItem.id === updatedItem.id ? updatedItem : currentItem,
                      ),
                    )
                  }
                  onDeleted={(id) =>
                    setReadingItems((current) =>
                      current.filter((currentItem) => currentItem.id !== id),
                    )
                  }
                  openDetails={openedItemId === item.id}
                  onDetailsChange={(isOpen) =>
                    setOpenedItemId((currentOpenedId) =>
                      isOpen
                        ? item.id
                        : currentOpenedId === item.id
                          ? null
                          : currentOpenedId,
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
