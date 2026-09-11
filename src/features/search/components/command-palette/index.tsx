"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";
import { searchEverythingAction, SearchResult } from "@/features/search/actions";
import { usePaletteStore } from "@/features/search/palette-store";

import styles from "./command-palette.module.css";

const DEBOUNCE_MS = 200;

/**
 * Busca global (Cmd/Ctrl+K). Fica montado uma vez no layout de /home/* —
 * o atalho de teclado funciona em qualquer tela; o botão de busca no
 * Header (pensado pro mobile, sem teclado físico) abre a mesma coisa via
 * `usePaletteStore`.
 */
export function CommandPalette() {
  const router = useRouter();
  const isOpen = usePaletteStore((state) => state.isOpen);
  const open = usePaletteStore((state) => state.open);
  const close = usePaletteStore((state) => state.close);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Fecha e já limpa a busca local — nunca reabre com resultado antigo na
  // tela. Centralizado aqui (em vez de um `useEffect` reagindo a `isOpen`)
  // porque resetar estado a partir de um efeito, sem gesto nenhum do
  // usuário por trás, é exatamente o padrão que cria re-renders em
  // cascata desnecessários.
  function handleClose() {
    close();
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }

  // Atalho global: Cmd+K (Mac) / Ctrl+K (Windows/Linux), de qualquer tela.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      } else if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Foco automático assim que abre.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const found = await searchEverythingAction(value);

      // Uma busca mais nova já foi disparada — essa resposta chegou tarde
      // e não pode mais sobrescrever o resultado atual.
      if (requestId !== requestIdRef.current) return;

      setResults(found);
      setIsSearching(false);
    }, DEBOUNCE_MS);
  }

  function handleSelect(result: SearchResult) {
    router.push(result.href);
    handleClose();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = results[activeIndex];
      if (active) handleSelect(active);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.palette} onClick={(event) => event.stopPropagation()}>
        <div className={styles.searchRow}>
          <Icon name="FaSearch" aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Buscar tarefas, hábitos, metas, eventos, leitura..."
            aria-label="Busca global"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className={styles.closeButton} aria-label="Fechar busca" onClick={handleClose}>
            <Icon name="MdClose" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.results}>
          {query.trim().length < 2 && (
            <p className={styles.hint}>Digite pelo menos 2 letras para buscar.</p>
          )}

          {query.trim().length >= 2 && !isSearching && results.length === 0 && (
            <p className={styles.hint}>Nada encontrado para &quot;{query}&quot;.</p>
          )}

          {results.length > 0 && (
            <ul className={styles.resultList}>
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    className={styles.resultItem}
                    data-active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(result)}
                  >
                    <span className={styles.resultTitle}>{result.title}</span>
                    <span className={styles.resultSubtitle}>{result.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
