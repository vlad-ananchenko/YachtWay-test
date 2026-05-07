const currentUser = {
  id: "dealer-anna",
  role: new URLSearchParams(window.location.search).get("role") || "dealer",
};

const connectedBrands = ["Azimut", "Benetti", "Sunseeker"];
const allBrands = [
  "Abeking & Rasmussen",
  "Azimut",
  "Benetti",
  "Feadship",
  "Ferretti Yachts",
  "Heesen",
  "Lurssen",
  "Princess",
  "Sanlorenzo",
  "Sunseeker",
  "Viking",
  "Westport",
];

const officialModels = {
  "Abeking & Rasmussen": ["Aviva", "Excellence", "Kibo"],
  Azimut: ["60 Fly", "Grande 26M", "Magellano 60"],
  Benetti: ["B.Yond 37M", "Motopanfilo 37M", "Oasis 40M"],
  Feadship: ["Moonrise", "Project 825", "Savannah"],
  "Ferretti Yachts": ["580", "720", "860"],
  Heesen: ["55M Steel", "Project Akira", "VanTom"],
  Lurssen: ["Azzam", "Blue", "Kismet"],
  Princess: ["F55", "S72", "Y85"],
  Sanlorenzo: ["SL86", "SX88", "SD118"],
  Sunseeker: ["Manhattan 55", "Predator 65", "Superhawk 55"],
  Viking: ["54 Convertible", "68 Convertible", "90 Sky Bridge"],
  Westport: ["W112", "W130", "W172"],
};

const usedHullNumbers = new Set(["YW-10001", "AZ60-2025-01", "BEN-OASIS-7", "SUN-55-001"].map(normalize));
const storageKey = `listing-general-info:${currentUser.id}`;
const modelStorageKey = `created-models:${currentUser.id}`;

const state = {
  locked: false,
  make: "",
  model: "",
  year: "",
  condition: "new",
  availability: "later",
  completionDate: "",
  priceMode: "fixed",
  warranties: {
    generalWarranty: true,
    engineWarranty: true,
    hullWarranty: true,
    generatorWarranty: true,
  },
  userModels: readUserModels(),
};

const form = document.querySelector(".form");
const createNew = document.querySelector(".create-new");
const modal = document.querySelector("[data-modal]");
const modalInput = document.querySelector("#new-model-name");

const combos = {
  make: setupCombo("make", {
    input: document.querySelector("#make-input"),
    menu: document.querySelector("#make-options"),
    field: document.querySelector('[data-combo="make"]'),
    message: document.querySelector("#make-message"),
    getGroups: getMakeGroups,
    onSelect(option) {
      state.make = option.value;
      if (!officialModels[state.make]?.includes(state.model)) {
        state.model = "";
        combos.model.input.value = "";
      }
      renderCombo("model");
    },
  }),
  model: setupCombo("model", {
    input: document.querySelector("#model-input"),
    menu: document.querySelector("#model-options"),
    field: document.querySelector('[data-combo="model"]'),
    message: document.querySelector("#model-message"),
    getGroups: getModelGroups,
    onSelect(option) {
      state.model = option.value;
    },
    onCreate: openModelModal,
  }),
  year: setupCombo("year", {
    input: document.querySelector("#year-input"),
    menu: document.querySelector("#year-options"),
    field: document.querySelector('[data-combo="year"]'),
    message: document.querySelector("#year-message"),
    getGroups: getYearGroups,
    onSelect(option) {
      state.year = option.value;
    },
  }),
};

const hullInput = document.querySelector("#hull-number");
const hullField = document.querySelector(".hull-field");
const hullMessage = document.querySelector("#hull-message");
const completionDateInput = document.querySelector("#completion-date");
const segmentedGroups = [...document.querySelectorAll("[data-segmented]")];
const warrantyToggles = [...document.querySelectorAll("[data-toggle]")];

hydrateDraft();
renderAllCombos();
renderSegmentedControls();
renderWarrantyToggles();
applyAvailabilityState();
applyLockedState();

