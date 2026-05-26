export const HEAT_TIERS = ["freezing", "cold", "warm", "hot", "blazing"] as const;

export type HeatTier = (typeof HEAT_TIERS)[number];

export type HeatTierMeta = {
  id: HeatTier;
  label: string;
  glyph: string;
  icon?: string;
  min: number;
};

export type HeatSnapshot = {
  score: number;
  tier: HeatTier;
  sunCount: number;
  isComplete: boolean;
};
