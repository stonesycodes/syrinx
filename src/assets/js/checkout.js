document.addEventListener("DOMContentLoaded", () => {
  const checkedOut =
    JSON.parse(localStorage.getItem("checkedOut")) || {};

  // --- Update catalog cards ---
  document.querySelectorAll(".card").forEach(card => {
    const slug = card.dataset.slug;
    const status = card.querySelector(".status");

    if (!status) return;

    if (checkedOut[slug]) {
      status.textContent = "Status: Checked out";
    } else {
      status.textContent = "Status: Available";
    }
  });

  // --- Machine detail page ---
  const button = document.querySelector(".checkout-btn");
  const detailStatus = document.getElementById("checkout-status");

  if (!button) return;

  const slug = button.dataset.slug;

  function updateDetail() {
    if (checkedOut[slug]) {
      button.textContent = "Return";
      detailStatus.textContent = "Status: Checked out";
    } else {
      button.textContent = "Checkout";
      detailStatus.textContent = "Status: Available";
    }
  }

  button.addEventListener("click", () => {
    if (checkedOut[slug]) {
      delete checkedOut[slug];
    } else {
      checkedOut[slug] = {
        date: new Date().toISOString()
      };
    }

    localStorage.setItem("checkedOut", JSON.stringify(checkedOut));
    updateDetail();
  });

  updateDetail();
});
