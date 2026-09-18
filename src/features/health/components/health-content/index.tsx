"use client";

import { useState } from "react";

import { IHealthCheckup } from "@/features/health/domain";
import { AddForm } from "../add-form";
import { List } from "../list";

export function HealthContent({ checkups }: { checkups: IHealthCheckup[] }) {
  const [visibleCheckups, setVisibleCheckups] = useState(checkups);
  const [previousCheckups, setPreviousCheckups] = useState(checkups);

  if (checkups !== previousCheckups) {
    setPreviousCheckups(checkups);
    setVisibleCheckups(checkups);
  }

  return (
    <>
      <AddForm onAdd={(checkup) => setVisibleCheckups((current) => [checkup, ...current])} />
      <List checkups={visibleCheckups} />
    </>
  );
}