Object.values(combos).forEach((combo) => {
  combo.input.addEventListener("input", () => {
    if (state.locked && (combo.name === "make" || combo.name === "model")) return;
    state[combo.name] = "";
    clearError(combo.field);
    renderCombo(combo.name, combo.input.value);
    openCombo(combo);
  });

  combo.input.addEventListener("focus", () => {
    renderCombo(combo.name, combo.input.value);
    openCombo(combo);
  });

  combo.input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!combo.field.matches(":focus-within")) closeCombo(combo);
      selectExactMatch(combo);
    }, 120);
  });

  combo.input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCombo(combo);
    if (event.key === "Enter") {
      const firstOption = combo.menu.querySelector(".combo-option");
      if (firstOption) {
        event.preventDefault();
        firstOption.click();
      }
    }
  });

  combo.field.querySelector(".combo-toggle").addEventListener("click", () => {
    if (state.locked && (combo.name === "make" || combo.name === "model")) return;
    renderCombo(combo.name, combo.input.value);
    combo.field.classList.contains("open") ? closeCombo(combo) : openCombo(combo);
    combo.input.focus();
  });
});

segmentedGroups.forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;

    const key = group.dataset.segmented;
    state[key] = button.dataset.value;
    renderSegmentedControls();
    applyAvailabilityState();
    saveDraft();
  });
});

warrantyToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const key = toggle.dataset.toggle;
    state.warranties[key] = !state.warranties[key];
    renderWarrantyToggles();
    saveDraft();
  });
});

hullInput.addEventListener("input", () => {
  clearError(hullField);
  saveDraft();
});

completionDateInput.addEventListener("input", () => {
  state.completionDate = completionDateInput.value.trim();
  saveDraft();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateGeneralInfo()) return;

  state.locked = true;
  saveDraft();
  applyLockedState();
  showStatus(`General Info saved. Listing slug: ${buildSlug()}`);
});

createNew.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  state.locked = false;
  state.condition = "new";
  state.availability = "later";
  state.priceMode = "fixed";
  state.completionDate = "";
  state.warranties = {
    generalWarranty: true,
    engineWarranty: true,
    hullWarranty: true,
    generatorWarranty: true,
  };
  renderSegmentedControls();
  renderWarrantyToggles();
  applyAvailabilityState();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".combo")) {
    Object.values(combos).forEach(closeCombo);
  }
});

document.querySelector(".modal-close").addEventListener("click", closeModelModal);
document.querySelector("[data-cancel-model]").addEventListener("click", closeModelModal);
document.querySelector("[data-create-model]").addEventListener("click", createModel);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModelModal();
});

