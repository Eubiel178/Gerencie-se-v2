"use client";

import { createContext, useCallback, useContext, useState } from "react";

import styles from "./toast.module.css";

type ToastType = "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const Context = createContext<ToastContextValue>({} as ToastContextValue);

const TOAST_DURATION_MS = 3000;

/** Feedback minimalista de "deu certo" (ou "deu errado") — um texto
 * curto que aparece no canto e some sozinho, sem precisar de clique pra
 * fechar. `type` é opcional e default "success" — nenhum uso existente
 * precisa mudar pra continuar funcionando igual. */
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();

    setToasts((current) => [...current, { id, message, type }]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <Context.Provider value={{ showToast }}>
      {children}

      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </p>
        ))}
      </div>
    </Context.Provider>
  );
}

const useToast = () => useContext(Context);

export { ToastProvider, useToast };
