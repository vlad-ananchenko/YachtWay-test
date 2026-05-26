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
} from "./dom";

export type TagFieldConfig = { options: Option[]; max?: number; defaultValue?: string[] };

export class TagField {
  private readonly selected: string[];
  private readonly options: Option[];
  private readonly max: number;
  private readonly trigger: HTMLButtonElement;
  private readonly badge: HTMLElement;
  private readonly menu: HTMLDivElement;
  private readonly dropdown: Dropdown;

  constructor(
    private readonly root: HTMLElement,
    config: TagFieldConfig,
  ) {
    this.options = config.options;
    this.max = config.max ?? DEFAULT_MAX_SELECTIONS;
    this.selected = (config.defaultValue ?? []).filter((value) =>
      this.options.some((option) => option.value === value),
    );

    const label = labelText(root);

    this.trigger = document.createElement("button");
    this.trigger.type = "button";
    this.trigger.className = "tag-trigger";
    this.trigger.setAttribute("aria-haspopup", "listbox");
    this.trigger.setAttribute("aria-label", `Add ${label}`);
    this.trigger.setAttribute("aria-expanded", "false");
    root.append(this.trigger);

    this.badge = document.createElement("b");
    root.append(this.badge);

    this.menu = buildMenu(this.options, (value) => this.toggleValue(value));
    this.menu.classList.add("is-multi");
    this.menu.setAttribute("aria-label", label);
    this.menu.setAttribute("aria-multiselectable", "true");
    this.trigger.setAttribute("aria-controls", this.menu.id);
    root.append(this.menu);

    this.dropdown = new Dropdown(root, {
      onToggle: (open) => this.trigger.setAttribute("aria-expanded", String(open)),
    });
    root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (
        this.trigger.disabled ||
        target.closest(".tag-trigger") ||
        target.closest(".tag-remove") ||
        target.closest(".select-menu")
      ) {
        return;
      }

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
          this.openAndFocusFirstAvailable();
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
    const index = this.selected.indexOf(value);
    if (index >= 0) this.selected.splice(index, 1);
    else if (this.selected.length < this.max) this.selected.push(value);
    else return;

    this.render();
    this.dropdown.open();
    focusPreferredOption(this.menu, value);
  }

  private remove(value: string): void {
    const index = this.selected.indexOf(value);
    if (index >= 0) this.selected.splice(index, 1);
    this.render();
  }

  private render(): void {
    this.root.querySelectorAll(":scope > em").forEach((chip) => chip.remove());

    for (const value of this.selected) {
      const meta = this.options.find((option) => option.value === value);
      const chip = document.createElement("em");
      chip.textContent = meta?.label ?? value;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "tag-remove";
      remove.setAttribute("aria-label", `Remove ${meta?.label ?? value}`);
      const removeIcon = document.createElement("img");
      removeIcon.src = `${import.meta.env.BASE_URL}assets/icons/close-icon.svg`;
      removeIcon.alt = "";
      removeIcon.setAttribute("aria-hidden", "true");
      remove.append(removeIcon);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        this.remove(value);
      });
      chip.append(remove);
      this.root.insertBefore(chip, this.trigger);
    }

    renderCountBadge(this.badge, this.selected.length, this.max);
    this.root.classList.toggle("has-value", this.selected.length > 0);

    const full = this.selected.length >= this.max;
    this.trigger.disabled = false;
    for (const option of this.menu.querySelectorAll<HTMLButtonElement>(".select-option")) {
      const selected = this.selected.includes(option.dataset.value ?? "");
      option.classList.toggle("is-selected", selected);
      option.disabled = !selected && full;
      option.setAttribute("aria-selected", String(selected));
    }
  }

  private openAndFocusFirstAvailable(): void {
    this.dropdown.open();
    focusPreferredOption(this.menu);
  }

  private closeAndFocusTrigger(): void {
    this.dropdown.close();
    this.trigger.focus();
  }
}
