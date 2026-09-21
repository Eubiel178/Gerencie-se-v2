"use client";

import { useState } from "react";

import { retryTaskSyncAction } from "@/features/tasks/actions";
import { ITask } from "@/features/tasks/domain";
import { useTaskStore } from "@/features/tasks/task-store";

export function useTaskSyncRetry(task: ITask) {
  const [isRetrying, setIsRetrying] = useState(false);
  const replaceTask = useTaskStore((state) => state.replaceTask);

  async function handleRetrySync() {
    setIsRetrying(true);
    try {
      const result = await retryTaskSyncAction({ id: task.id });
      if (!result.error && result.task) replaceTask(result.task);
    } finally {
      setIsRetrying(false);
    }
  }

  return { isRetrying, handleRetrySync };
}
