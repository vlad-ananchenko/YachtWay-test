import type { Option } from "../data/options";
import { Dropdown } from "./Dropdown";
import {
  DEFAULT_MAX_SELECTIONS,
  buildMenu,
  focusLastOption,
  focusPreferredOption,
  handleListboxKeydown,
  labelText,
  renderCountBadge,
  requireTrigger,
} from "./dom";

export type MultiSelectConfig = { options: Option[]; max?: number; defaultValue?: string[] };

export class MultiSelect {
  private readonly selected: Set<string>;
  private readonly options: Option[];
  private readonly max: number;
  private readonly trigger: HTMLButtonElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly badge: HTMLElement;
  private readonly menu: HTMLDivElement;
  private readonly dropdown: Dropdown;

  constructor(
    private readonly root: HTMLElement,
    config: MultiSelectConfig,
  ) {
    this.options = config.options;
    this.max = config.max ?? DEFAULT_MAX_SELECTIONS;
    this.selected = new Set(config.defaultValue ?? []);

    const label = labelText(root);
    this.trigger = requireTrigger(root);
    this.trigger.setAttribute("aria-haspopup", "listbox");
    this.trigger.setAttribute("aria-label", label);
    this.trigger.setAttribute("aria-expanded", "false");
    if (root.hasAttribute("data-required")) this.trigger.setAttribute("aria-required", "true");

    this.valueEl = document.createElement("span");
    this.valueEl.className = "select-value";
    this.trigger.append(this.valueEl);

    this.menu = buildMenu(this.options, (value) => this.toggleValue(value));
    this.menu.classList.add("is-multi");
    this.menu.setAttribute("aria-multiselectable", "true");
    this.menu.setAttribute("aria-label", label);
    this.trigger.setAttribute("aria-controls", this.menu.id);
    root.append(this.menu);

    this.badge = document.createElement("b");
    root.append(this.badge);

    this.dropdown = new Dropdown(root, {
      onToggle: (open) => this.trigger.setAttribute("aria-expanded", String(open)),
    });
    this.trigger.addEventListener("click", () => this.dropdown.toggle());
    this.trigger.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowDown":
        case "Enter":
        case " ":
          event.preventDefault();
          this.openAndFocusFirstSelected();
          break;
        case "ArrowUp":
          event.preventDefault();
          this.dropdown.open();
          focusLastOption(this.menu);
          break;
      }
    });
    this.menu.addEventListener("keydown", (event) =>
      handleListboxKeydown(event, this.menu, () => this.closeAndFocusTrigger()),
    );

    this.render();
  }

  private toggleValue(value: string): void {
    if (this.selected.has(value)) this.selected.delete(value);
    else if (this.selected.size < this.max) this.selected.add(value);
    this.render();
  }

  private render(): void {
    const labels = this.options.filter((o) => this.selected.has(o.value)).map((o) => o.label);
    this.valueEl.textContent = labels.join(", ");
    renderCountBadge(this.badge, this.selected.size, this.max);
    this.root.classList.toggle("has-value", this.selected.size > 0);

    const full = this.selected.size >= this.max;
    for (const option of this.menu.querySelectorAll<HTMLButtonElement>(".select-option")) {
      const checked = this.selected.has(option.dataset.value ?? "");
      option.classList.toggle("is-selected", checked);
      option.setAttribute("aria-selected", String(checked));
      option.disabled = !checked && full;
    }
  }

  private openAndFocusFirstSelected(): void {
    this.dropdown.open();
    focusPreferredOption(this.menu, this.selected.values().next().value);
  }

  private closeAndFocusTrigger(): void {
    this.dropdown.close();
    this.trigger.focus();
  }
}
