const STORAGE_KEY = "vintage-computer-checkouts";

/* ---------- helpers ---------- */

function loadState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- catalog ---------- */

function updateCatalog() {
  const state = loadState();

  document.querySelectorAll(".card").forEach(card => {
    const slug = card.dataset.slug;
    const statusEl = card.querySelector(".status");

    if (!statusEl) return;

    const entry = state[slug];

    if (!entry) {
      statusEl.textContent = "Available";
      statusEl.dataset.state = "available";
      return;
    }

    statusEl.textContent = formatStatus(entry.status);
    statusEl.dataset.state = entry.status;
  });
}

/* ---------- machine page ---------- */

function setupMachinePage() {
  const btn = document.querySelector(".checkout-btn");
  const statusEl = document.querySelector(".status");

  if (!btn || !statusEl) return;

  const slug = btn.dataset.slug;
  const state = loadState();

  function render() {
    const entry = state[slug];

    if (!entry) {
      statusEl.textContent = "Available";
      statusEl.dataset.state = "available";
      btn.textContent = "Check out";
      return;
    }

    statusEl.textContent = formatStatus(entry.status);
    statusEl.dataset.state = entry.status;

    if (entry.status === "checked-out") {
      btn.textContent = "Return";
    } else if (entry.status === "repairing") {
      btn.textContent = "Mark Available";
    }
  }

  btn.addEventListener("click", () => {
    const entry = state[slug];

    if (!entry) {
      state[slug] = { status: "checked-out", date: today() };
    } else if (entry.status === "checked-out") {
      delete state[slug];
    } else if (entry.status === "repairing") {
      delete state[slug];
    }

    saveState(state);
    render();
    updateCatalog();
  });

  render();
}

/* ---------- repair button ---------- */
function setupRepairButton() {
  const btn = document.querySelector(".repair-btn");
  if (!btn) return;

  const slug = btn.dataset.slug;
  const state = loadState();

  btn.addEventListener("click", () => {
    state[slug] = {
      status: "repairing",
      date: today()
    };

    saveState(state);
    updateCatalog();
    location.reload();
  });
}
/* ---------- utilities ---------- */

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatStatus(status) {
  if (status === "checked-out") return "Checked out";
  if (status === "repairing") return "Repairing";
  return "Available";
}

/* ---------- init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateCatalog();
  setupMachinePage();
  setupRepairButton();
});

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
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    if (action === "about") open();
    if (action === "close-about") close();
  });

  overlay.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startMacClock();
  setupAboutDialog();
});
