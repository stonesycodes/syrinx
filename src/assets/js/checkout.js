const STORAGE_KEY = "vintage-computer-checkouts";

/* ---------- storage helpers ---------- */
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- status helpers ---------- */
function today() {
  return new Date().toISOString().split("T")[0];
}

function normalizeStatus(status) {
  if (status === "checked-out" || status === "repairing" || status === "available") return status;
  return "available";
}

function formatStatus(status) {
  if (status === "checked-out") return "Checked out";
  if (status === "repairing") return "Repairing";
  return "Available";
}

function getStatusForSlug(state, slug) {
  const entry = state[slug];
  if (!entry) return "available";
  return normalizeStatus(entry.status);
}

function setStatusForSlug(state, slug, status) {
  status = normalizeStatus(status);

  if (status === "available") {
    // available is represented by absence of entry (keeps storage small)
    delete state[slug];
    return;
  }

  state[slug] = { status, date: today() };
}

/* ---------- catalog ---------- */
function updateCatalog(state = loadState()) {
  document.querySelectorAll(".card[data-slug]").forEach((card) => {
    const slug = card.dataset.slug;
    const statusEl = card.querySelector(".status");
    if (!slug || !statusEl) return;

    const status = getStatusForSlug(state, slug);
    statusEl.textContent = formatStatus(status);
    statusEl.dataset.state = status;
  });
}

/* ---------- machine page UI ---------- */
function updateMachineUI(slug, state) {
  const statusEl = document.querySelector(".status");
  if (statusEl) {
    const status = getStatusForSlug(state, slug);
    statusEl.textContent = formatStatus(status);
    statusEl.dataset.state = status;
  }

  // Optional checkout button (if you still use it)
  const checkoutBtn = document.querySelector(".checkout-btn[data-slug]:not(.status-toggle)");
  if (checkoutBtn) {
    const status = getStatusForSlug(state, slug);
    // If repairing, disable checkout/return
    if (status === "repairing") {
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add("checked-out");
      checkoutBtn.textContent = "Repairing";
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove("checked-out");
      checkoutBtn.textContent = (status === "checked-out") ? "Return" : "Check out";
    }
  }

  // Toggle buttons
  const btnAvail = document.querySelector(`.status-toggle[data-slug="${slug}"][data-toggle="available"]`);
  const btnRepair = document.querySelector(`.status-toggle[data-slug="${slug}"][data-toggle="repairing"]`);

  const current = getStatusForSlug(state, slug);

  if (btnAvail) {
    let label = "Mark Available";
    let pressed = false;
    let disabled = false;

    if (current === "available") {
      label = "Check Out";
    } else if (current === "checked-out") {
      label = "Return";
      pressed = true;
    } else if (current === "repairing") {
      disabled = true;
    }

    btnAvail.classList.toggle("is-on", pressed);
    btnAvail.textContent = label;
    btnAvail.setAttribute("aria-pressed", pressed ? "true" : "false");
    btnAvail.disabled = disabled;
  }

  if (btnRepair) {
    const on = current === "repairing";
    btnRepair.classList.toggle("is-on", on);
    btnRepair.textContent = on ? "Repaired" : "Mark As Repairing";
    btnRepair.setAttribute("aria-pressed", on ? "true" : "false");
    btnRepair.disabled = current === "checked-out";
  }
}

/* ---------- machine page behaviors ---------- */
function setupMachinePage() {
  // Determine slug from any button that carries it
  const slugCarrier =
    document.querySelector(".status-toggle[data-slug]") ||
    document.querySelector(".checkout-btn[data-slug]");

  if (!slugCarrier) return;

  const slug = slugCarrier.dataset.slug;
  let state = loadState();

  // Initial render
  updateMachineUI(slug, state);
  updateCatalog(state);

  // Checkout/Return (optional button)
  const checkoutBtn = document.querySelector(".checkout-btn[data-slug]:not(.status-toggle)");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      state = loadState();

      const current = getStatusForSlug(state, slug);
      // If repairing, do nothing
      if (current === "repairing") return;

      // Toggle checked-out <-> available
      const next = (current === "checked-out") ? "available" : "checked-out";
      setStatusForSlug(state, slug, next);
      saveState(state);

      updateMachineUI(slug, state);
      updateCatalog(state);
    });
  }

  // Status toggles (Available / Repairing)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".status-toggle");
    if (!btn) return;

    const btnSlug = btn.dataset.slug;
    const which = btn.dataset.toggle;
    if (!btnSlug || btnSlug !== slug) return;

    state = loadState();
    const current = getStatusForSlug(state, slug);

    let next = current;

    if (which === "available") {
      // Toggle available on/off:
      // - if already available -> fallback to checked-out
      // - else -> set available (clears repairing/checked-out)
      next = (current === "available") ? "checked-out" : "available";
    }

    if (which === "repairing") {
      // Toggle repairing on/off:
      // - if already repairing -> set available
      // - else -> set repairing
      next = (current === "repairing") ? "available" : "repairing";
    }

    setStatusForSlug(state, slug, next);
    saveState(state);

    updateMachineUI(slug, state);
    updateCatalog(state);
  });
}

/* ---------- menu bar (on-click) ---------- */
function setupMenuBar() {
  const menus = document.querySelectorAll(".menu-wrap");
  if (!menus.length) return;

  function closeAll() {
    menus.forEach((m) => m.classList.remove("open"));
  }

  menus.forEach((menu) => {
    const trigger = menu.querySelector(".menu-btn, .menu-label");
    if (!trigger) return;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = menu.classList.contains("open");
      closeAll();
      if (!wasOpen) menu.classList.add("open");
    });
  });

  document.addEventListener("click", closeAll);
}

/* ---------- clock ---------- */
function startMacClock() {
  const el = document.getElementById("mac-clock");
  if (!el) return;

  function update() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  update();
  setInterval(update, 60_000);
}

/* ---------- about dialog ---------- */
function setupAboutDialog() {
  const overlay = document.getElementById("about-overlay");
  const dialog = document.getElementById("about-dialog");
  if (!overlay || !dialog) return;

  function open() {
    overlay.hidden = false;
    dialog.hidden = false;
  }

  function close() {
    overlay.hidden = true;
    dialog.hidden = true;
  }

  document.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.getAttribute("data-action");
    if (action === "about") open();
    if (action === "close-about") close();
  });

  overlay.addEventListener("click", () => close());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Paint catalog immediately
  updateCatalog();

  // Machine page + toggles
  setupMachinePage();

  // UI chrome
  startMacClock();
  setupAboutDialog();
  setupMenuBar();
});
