import type { Option } from "../data/options";
import {
  countriesOfDuty,
  goodForOptions,
  importDutyOptions,
  taxStatuses,
  vesselLocations,
  vesselTypes,
} from "../data/options";
import { MultiSelect } from "./MultiSelect";
import { Select } from "./Select";
import { TagField } from "./TagField";

const OPTION_SETS: Record<string, Option[]> = {
  vesselLocations,
  vesselTypes,
  goodForOptions,
  taxStatuses,
  importDutyOptions,
  countriesOfDuty,
};

export function enhanceControls(scope: ParentNode = document): void {
  for (const el of scope.querySelectorAll<HTMLElement>("[data-control]")) {
    const options = OPTION_SETS[el.dataset.options ?? ""] ?? [];
    const max = el.dataset.max ? Number(el.dataset.max) : undefined;
    const defaultValue = el.dataset.default;

    switch (el.dataset.control) {
      case "select":
        new Select(el, { options, defaultValue });
        break;
      case "multiselect":
        new MultiSelect(el, { options, max, defaultValue: defaultValue?.split(",") });
        break;
      case "tagfield":
        new TagField(el, { options, max, defaultValue: defaultValue?.split(",") });
        break;
    }
  }
}