function renderSegmentedControls() {
  segmentedGroups.forEach((group) => {
    const key = group.dataset.segmented;
    group.querySelectorAll("button[data-value]").forEach((button) => {
      const selected = button.dataset.value === state[key];
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  });

  const priceLabel = document.querySelector(".price-input > span");
  if (priceLabel) {
    priceLabel.textContent = state.priceMode === "range" ? "Price Range*" : "Price*";
  }
}

function applyAvailabilityState() {
  const field = completionDateInput.closest(".calendar-field");
  const isAvailableNow = state.availability === "now";
  completionDateInput.disabled = isAvailableNow;
  field.classList.toggle("is-disabled", isAvailableNow);

  if (isAvailableNow) {
    state.completionDate = "";
    completionDateInput.value = "";
  }
}

function renderWarrantyToggles() {
  warrantyToggles.forEach((toggle) => {
    const key = toggle.dataset.toggle;
    const enabled = Boolean(state.warranties[key]);
    const card = toggle.closest(".warranty-card");
    const dateInput = card.querySelector(".datebox input");

    toggle.classList.toggle("is-off", !enabled);
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.setAttribute("aria-label", `${card.querySelector("p").textContent.trim()} ${enabled ? "enabled" : "disabled"}`);
    card.classList.toggle("is-disabled", !enabled);
    dateInput.disabled = !enabled;
  });
}

function setupCombo(name, config) {
  return { name, ...config };
}

function getMakeGroups(filter = "") {
  const role = currentUser.role.toLowerCase();
  const connected = sortAlpha(connectedBrands).filter(matches(filter));

  if (role === "shipyard" || role === "shipyard-broker") {
    return [{ title: "Connected Brands", options: connected.map((value) => ({ value, connected: true })) }];
  }

  const all = sortAlpha(allBrands)
    .filter((brand) => !connectedBrands.includes(brand))
    .filter(matches(filter));

  return [
    { title: "Connected Brands", options: connected.map((value) => ({ value, connected: true })) },
    { title: "All Brands", options: all.map((value) => ({ value })) },
  ];
}

function getModelGroups(filter = "") {
  if (!state.make) {
    return [{ title: "", options: [], empty: "Select a Make first." }];
  }

  const official = sortAlpha(officialModels[state.make] || []);
  const officialNames = new Set(official.map(normalize));
  const mine = sortAlpha(state.userModels[state.make] || []).filter((model) => !officialNames.has(normalize(model)));

  return [
    { title: "My Created Models", options: mine.filter(matches(filter)).map((value) => ({ value, source: "mine" })) },
    { title: "Models", options: official.filter(matches(filter)).map((value) => ({ value })) },
  ];
}

function getYearGroups(filter = "") {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear + 5; year >= 1850; year -= 1) {
    years.push(String(year));
  }
  return [{ title: "", options: years.filter(matches(filter)).map((value) => ({ value })) }];
}

function renderAllCombos() {
  renderCombo("make");
  renderCombo("model");
  renderCombo("year");
}

function renderCombo(name, filter = "") {
  const combo = combos[name];
  combo.menu.replaceChildren();

  let hasAnyOption = false;
  combo.getGroups(filter).forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "combo-group";

    if (group.title) {
      const title = document.createElement("div");
      title.className = "combo-group-title";
      title.textContent = group.title;
      groupEl.append(title);
    }

    group.options.forEach((option) => {
      hasAnyOption = true;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `combo-option${option.connected ? " connected" : ""}`;
      button.role = "option";
      button.textContent = option.value;

      if (option.source === "mine") {
        const badge = document.createElement("small");
        badge.textContent = "Draft";
        button.append(badge);
      }

      button.addEventListener("click", () => selectOption(combo, option));
      groupEl.append(button);
    });

    if (group.empty) {
      const empty = document.createElement("div");
      empty.className = "combo-empty";
      empty.textContent = group.empty;
      groupEl.append(empty);
    }

    combo.menu.append(groupEl);
  });

  if (name === "model" && state.make) {
    const create = document.createElement("button");
    create.type = "button";
    create.className = "combo-create";
    create.textContent = "+ Create New Model";
    create.addEventListener("click", combo.onCreate);
    combo.menu.append(create);
  }

  if (!hasAnyOption && !combo.menu.querySelector(".combo-empty")) {
    const empty = document.createElement("div");
    empty.className = "combo-empty";
    empty.textContent = "No results found.";
    combo.menu.append(empty);
  }
}

function selectOption(combo, option) {
  combo.input.value = option.value;
  state[combo.name] = option.value;
  clearError(combo.field);
  combo.onSelect(option);
  saveDraft();
  closeCombo(combo);
}

function selectExactMatch(combo) {
  const typed = normalize(combo.input.value);
  if (!typed) return;

  const options = combo.getGroups("").flatMap((group) => group.options);
  const match = options.find((option) => normalize(option.value) === typed);
  if (match) selectOption(combo, match);
}

function openCombo(combo) {
  combo.field.classList.add("open");
  combo.input.setAttribute("aria-expanded", "true");
}

function closeCombo(combo) {
  combo.field.classList.remove("open");
  combo.input.setAttribute("aria-expanded", "false");
}

function openModelModal() {
  if (!state.make) {
    setError(combos.model.field, "Select a Make before creating a model.");
    return;
  }

  modal.hidden = false;
  modalInput.value = "";
  clearError(document.querySelector(".modal-field"));
  setTimeout(() => modalInput.focus(), 0);
}

function closeModelModal() {
  modal.hidden = true;
}

