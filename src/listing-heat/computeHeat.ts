import { HEAT_TOTAL_WEIGHT, heatSignals, heatTiers } from "./heat.config";
import type { HeatSnapshot } from "./heat.types";

export function computeHeat(form: HTMLElement): HeatSnapshot {
  const earned = heatSignals.reduce((sum, signal) => sum + Math.max(0, Math.min(1, signal.value(form))) * signal.weight, 0);
  const score = HEAT_TOTAL_WEIGHT === 0 ? 0 : earned / HEAT_TOTAL_WEIGHT;

  let tier = heatTiers[0].id;
  for (const meta of heatTiers) {
    if (score >= meta.min) tier = meta.id;
  }

  const sunCount = score < 0.55 ? 0 : Math.min(6, Math.max(1, Math.ceil(((score - 0.55) / 0.45) * 6)));

  return { score, tier, sunCount, isComplete: score >= 0.995 };
}
