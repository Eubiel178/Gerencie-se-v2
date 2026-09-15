"use client";

import { useState } from "react";

import { EmptyState, Input } from "@/components";
import { IReadingItem, ReadingStatus } from "@/features/reading/domain";
import { filterReadingItems } from "@/features/reading/filter-reading-items";
import { AddForm } from "./add-form";
import { Item } from "./item";

import styles from "../../reading.module.css";

const STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Quero ler", value: "want_to_read" },
  { label: "Lendo", value: "reading" },
  { label: "Concluído", value: "finished" },
];

interface ReadingListProps {
  items: IReadingItem[];
}

export function ReadingList({ items }: ReadingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "all">("all");

  const filteredItems = filterReadingItems(items, { searchQuery, statusFilter });

  return (
    <div>
      <AddForm />

      {items.length === 0 ? (
        <EmptyState>Sua lista de leitura está vazia.</EmptyState>
      ) : (
        <>
          <div className={styles.searchRow}>
            <Input.Root>
              <Input.Wrapper>
                <Input.Field
                  type="search"
                  placeholder="Buscar por título ou autor..."
                  aria-label="Buscar na lista de leitura"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </Input.Wrapper>
            </Input.Root>

            <Input.Root>
              <Input.Wrapper>
                <Input.FieldSelect
                  aria-label="Filtrar por status"
                  optionsArray={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as ReadingStatus | "all")}
                />
              </Input.Wrapper>
            </Input.Root>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState>Nenhum item encontrado com esses filtros.</EmptyState>
          ) : (
            <ul className={styles.list}>
              {filteredItems.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
