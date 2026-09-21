"use client";

import { useInputRootContext } from "@/providers/input-root-context";

import styles from "./styles.module.css";

export const InputHelperText = () => {
  const { sharedProps } = useInputRootContext();

  return (
    <p className={styles.helperText} aria-live="polite">
      {sharedProps?.error}
    </p>
  );
};
