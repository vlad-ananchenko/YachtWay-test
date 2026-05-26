import type { Option } from "../data/options";
import { Dropdown } from "./Dropdown";
import { buildMenu, focusLastOption, focusPreferredOption, handleListboxKeydown, labelText, requireTrigger } from "./dom";

export type SelectConfig = { options: Option[]; defaultValue?: string };

export class Select {
  private value: string;
  private readonly options: Option[];
  private readonly trigger: HTMLButtonElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly menu: HTMLDivElement;
  private readonly dropdown: Dropdown;

  constructor(
    private readonly root: HTMLElement,
    config: SelectConfig,
  ) {
    this.options = config.options;
    this.value = config.defaultValue ?? "";

    const label = labelText(root);
    this.trigger = requireTrigger(root);
    this.trigger.setAttribute("aria-haspopup", "listbox");
    this.trigger.setAttribute("aria-label", label);
    this.trigger.setAttribute("aria-expanded", "false");
    if (root.hasAttribute("data-required")) this.trigger.setAttribute("aria-required", "true");

    this.valueEl = document.createElement("span");
    this.valueEl.className = "select-value";
    this.trigger.append(this.valueEl);

    this.menu = buildMenu(this.options, (value) => this.select(value));
    if (root.querySelector(":scope > .help-dot")) this.menu.classList.add("has-help");
    this.menu.setAttribute("aria-label", label);
    this.trigger.setAttribute("aria-controls", this.menu.id);
    root.append(this.menu);

    this.dropdown = new Dropdown(root, {
      onToggle: (open) => this.trigger.setAttribute("aria-expanded", String(open)),
    });
    root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (this.trigger.disabled || target.closest("button") || target.closest(".select-menu")) return;

      this.dropdown.toggle();
      this.trigger.focus();
    });
    this.trigger.addEventListener("click", () => this.dropdown.toggle());
    this.trigger.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowDown":
        case "Enter":
        case " ":
          event.preventDefault();
          this.openAndFocusSelected();
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

  private select(value: string): void {
    this.value = value;
    this.dropdown.close();
    this.render();
    this.trigger.focus();
  }

  private render(): void {
    const selected = this.options.find((option) => option.value === this.value);
    this.valueEl.textContent = selected?.label ?? "";
    this.root.classList.toggle("has-value", Boolean(this.value));
    for (const option of this.menu.querySelectorAll<HTMLButtonElement>(".select-option")) {
      const isSelected = option.dataset.value === this.value;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-selected", String(isSelected));
    }
  }

  private openAndFocusSelected(): void {
    this.dropdown.open();
    focusPreferredOption(this.menu, this.value);
  }

  private closeAndFocusTrigger(): void {
    this.dropdown.close();
    this.trigger.focus();
  }
}
