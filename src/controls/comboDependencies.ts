export function enhanceComboDependencies(scope: ParentNode = document): void {
  const makeInput = scope.querySelector<HTMLInputElement>("#make-input");
  const modelInput = scope.querySelector<HTMLInputElement>("#model-input");
  const modelField = scope.querySelector<HTMLElement>('[data-combo="model"]');
  if (!makeInput || !modelInput || !modelField) return;

  makeInput.addEventListener("input", () => {
    if (makeInput.value.trim() || !modelInput.value) return;

    modelInput.value = "";
    modelInput.dispatchEvent(new Event("input", { bubbles: true }));
    modelField.classList.remove("open");
    modelInput.setAttribute("aria-expanded", "false");
  });
}
