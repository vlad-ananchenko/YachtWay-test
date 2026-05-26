import { computeHeat } from "./computeHeat";
import { heatTiers } from "./heat.config";
import type { HeatSnapshot } from "./heat.types";

export class ListingHeat {
  private frame = 0;
  private pulseTimer = 0;
  private prevScore: number | null = null;
  private prevTier: string | null = null;
  private readonly glyphEl: HTMLSpanElement;
  private readonly labelEl: HTMLElement;
  private readonly sunEls: HTMLImageElement[] = [];
  private readonly screenEl: HTMLElement | null;
  private readonly observer: MutationObserver;

  constructor(
    private readonly root: HTMLElement,
    private readonly form: HTMLElement,
  ) {
    root.replaceChildren();
    this.screenEl = root.closest<HTMLElement>(".screen");
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");

    const suns = document.createElement("span");
    suns.className = "heat-suns";
    suns.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 6; index += 1) {
      const sun = document.createElement("img");
      sun.className = "heat-sun";
      sun.src = `${import.meta.env.BASE_URL}assets/icons/sun-icon.svg`;
      sun.alt = "";
      sun.width = 14;
      sun.height = 14;
      suns.append(sun);
      this.sunEls.push(sun);
    }

    const snow = document.createElement("span");
    snow.className = "snow";
    snow.setAttribute("aria-hidden", "true");
    this.glyphEl = document.createElement("span");
    this.glyphEl.className = "snow-glyph";
    snow.append(this.glyphEl);

    const text = document.createElement("span");
    text.append("Listing Heat: ");
    this.labelEl = document.createElement("strong");
    text.append(this.labelEl);

    const help = document.createElement("span");
    help.className = "help-dot";
    help.title = "How complete and attractive your listing looks to buyers.";
    const helpIcon = document.createElement("img");
    helpIcon.src = `${import.meta.env.BASE_URL}assets/icons/question-mark-icon.svg`;
    helpIcon.width = 16;
    helpIcon.height = 16;
    helpIcon.alt = "";
    helpIcon.setAttribute("aria-hidden", "true");
    help.append(helpIcon);

    root.append(suns, snow, text, help);

    this.observer = new MutationObserver(this.schedule);
    this.observer.observe(form, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "value"],
    });
    form.addEventListener("input", this.schedule);
    form.addEventListener("change", this.schedule);

    this.update();
  }

  private readonly schedule = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.update());
  };

  private update(): void {
    this.render(computeHeat(this.form));
  }

  private render(snapshot: HeatSnapshot): void {
    const meta = heatTiers.find((tier) => tier.id === snapshot.tier) ?? heatTiers[0];
    this.root.dataset.tier = snapshot.tier;
    this.root.dataset.sunCount = String(snapshot.sunCount);
    this.root.style.setProperty("--heat-score", snapshot.score.toFixed(3));
    this.root.style.setProperty("--heat-sun-count", String(snapshot.sunCount));
    this.screenEl?.style.setProperty("--heat-score", snapshot.score.toFixed(3));
    const skyAlpha = snapshot.sunCount > 0 ? Math.max(0, ((snapshot.score - 0.55) / 0.45) * 0.54) : 0;
    this.screenEl?.style.setProperty("--heat-sky-alpha", skyAlpha.toFixed(3));
    this.screenEl?.style.setProperty("--heat-sky-opacity", snapshot.sunCount > 0 ? "1" : "0");
    this.screenEl?.classList.toggle("is-heat-complete", snapshot.isComplete);
    this.labelEl.textContent = meta.label;
    this.sunEls.forEach((sun, index) => {
      sun.classList.toggle("is-visible", index < snapshot.sunCount);
    });

    if (this.prevScore !== null && Math.abs(snapshot.score - this.prevScore) > 0.001) {
      this.pulse();
    }
    this.prevScore = snapshot.score;

    if (snapshot.tier !== this.prevTier) {
      this.prevTier = snapshot.tier;
      this.glyphEl.replaceChildren();
      this.glyphEl.classList.toggle("is-image", Boolean(meta.icon));
      if (meta.icon) {
        const glyphIcon = document.createElement("img");
        glyphIcon.src = `${import.meta.env.BASE_URL}${meta.icon}`;
        glyphIcon.width = 32;
        glyphIcon.height = 32;
        glyphIcon.alt = "";
        glyphIcon.setAttribute("aria-hidden", "true");
        this.glyphEl.append(glyphIcon);
      } else {
        this.glyphEl.textContent = meta.glyph;
      }
      this.glyphEl.style.animation = "none";
      void this.glyphEl.offsetWidth;
      this.glyphEl.style.animation = "";
    }
  }

  private pulse(): void {
    window.clearTimeout(this.pulseTimer);
    this.root.classList.add("is-changing");
    this.pulseTimer = window.setTimeout(() => {
      this.root.classList.remove("is-changing");
    }, 420);
  }
}
