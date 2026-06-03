"use client";

import { formatDateLabel } from "@/lib/utils";
import type { WeightEntry } from "@/lib/types";

export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (!entries.length) {
    return (
      <div className="card muted-center">
        <p>No weight trend yet. Your recent entries will draw here.</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.logged_at.localeCompare(b.logged_at)).slice(-7);
  const values = sorted.map((entry) => entry.value_kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = sorted
    .map((entry, index) => {
      const x = (index / Math.max(sorted.length - 1, 1)) * 100;
      const y = 100 - ((entry.value_kg - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="card">
      <div className="card-header">
        <h2>Recent trend</h2>
        <span>{sorted.length} entries</span>
      </div>
      <div className="chart-wrap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart">
          <polyline fill="none" stroke="#111111" strokeWidth="2.5" points={points} />
        </svg>
      </div>
      <div className="chart-labels">
        {sorted.map((entry) => (
          <div key={entry.id}>
            <strong>{entry.value_kg.toFixed(1)} kg</strong>
            <span>{formatDateLabel(entry.logged_at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
