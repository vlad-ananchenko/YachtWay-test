import type { HeatTierMeta } from "./heat.types";

export type HeatSignal = {
  id: string;
  weight: number;
  value: (form: HTMLElement) => number;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const fieldValue = (form: HTMLElement, selector: string): string => {
  const field = form.querySelector<HTMLInputElement>(selector);
  return field?.value.trim() ?? "";
};

const inputProgress =
  (selector: string): HeatSignal["value"] =>
  (form) =>
    fieldValue(form, selector).length > 0 ? 1 : 0;

const selectedSegmentProgress =
  (selector: string): HeatSignal["value"] =>
  (form) =>
    form.querySelector(`${selector} [aria-pressed="true"], ${selector} .is-selected`) ? 1 : 0;

const checkboxProgress =
  (selector: string): HeatSignal["value"] =>
  (form) =>
    form.querySelector<HTMLInputElement>(selector)?.checked ? 1 : 0;

const selectProgress =
  (selector: string): HeatSignal["value"] =>
  (form) =>
    form.querySelector(`${selector}.has-value`) ? 1 : 0;

const countProgress =
  (selector: string, fallbackMax = 4): HeatSignal["value"] =>
  (form) => {
    const badge = form.querySelector(`${selector} b`);
    const current = Number(badge?.querySelector(".count-current")?.textContent ?? "0");
    const max = Number(badge?.querySelector(".count-max")?.textContent ?? String(fallbackMax));
    return clamp01(current / (max || fallbackMax));
  };

const averageProgress =
  (selectors: string[]): HeatSignal["value"] =>
  (form) => {
    if (!selectors.length) return 0;
    return selectors.reduce((sum, selector) => sum + inputProgress(selector)(form), 0) / selectors.length;
  };

const toggleProgress =
  (selector: string): HeatSignal["value"] =>
  (form) => {
    const toggles = Array.from(form.querySelectorAll<HTMLButtonElement>(selector));
    if (!toggles.length) return 0;
    const enabled = toggles.filter(
      (toggle) => toggle.getAttribute("aria-pressed") === "true" || toggle.classList.contains("is-on"),
    ).length;
    return enabled / toggles.length;
  };

export const heatSignals: HeatSignal[] = [
  { id: "make", weight: 3, value: inputProgress("#make-input") },
  { id: "model", weight: 3, value: inputProgress("#model-input") },
  { id: "year", weight: 2, value: inputProgress("#year-input") },
  { id: "hull", weight: 3, value: inputProgress("#hull-number") },
  { id: "names", weight: 2, value: averageProgress(['input[name="currentName"]', 'input[name="launchName"]']) },
  { id: "condition", weight: 2, value: selectedSegmentProgress('[data-segmented="condition"]') },
  { id: "location", weight: 3, value: selectProgress(".vessel-location .field.select") },
  { id: "saleNotice", weight: 1, value: checkboxProgress('input[name="notForSaleUs"]') },
  { id: "vesselType", weight: 3, value: countProgress(".vessel-type", 4) },
  { id: "availability", weight: 2, value: selectedSegmentProgress('[data-segmented="availability"]') },
  { id: "completionDate", weight: 1, value: inputProgress("#completion-date") },
  { id: "goodFor", weight: 2, value: countProgress(".good-for", 4) },
  { id: "priceMode", weight: 1, value: selectedSegmentProgress('[data-segmented="priceMode"]') },
  { id: "price", weight: 3, value: inputProgress(".price-input input") },
  { id: "hidePrice", weight: 1, value: checkboxProgress('input[name="hidePrice"]') },
  { id: "taxStatus", weight: 2, value: selectProgress('[data-options="taxStatuses"]') },
  { id: "importDuty", weight: 1, value: selectProgress('[data-options="importDutyOptions"]') },
  { id: "countryDuty", weight: 1, value: selectProgress('[data-options="countriesOfDuty"]') },
  {
    id: "warranties",
    weight: 2,
    value: (form) =>
      (averageProgress([
        'input[name="generalWarrantyExpiration"]',
        'input[name="engineWarrantyExpiration"]',
        'input[name="hullWarrantyExpiration"]',
        'input[name="generatorWarrantyExpiration"]',
      ])(form) +
        toggleProgress(".toggle")(form)) /
      2,
  },
];

export const HEAT_TOTAL_WEIGHT = heatSignals.reduce((sum, s) => sum + s.weight, 0);

export const heatTiers: HeatTierMeta[] = [
  { id: "freezing", label: "Freezing", glyph: "", icon: "assets/icons/snowflake-icon.svg", min: 0 },
  { id: "cold", label: "Cold", glyph: "", icon: "assets/icons/snowflake-icon.svg", min: 0.25 },
  { id: "warm", label: "Warm", glyph: "", icon: "assets/icons/sun-icon.svg", min: 0.55 },
  { id: "hot", label: "Hot", glyph: "", icon: "assets/icons/sun-icon.svg", min: 0.78 },
  { id: "blazing", label: "Blazing", glyph: "", icon: "assets/icons/sun-icon.svg", min: 0.98 },
];
