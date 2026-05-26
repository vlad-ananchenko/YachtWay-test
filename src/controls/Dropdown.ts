type DropdownCallbacks = { onToggle?: (open: boolean) => void };

export class Dropdown {
  private opened = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: DropdownCallbacks = {},
  ) {}

  get isOpen(): boolean {
    return this.opened;
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.root.classList.add("open");
    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("keydown", this.onKeyDown);
    this.callbacks.onToggle?.(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.classList.remove("open");
    document.removeEventListener("pointerdown", this.onPointerDown);
    document.removeEventListener("keydown", this.onKeyDown);
    this.callbacks.onToggle?.(false);
  }

  toggle(): void {
    if (this.opened) this.close();
    else this.open();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.root.contains(event.target as Node)) this.close();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") this.close();
  };
}
