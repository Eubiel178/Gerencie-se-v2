"use client";

import { useRef, useState } from "react";

import { Button, Input, Modal, ModalHeader } from "@/components";
import { Icon } from "@/components/icon";
import {
  deleteReadingItemAction,
  updateReadingCurrentPageAction,
  updateReadingDetailsAction,
  updateReadingItemAction,
} from "@/features/reading/actions";
import { IReadingItem, ReadingStatus } from "@/features/reading/domain";
import { getReadingProgress } from "@/features/reading/reading-progress";

import styles from "../shared/styles.module.css";

type ReadingFormState = {
  title: string;
  author: string;
  status: ReadingStatus;
  totalPages: string;
  currentPage: string;
  dailyGoal: string;
};

function createReadingForm(item: IReadingItem): ReadingFormState {
  return {
    title: item.title,
    author: item.author ?? "",
    status: item.status,
    totalPages: item.totalPages?.toString() ?? "",
    currentPage: item.currentPage?.toString() ?? "",
    dailyGoal: item.dailyReadingGoal?.toString() ?? "",
  };
}

const STATUS_OPTIONS = [
  { label: "Quero ler", value: "want_to_read" },
  { label: "Lendo", value: "reading" },
  { label: "Concluído", value: "finished" },
];

const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: "Quero ler",
  reading: "Lendo",
  finished: "Concluído",
};

// Arrastar o slider de progresso dispara onChange várias vezes seguidas —
// sem isso, cada tick vira uma requisição, e uma resposta mais lenta podia
// chegar DEPOIS de uma mais nova e sobrescrever o valor com um progresso
// antigo. Debounce controla a rajada de requisições; o número de sequência
// garante que só a resposta da ÚLTIMA requisição em voo tem efeito.
const PROGRESS_DEBOUNCE_MS = 300;

interface ItemProps {
  item: IReadingItem;
  openDetails?: boolean;
  onDetailsChange?: (isOpen: boolean) => void;
  onUpdated: (item: IReadingItem) => void;
  onDeleted: (id: string) => void;
}

