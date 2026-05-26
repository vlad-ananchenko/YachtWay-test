const COMBO_OPTION_SELECTOR = ".combo-option, .combo-create";
const FOCUSABLE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function focusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null,
  );
}

function enabledComboOptions(menu: HTMLElement): HTMLButtonElement[] {
  return Array.from(menu.querySelectorAll<HTMLButtonElement>(COMBO_OPTION_SELECTOR)).filter((option) => !option.disabled);
}

function focusComboOption(menu: HTMLElement, index: number): void {
  const options = enabledComboOptions(menu);
  if (!options.length) return;
  options[(index + options.length) % options.length].focus();
}

function activeComboIndex(menu: HTMLElement): number {
  const options = enabledComboOptions(menu);
  return document.activeElement instanceof HTMLButtonElement ? options.indexOf(document.activeElement) : -1;
}

function comboOptionValue(option: HTMLButtonElement): string {
  return option.childNodes[0]?.textContent?.trim() ?? option.textContent?.trim() ?? "";
}

function syncComboSelection(input: HTMLInputElement, menu: HTMLElement): void {
  const value = input.value.trim();
  for (const option of menu.querySelectorAll<HTMLButtonElement>(".combo-option")) {
    const selected = value.length > 0 && comboOptionValue(option) === value;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  }
}

function closeCombo(field: HTMLElement, input: HTMLInputElement): void {
  field.classList.remove("open");
  input.setAttribute("aria-expanded", "false");
}

function enhanceComboboxKeyboard(scope: ParentNode): void {
  for (const field of scope.querySelectorAll<HTMLElement>(".field.combo")) {
    const input = field.querySelector<HTMLInputElement>("input[role='combobox']");
    const toggle = field.querySelector<HTMLButtonElement>(".combo-toggle");
    const menu = field.querySelector<HTMLElement>(".combo-menu");
    if (!input || !toggle || !menu) continue;

    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-autocomplete", "list");

    const syncSelection = (): void => syncComboSelection(input, menu);
    syncSelection();
    input.addEventListener("input", syncSelection);
    input.addEventListener("change", syncSelection);
    input.addEventListener("focus", () => requestAnimationFrame(syncSelection));
    new MutationObserver(syncSelection).observe(menu, { childList: true, subtree: true });

    toggle.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!field.classList.contains("open")) toggle.click();
        requestAnimationFrame(() => focusComboOption(menu, 0));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!field.classList.contains("open")) toggle.click();
        requestAnimationFrame(() => focusComboOption(menu, enabledComboOptions(menu).length - 1));
      }

      if (event.key === "Tab") {
        closeCombo(field, input);
      }
    });

    menu.addEventListener("keydown", (event) => {
      const index = activeComboIndex(menu);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusComboOption(menu, index + 1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusComboOption(menu, index - 1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusComboOption(menu, 0);
      }

      if (event.key === "End") {
        event.preventDefault();
        focusComboOption(menu, enabledComboOptions(menu).length - 1);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeCombo(field, input);
        input.focus();
      }

      if (event.key === "Tab") {
        closeCombo(field, input);
      }
    });

    menu.addEventListener("click", (event) => {
      if (!(event.target instanceof Element) || !event.target.closest(COMBO_OPTION_SELECTOR)) return;
      requestAnimationFrame(() => {
        syncSelection();
        input.focus();
        closeCombo(field, input);
      });
    });
  }
}

function enhanceSwitches(scope: ParentNode): void {
  for (const toggle of scope.querySelectorAll<HTMLButtonElement>(".toggle")) {
    const update = (): void => {
      const enabled = !toggle.classList.contains("is-off");
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-checked", String(enabled));
    };

    update();
    toggle.addEventListener("click", () => requestAnimationFrame(update));
    new MutationObserver(update).observe(toggle, { attributes: true, attributeFilter: ["class", "aria-pressed"] });
  }
}

function syncFieldErrors(scope: ParentNode): void {
  for (const field of scope.querySelectorAll<HTMLElement>(".field")) {
    const target = field.querySelector<HTMLElement>("input, :scope > button");
    if (!target) continue;

    const message = field.querySelector<HTMLElement>(".field-message[id]");
    const messageId = message?.id;
    const describedBy = new Set((target.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    const hasError = field.classList.contains("has-error");

    target.setAttribute("aria-invalid", String(hasError));
    if (messageId && hasError) describedBy.add(messageId);
    if (messageId && !hasError) describedBy.delete(messageId);

    if (describedBy.size) target.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
    else target.removeAttribute("aria-describedby");
  }
}

function enhanceValidationState(scope: ParentNode): void {
  syncFieldErrors(scope);
  const observer = new MutationObserver(() => syncFieldErrors(scope));
  const form = scope.querySelector(".form");
  if (form) observer.observe(form, { subtree: true, attributes: true, attributeFilter: ["class"] });
}

function enhanceModal(scope: ParentNode): void {
  const backdrop = scope.querySelector<HTMLElement>("[data-modal]");
  const closeButton = backdrop?.querySelector<HTMLButtonElement>(".modal-close");
  if (!backdrop || !closeButton) return;

  const update = (): void => {
    backdrop.setAttribute("aria-hidden", String(backdrop.hidden));
  };

  update();
  new MutationObserver(update).observe(backdrop, { attributes: true, attributeFilter: ["hidden"] });

  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeButton.click();
      return;
    }

    if (event.key !== "Tab") return;

    const elements = focusableElements(backdrop);
    if (!elements.length) return;

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function enhanceFormStatus(scope: ParentNode): void {
  const actions = scope.querySelector(".actions");
  if (!actions) return;

  const apply = (): void => {
    const status = document.querySelector<HTMLElement>(".form-status");
    if (!status) return;
    status.id = "form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  };

  apply();
  new MutationObserver(apply).observe(actions.parentElement ?? document.body, { childList: true, subtree: true });
}

export function enhanceAccessibility(scope: ParentNode = document): void {
  enhanceComboboxKeyboard(scope);
  enhanceSwitches(scope);
  enhanceValidationState(scope);
  enhanceModal(scope);
  enhanceFormStatus(scope);
}