function createModel() {
  const field = document.querySelector(".modal-field");
  const name = modalInput.value.trim();
  clearError(field);

  if (!name) {
    setError(field, "Enter a model name.");
    return;
  }

  const official = officialModels[state.make] || [];
  if (official.some((model) => normalize(model) === normalize(name))) {
    setError(field, "This model already exists as an official shipyard model.");
    return;
  }

  const existingMine = state.userModels[state.make] || [];
  if (existingMine.some((model) => normalize(model) === normalize(name))) {
    setError(field, "You already created this model.");
    return;
  }

  state.userModels[state.make] = sortAlpha([...existingMine, name]);
  localStorage.setItem(modelStorageKey, JSON.stringify(state.userModels));
  state.model = name;
  combos.model.input.value = name;
  renderCombo("model");
  saveDraft();
  closeModelModal();
}

function validateGeneralInfo() {
  let valid = true;
  const hull = hullInput.value.trim();

  clearAllErrors();

  if (!state.make) {
    valid = false;
    setError(combos.make.field, "Make is required.");
  }

  if (!state.model) {
    valid = false;
    setError(combos.model.field, "Model is required.");
  }

  if (!state.year) {
    valid = false;
    setError(combos.year.field, "Year is required.");
  }

  if (!hull) {
    valid = false;
    setError(hullField, "Hull or production number is required.");
  } else if (hull.length > 20) {
    valid = false;
    setError(hullField, "Use 20 characters or fewer.");
  } else if (usedHullNumbers.has(normalize(hull))) {
    valid = false;
    setError(hullField, "Hull or production number already exists. Enter a unique number to continue.");
  }

  return valid;
}

function clearAllErrors() {
  [combos.make.field, combos.model.field, combos.year.field, hullField, document.querySelector(".modal-field")].forEach(clearError);
}

function setError(field, message) {
  field.classList.add("has-error");
  const messageEl = field.querySelector(".field-message");
  if (messageEl) messageEl.textContent = message;
}

function clearError(field) {
  if (!field) return;
  field.classList.remove("has-error");
  const messageEl = field.querySelector(".field-message");
  if (messageEl) messageEl.textContent = "";
}

function applyLockedState() {
  ["make", "model"].forEach((name) => {
    const combo = combos[name];
    combo.input.readOnly = state.locked;
    combo.field.classList.toggle("is-locked", state.locked);
    combo.field.querySelector(".combo-toggle").disabled = state.locked;
  });
}

function saveDraft() {
  const draft = {
    locked: state.locked,
    make: state.make,
    model: state.model,
    year: state.year,
    hull: hullInput.value.trim(),
    condition: state.condition,
    availability: state.availability,
    completionDate: completionDateInput.value.trim(),
    priceMode: state.priceMode,
    warranties: state.warranties,
  };
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

function hydrateDraft() {
  if (new URLSearchParams(window.location.search).get("reset") === "1") {
    localStorage.removeItem(storageKey);
  }

  const draft = JSON.parse(localStorage.getItem(storageKey) || "{}");
  state.locked = Boolean(draft.locked);
  state.make = draft.make || "";
  state.model = draft.model || "";
  state.year = draft.year || "";
  state.condition = draft.condition || "new";
  state.availability = draft.availability || "later";
  state.completionDate = draft.completionDate || "";
  state.priceMode = draft.priceMode || "fixed";
  state.warranties = { ...state.warranties, ...(draft.warranties || {}) };

  combos.make.input.value = state.make;
  combos.model.input.value = state.model;
  combos.year.input.value = state.year;
  hullInput.value = draft.hull || "";
  completionDateInput.value = state.completionDate;
}

function showStatus(message) {
  let status = document.querySelector(".form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    document.querySelector(".actions").after(status);
  }
  status.textContent = message;
}

function readUserModels() {
  const saved = JSON.parse(localStorage.getItem(modelStorageKey) || "{}");
  return Object.fromEntries(
    Object.entries(saved).map(([make, models]) => [make, Array.isArray(models) ? sortAlpha(models) : []]),
  );
}

function buildSlug() {
  return [state.year, state.make, state.model, hullInput.value.trim()].map(slugify).filter(Boolean).join("-");
}

function matches(filter) {
  const query = normalize(filter);
  return (value) => !query || normalize(value).includes(query);
}

function sortAlpha(values) {
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