export function Item({
  item,
  openDetails = false,
  onDetailsChange,
  onUpdated,
  onDeleted,
}: ItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    item.currentPage?.toString() ?? "1",
  );
  const [localProgress, setLocalProgress] = useState(item.progressPercent);
  const [error, setError] = useState<string | null>(null);
  const [pageUpdateSuccess, setPageUpdateSuccess] = useState(false);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [formDraft, setFormDraft] = useState<ReadingFormState>(() =>
    createReadingForm(item),
  );

  const progressRequestIdRef = useRef(0);
  const progressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pageTotal = item.totalPages ?? 0;
  const pageCurrent = item.currentPage ?? 0;
  const hasPageProgress = item.totalPages != null && item.currentPage != null;
  const pageProgress = hasPageProgress
    ? getReadingProgress(pageCurrent, pageTotal)
    : null;
  const displayProgress = pageProgress?.progressPercent ?? localProgress;

  function handleProgressChange(event: React.ChangeEvent<HTMLInputElement>) {
    const progressPercent = Number(event.target.value);
    setLocalProgress(progressPercent);

    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);

    progressDebounceRef.current = setTimeout(async () => {
      const requestId = ++progressRequestIdRef.current;

      const result = await updateReadingItemAction({
        id: item.id,
        status: progressPercent >= 100 ? "finished" : "reading",
        progressPercent,
      });

      // Uma requisição mais nova já foi disparada enquanto esta esperava —
      // aplicar essa resposta agora sobrescreveria um valor mais recente.
      if (requestId !== progressRequestIdRef.current) return;

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.item) onUpdated(result.item);
    }, PROGRESS_DEBOUNCE_MS);
  }

  async function handleStatusChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    if (isSavingStatus) return;

    const status = event.target.value as ReadingStatus;
    setIsSavingStatus(true);
    setError(null);
    try {
      const result = await updateReadingItemAction({
        id: item.id,
        status,
        progressPercent: status === "finished" ? 100 : item.progressPercent,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.item) onUpdated(result.item);
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleRemove(): Promise<boolean> {
    setIsRemoving(true);

    try {
      const result = await deleteReadingItemAction({ id: item.id });
      if (result.error) {
        setError(result.error);
        return false;
      }

      onDeleted(item.id);
      return true;
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleDeleteConfirm() {
    const deleted = await handleRemove();
    if (deleted) setIsDeleteConfirming(false);
  }

  async function handleCurrentPageSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingPage) return;

    const parsedCurrentPage = Number(currentPage);
    if (!Number.isInteger(parsedCurrentPage) || parsedCurrentPage < 0) {
      setError("Informe uma página válida.");
      return;
    }

    setIsSavingPage(true);
    setError(null);
    setPageUpdateSuccess(false);
    try {
      const result = await updateReadingCurrentPageAction({
        id: item.id,
        currentPage: parsedCurrentPage,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setPageUpdateSuccess(true);
      if (result.item) onUpdated(result.item);
    } finally {
      setIsSavingPage(false);
    }
  }

  async function handleDetailsSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingDetails) return;

    const totalPages = parseOptionalPositiveInteger(formDraft.totalPages);
    const currentPage = parseOptionalNonNegativeInteger(formDraft.currentPage);
    const dailyReadingGoal = parseOptionalPositiveInteger(formDraft.dailyGoal);

    if (
      totalPages === "invalid" ||
      currentPage === "invalid" ||
      dailyReadingGoal === "invalid"
    ) {
      setError("Use números inteiros válidos nos campos de leitura.");
      return;
    }

    setIsSavingDetails(true);
    setError(null);
    try {
      const result = await updateReadingDetailsAction({
        id: item.id,
        title: formDraft.title,
        author: formDraft.author.trim() || null,
        status: formDraft.status,
        totalPages,
        currentPage,
        dailyReadingGoal,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsEditingOptions(false);
      if (result.item) onUpdated(result.item);
    } finally {
      setIsSavingDetails(false);
    }
  }

  return (
    <li className={styles.item}>
      <div className={styles.itemDetails} data-open={openDetails}>
        <button
          type="button"
          className={styles.bookSummary}
          aria-label={`Editar leitura de ${item.title}`}
          aria-expanded={openDetails}
          onClick={() => onDetailsChange?.(!openDetails)}
        >
          <span className={styles.bookMark} aria-hidden="true">
            {getTitleInitials(item.title)}
          </span>
          <span className={styles.bookOverview}>
            <span className={styles.itemHeader}>
              <span>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.bookStatus}>
                  {STATUS_LABELS[item.status]}
                  {item.author ? ` · ${item.author}` : ""}
                </span>
              </span>
            </span>
            <span
              className={styles.progressTrack}
              role="progressbar"
              aria-label={`Progresso de leitura de ${item.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={displayProgress}
              aria-valuetext={`${displayProgress}% concluído`}
            >
              <span
                className={styles.progressFill}
                style={{ width: `${displayProgress}%` }}
              />
            </span>
          </span>
          <span className={styles.openAction} aria-hidden="true">
            <Icon name="FiChevronRight" />
          </span>
        </button>
        {openDetails && (
          <div className={styles.itemDetailsContent}>
            <Input.Root className={styles.quickStatus}>
              <Input.Label htmlFor={`reading-status-${item.id}`}>
                Status
              </Input.Label>
              <Input.Wrapper>
                <Input.FieldSelect
                  id={`reading-status-${item.id}`}
                  value={item.status}
                  disabled={isSavingStatus}
                  onChange={handleStatusChange}
                  optionsArray={STATUS_OPTIONS}
                />
              </Input.Wrapper>
            </Input.Root>

            {item.totalPages != null && (
              <form
                className={styles.pageUpdateForm}
                onSubmit={handleCurrentPageSubmit}
              >
                <label
                  className={styles.pageUpdateLabel}
                  htmlFor={`current-page-${item.id}`}
                >
                  Página atual
                </label>
                <div className={styles.pageUpdateControls}>
                  <Input.Field
                    id={`current-page-${item.id}`}
                    name={`current-page-${item.id}`}
                    type="number"
                    min={0}
                    max={item.totalPages}
                    inputMode="numeric"
                    value={currentPage}
                    onChange={(event) => {
                      setCurrentPage(event.target.value);
                      setPageUpdateSuccess(false);
                    }}
                  />
                  <Button.Root type="submit" loading={isSavingPage}>
                    Salvar
                  </Button.Root>
                </div>
              </form>
            )}

            {hasPageProgress && (
              <div className={styles.detailProgress}>
              <p>
                Página {pageCurrent} de {pageTotal}
                {pageCurrent > 0 && ` · ${pageProgress?.progressPercent}% concluído`}
              </p>
              </div>
            )}

            {!hasPageProgress && item.status === "reading" && (
              <label className={styles.pageUpdateLabel}>
                Progresso
                <input
                  className={styles.progressSlider}
                  type="range"
                  min={0}
                  max={100}
                  aria-label={`Progresso de leitura de ${item.title}`}
                  value={localProgress}
                  onChange={handleProgressChange}
                />
              </label>
            )}

            <div className={styles.detailFooter}>
              {item.dailyReadingGoal != null ? (
                <p className={styles.dailyGoal}>
                  <Icon name="FiTarget" aria-hidden="true" />
                  Meta diária: {item.dailyReadingGoal} páginas
                </p>
              ) : (
                <p className={styles.dailyGoal}>
                  <Icon name="FiTarget" aria-hidden="true" />
                  Meta diária: não definida
                </p>
              )}
              <span className={styles.footerActions}>
                <button
                  className={styles.editOptionsButton}
                  type="button"
                  aria-expanded={isEditingOptions}
                  onClick={() => {
                    if (!isEditingOptions) {
                      setFormDraft(createReadingForm(item));
                    }
                    setIsEditingOptions((isOpen) => !isOpen);
                  }}
                >
                  <Icon name="FiSettings" aria-hidden="true" />
                  Editar
                </button>
                <button
                  className={styles.deleteOptionsButton}
                  type="button"
                  onClick={() => setIsDeleteConfirming(true)}
                >
                  <Icon name="FiTrash2" aria-hidden="true" />
                  Excluir
                </button>
              </span>
            </div>

            {isEditingOptions && (
              <form
                className={styles.itemOptions}
                onSubmit={handleDetailsSubmit}
              >
                <div className={styles.editFields}>
                  <Input.Root>
                    <Input.Label htmlFor={`reading-title-${item.id}`}>
                      Título
                    </Input.Label>
                    <Input.Wrapper>
                      <Input.Field
                        id={`reading-title-${item.id}`}
                        value={formDraft.title}
                        onChange={(event) =>
                          setFormDraft((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                      />
                    </Input.Wrapper>
                  </Input.Root>
                  <Input.Root>
                    <Input.Label htmlFor={`reading-author-${item.id}`}>
                      Autor
                    </Input.Label>
                    <Input.Wrapper>
                      <Input.Field
                        id={`reading-author-${item.id}`}
                        value={formDraft.author}
                        onChange={(event) =>
                          setFormDraft((prev) => ({
                            ...prev,
                            author: event.target.value,
                          }))
                        }
                      />
                    </Input.Wrapper>
                  </Input.Root>
                  <Input.Root>
                    <Input.Label htmlFor={`reading-total-${item.id}`}>
                      Total de páginas
                    </Input.Label>
                    <Input.Wrapper>
                      <Input.Field
                        id={`reading-total-${item.id}`}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={formDraft.totalPages}
                        onChange={(event) =>
                          setFormDraft((prev) => ({
                            ...prev,
                            totalPages: event.target.value,
                          }))
                        }
                      />
                    </Input.Wrapper>
                  </Input.Root>
                  {item.totalPages == null && (
                    <Input.Root>
                      <Input.Label htmlFor={`reading-current-${item.id}`}>
                        Página atual
                      </Input.Label>
                      <Input.Wrapper>
                        <Input.Field
                          id={`reading-current-${item.id}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={formDraft.currentPage}
                          onChange={(event) =>
                            setFormDraft((prev) => ({
                              ...prev,
                              currentPage: event.target.value,
                            }))
                          }
                        />
                      </Input.Wrapper>
                    </Input.Root>
                  )}
                  <Input.Root>
                    <Input.Label htmlFor={`reading-goal-${item.id}`}>
                      Meta diária
                    </Input.Label>
                    <Input.Wrapper>
                      <Input.Field
                        id={`reading-goal-${item.id}`}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={formDraft.dailyGoal}
                        onChange={(event) =>
                          setFormDraft((prev) => ({
                            ...prev,
                            dailyGoal: event.target.value,
                          }))
                        }
                      />
                    </Input.Wrapper>
                  </Input.Root>
                </div>
                <div className={styles.editActions}>
                  <Button.Root type="submit" loading={isSavingDetails}>
                    Salvar alterações
                  </Button.Root>
                </div>
              </form>
            )}
            {pageUpdateSuccess && (
              <p className={styles.pageUpdateSuccess} role="status">
                Página atualizada.
              </p>
            )}
            {error && <p className={styles.itemError}>{error}</p>}
          </div>
        )}
      </div>

      {isDeleteConfirming && (
        <Modal onClose={() => setIsDeleteConfirming(false)}>
          <ModalHeader
            title={`Excluir "${item.title}"?`}
            onClose={() => setIsDeleteConfirming(false)}
          />
          <div className={styles.deleteConfirmation}>
            <span className={styles.deleteBookMark} aria-hidden="true">
              {getTitleInitials(item.title)}
            </span>
            <div>
              <strong>{item.title}</strong>
              {item.author && <span>{item.author}</span>}
            </div>
          </div>
          <p className={styles.deleteCopy}>
            Este livro será removido da sua estante. Essa ação não pode ser
            desfeita.
          </p>
          <div className={styles.deleteActions}>
            <Button.Root
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteConfirming(false)}
            >
              Cancelar
            </Button.Root>
            <Button.Root
              type="button"
              tone="danger"
              loading={isRemoving}
              onClick={handleDeleteConfirm}
            >
              Excluir
            </Button.Root>
          </div>
        </Modal>
      )}
    </li>
  );
}

function parseOptionalPositiveInteger(
  value: string,
): number | null | "invalid" {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : "invalid";
}

function parseOptionalNonNegativeInteger(
  value: string,
): number | null | "invalid" {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : "invalid";
}

function getTitleInitials(title: string): string {
  return title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
