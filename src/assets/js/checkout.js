const STORAGE_KEY = "vintage-computer-checkouts";

/* ---------- helpers ---------- */

function loadCheckouts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveCheckouts(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---------- catalog page ---------- */

function updateCatalogStatuses() {
  const checkouts = loadCheckouts();

  document.querySelectorAll(".card").forEach(card => {
    const slug = card.dataset.slug;
    const statusEl = card.querySelector(".status");

    if (!statusEl) return;

    if (checkouts[slug]?.checkedOut) {
      statusEl.textContent = "Status: Checked out";
      statusEl.classList.add("checked-out");
    } else {
      statusEl.textContent = "Status: Available";
      statusEl.classList.remove("checked-out");
    }
  });
}

/* ---------- machine detail page ---------- */

function setupMachinePage() {
  const btn = document.querySelector(".checkout-btn");
  if (!btn) return;

  const slug = btn.dataset.slug;
  const statusEl = document.querySelector(".status");

  const checkouts = loadCheckouts();

  function render() {
    if (checkouts[slug]?.checkedOut) {
      statusEl.textContent = "Status: Checked out";
      btn.textContent = "Return";
    } else {
      statusEl.textContent = "Status: Available";
      btn.textContent = "Check out";
    }
  }

  btn.addEventListener("click", () => {
    if (checkouts[slug]?.checkedOut) {
      delete checkouts[slug];
    } else {
      checkouts[slug] = {
        checkedOut: true,
        date: new Date().toISOString().split("T")[0]
      };
    }

    saveCheckouts(checkouts);
    render();
  });

  render();
}

/* ---------- init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateCatalogStatuses();
  setupMachinePage();
});
