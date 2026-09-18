"use client";

import { useState } from "react";

import { calculateCycleEstimate, ICycleEntry, ICycleEstimate } from "@/features/menstrual-cycle/domain";

import { AddEntryForm } from "../add-entry-form";
import { EstimatePanel } from "../estimate-panel";
import { History } from "../history";

interface CycleContentProps {
  entries: ICycleEntry[];
  estimate: ICycleEstimate;
}

export function CycleContent({ entries, estimate }: CycleContentProps) {
  const [visibleEntries, setVisibleEntries] = useState(entries);
  const currentEstimate = visibleEntries === entries ? estimate : calculateCycleEstimate(visibleEntries);

  return (
    <>
      <EstimatePanel estimate={currentEstimate} />
      <AddEntryForm onAdd={(entry) => setVisibleEntries((current) => [entry, ...current].sort((a, b) => b.startDate.localeCompare(a.startDate)))} />
      <History entries={visibleEntries} onRemove={(id) => setVisibleEntries((current) => current.filter((entry) => entry.id !== id))} />
    </>
  );
}
