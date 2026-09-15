"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

interface UseStepChecklistActions {
  addStep: (title: string) => Promise<unknown>;
  toggleStep: (stepId: string, completed: boolean) => Promise<unknown>;
  removeStep: (stepId: string) => Promise<unknown>;
}

/**
 * Padrão repetido idêntico entre o checklist de passos de tarefas
 * (`TaskSteps`) e o de metas (`goals-list/card`): um campo de novo título,
 * uma etapa "ocupada" por vez (nunca duas ações simultâneas), e
 * add/toggle/remove sempre seguidos de `router.refresh()`. Centralizado
 * aqui pra não divergir por acidente entre os dois (mesmo raciocínio de
 * `useFormModal`) — cada chamador só entra com as 3 Server Actions; a UI
 * (rótulos, ícones, layout) continua inteiramente no componente. Regra de
 * negócio específica de um lado (ex.: metas emitindo um evento de mascote
 * ao bater 100%) fica dentro do `toggleStep`/`addStep` que o chamador
 * passa, nunca aqui.
 */
export function useStepChecklist({ addStep, toggleStep, removeStep }: UseStepChecklistActions) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  // Uma etapa ocupada por vez - as outras continuam clicáveis normalmente,
  // só a que está em requisição fica travada contra clique repetido.
  const [busyStepId, setBusyStepId] = useState<string | null>(null);

  async function handleAddStep() {
    const title = newTitle.trim();
    if (!title) return;

    setIsAdding(true);
    try {
      await addStep(title);
      setNewTitle("");
      router.refresh();
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleStep(stepId: string, completed: boolean) {
    if (busyStepId) return;

    setBusyStepId(stepId);
    try {
      await toggleStep(stepId, completed);
      router.refresh();
    } finally {
      setBusyStepId(null);
    }
  }

  async function handleRemoveStep(stepId: string) {
    if (busyStepId) return;

    setBusyStepId(stepId);
    try {
      await removeStep(stepId);
      router.refresh();
    } finally {
      setBusyStepId(null);
    }
  }

  return {
    newTitle,
    setNewTitle,
    isAdding,
    busyStepId,
    handleAddStep,
    handleToggleStep,
    handleRemoveStep,
  };
}
