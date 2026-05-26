export type Option = { value: string; label: string };

const opt = (label: string): Option => ({ value: label, label });

export const vesselTypes: Option[] = [
  "Motor Yacht",
  "Sailing Yacht",
  "Catamaran",
  "Trimaran",
  "Gulet",
  "Expedition",
  "Sport Fishing",
  "Trawler",
  "Open / Bowrider",
  "Mega Yacht",
].map(opt);

export const goodForOptions: Option[] = [
  "Watersports",
  "Fishing",
  "Cruising",
  "Diving",
  "Entertaining",
  "Day Charter",
  "Overnight Stays",
  "Family",
].map(opt);

export const vesselLocations: Option[] = [
  "Miami, FL",
  "Fort Lauderdale, FL",
  "Newport, RI",
  "San Diego, CA",
  "Monaco",
  "Palma de Mallorca, Spain",
  "Antibes, France",
  "Athens, Greece",
].map(opt);

export const taxStatuses: Option[] = [
  "Tax Paid",
  "Tax Not Paid",
  "Tax Deductible",
  "VAT Paid",
  "VAT Not Paid",
].map(opt);

export const importDutyOptions: Option[] = [opt("Yes"), opt("No")];

export const countriesOfDuty: Option[] = [
  "United States",
  "United Kingdom",
  "France",
  "Italy",
  "Spain",
  "Greece",
  "Monaco",
  "Netherlands",
  "Germany",
  "United Arab Emirates",
].map(opt);
