"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";
import { dismissOnboardingAction } from "../actions";
import { OnboardingItem } from "../get-onboarding-status";

import styles from "./onboarding-checklist.module.css";

interface OnboardingChecklistProps {
  items: OnboardingItem[];
}

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  async function handleDismiss() {
    if (isDismissing) return;

    setIsDismissing(true);
    const result = await dismissOnboardingAction();
    if (!result.error) router.refresh();
    setIsDismissing(false);
  }

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
