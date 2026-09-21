"use client";

import { useState } from "react";

import Link from "next/link";

import { Icon } from "@/components";

import { dismissOnboardingAction } from "../../actions";
import { OnboardingItem } from "../../get-onboarding-status";

import styles from "./styles.module.css";

interface OnboardingChecklistProps {
  items: OnboardingItem[];
}

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  async function handleDismiss() {
    if (isDismissing) return;

    setIsDismissing(true);
    const result = await dismissOnboardingAction();
    if (!result.error) setIsDismissed(true);
    setIsDismissing(false);
  }

  if (isDismissed) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Comece pelo essencial</h2>
          <p className={styles.subtitle}>
            {doneCount} de {items.length} concluídos — escolha o próximo passo que faz sentido agora.
          </p>
        </div>

        <button
          type="button"
          className={styles.dismiss}
          aria-label="Ocultar checklist de primeiros passos"
          disabled={isDismissing}
          onClick={handleDismiss}
        >
          <Icon name="MdClose" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item} data-done={item.done}>
            {item.done ? (
              <span className={styles.checkDone} aria-hidden="true">
                <Icon name="FaCheck" />
              </span>
            ) : (
              <span className={styles.checkPending} aria-hidden="true" />
            )}

            {item.done ? (
              <span className={styles.itemLabel}>{item.label}</span>
            ) : (
              <Link href={item.href} className={styles.itemLink}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
