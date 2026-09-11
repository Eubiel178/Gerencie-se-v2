"use client";

import { createContext, useCallback, useContext, useState } from "react";

import styles from "./toast.module.css";

interface ToastItem {
  id: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const Context = createContext<ToastContextValue>({} as ToastContextValue);

const TOAST_DURATION_MS = 3000;

/** Feedback minimalista de "deu certo" — um texto curto que aparece
 * no canto e some sozinho, sem precisar de clique pra fechar. */
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID();

    setToasts((current) => [...current, { id, message }]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <Context.Provider value={{ showToast }}>
      {children}

      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className={styles.toast}>
            {toast.message}
          </p>
        ))}
      </div>
    </Context.Provider>
  );
}

const useToast = () => useContext(Context);

export { ToastProvider, useToast };
