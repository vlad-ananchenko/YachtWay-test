import type { Option } from "../data/options";

export const DEFAULT_MAX_SELECTIONS = 4;

let controlId = 0;

export function nextControlId(prefix: string): string {
  controlId += 1;
  return `${prefix}-${controlId}`;
}

export function requireTrigger(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(":scope > button");
  if (!button) throw new Error("Control is missing its <button> trigger");
  return button;
}

export function labelText(root: HTMLElement): string {
  return root.querySelector(":scope > span")?.textContent?.trim() ?? "";
}

export function buildMenu(options: Option[], onPick: (value: string) => void, id = nextControlId("select-menu")): HTMLDivElement {
  const menu = document.createElement("div");
  menu.id = id;
  menu.className = "select-menu";
  menu.setAttribute("role", "listbox");
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "select-option";
    button.setAttribute("role", "option");
    button.tabIndex = -1;
    button.dataset.value = option.value;
    button.textContent = option.label;
    button.addEventListener("click", () => onPick(option.value));
    menu.append(button);
  }
  return menu;
}

export function renderCountBadge(badge: HTMLElement, current: number, max: number): void {
  const full = current >= max;
  badge.classList.toggle("is-full", full);
  badge.replaceChildren();

  const currentEl = document.createElement("span");
  currentEl.className = "count-current";
  currentEl.textContent = String(current);

  const separatorEl = document.createElement("span");
  separatorEl.className = "count-separator";
  separatorEl.textContent = "/";

  const maxEl = document.createElement("span");
  maxEl.className = "count-max";
  maxEl.textContent = String(max);

  badge.append(currentEl, separatorEl, maxEl);
}

export function optionButtons(menu: HTMLElement, selector = ".select-option"): HTMLButtonElement[] {
  return Array.from(menu.querySelectorAll<HTMLButtonElement>(selector));
}

export function enabledOptions(menu: HTMLElement, selector = ".select-option"): HTMLButtonElement[] {
  return optionButtons(menu, selector).filter((option) => !option.disabled);
}

export function focusPreferredOption(menu: HTMLElement, selectedValue?: string, selector = ".select-option"): void {
  const options = enabledOptions(menu, selector);
  if (!options.length) return;
  const preferred = selectedValue ? options.find((option) => option.dataset.value === selectedValue) : undefined;
  (preferred ?? options[0]).focus();
}

export function focusLastOption(menu: HTMLElement, selector = ".select-option"): void {
  const options = enabledOptions(menu, selector);
  options.at(-1)?.focus();
}

export function handleListboxKeydown(
  event: KeyboardEvent,
  menu: HTMLElement,
  closeAndReturnFocus: () => void,
  selector = ".select-option",
): void {
  const options = enabledOptions(menu, selector);
  const active = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
  const activeIndex = active ? options.indexOf(active) : -1;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      options[(activeIndex + 1 + options.length) % options.length]?.focus();
      break;
    case "ArrowUp":
      event.preventDefault();
      options[(activeIndex - 1 + options.length) % options.length]?.focus();
      break;
    case "Home":
      event.preventDefault();
      options[0]?.focus();
      break;
    case "End":
      event.preventDefault();
      options.at(-1)?.focus();
      break;
    case "Escape":
      event.preventDefault();
      closeAndReturnFocus();
      break;
    case "Tab":
      closeAndReturnFocus();
      break;
  }
}
