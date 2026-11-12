"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const source = document.querySelector("#source");
  const destination = document.querySelector("#destination");
  const swap = document.querySelector("[data-swap]");
  if (swap && source && destination) {
    swap.addEventListener("click", () => {
      const current = source.value;
      source.value = destination.value;
      destination.value = current;
    });
  }

  const date = document.querySelector("[data-future-date]");
  if (date) {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    date.min = today;
  }

  document.querySelectorAll("[data-confirm-cancel]").forEach(form => {
    form.addEventListener("submit", event => {
      if (!window.confirm("Cancel this booking? This action cannot be undone.")) event.preventDefault();
    });
  });

  const map = document.querySelector("#seat-map");
  const seatInput = document.querySelector("#seat_number");
  if (!map || !seatInput) return;
  const capacity = Math.max(0, Math.min(500, Number.parseInt(map.dataset.capacity || "0", 10) || 0));
  let booked = [];
  try { booked = JSON.parse(map.dataset.bookedSeats || "[]"); } catch (_) { booked = []; }
  const unavailable = new Set(booked.map(Number));
  map.replaceChildren();
  let selected = null;
  const seatButtons = new Map();

  function chooseSeat(number) {
    if (!Number.isInteger(number) || number < 1 || number > capacity || unavailable.has(number)) {
      seatInput.setCustomValidity("Please choose an available seat.");
      return;
    }
    seatInput.setCustomValidity("");
    selected = number;
    seatInput.value = String(number);
    seatButtons.forEach((button, id) => {
      const active = id === number;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  const columns = 4;
  const rows = Math.ceil(capacity / columns);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < 5; column++) {
      if (column === 2) {
        const aisle = document.createElement("span");
        aisle.className = "aisle";
        aisle.setAttribute("aria-hidden", "true");
        map.append(aisle);
        continue;
      }
      const seatPosition = column > 2 ? column - 1 : column;
      const number = row * columns + seatPosition + 1;
      if (number > capacity) {
        map.append(document.createElement("span"));
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "seat";
      button.textContent = String(number);
      button.setAttribute("aria-label", "Seat " + number + (unavailable.has(number) ? ", taken" : ", available"));
      button.setAttribute("aria-pressed", "false");
      button.disabled = unavailable.has(number);
      button.addEventListener("click", () => chooseSeat(number));
      seatButtons.set(number, button);
      map.append(button);
    }
  }
  seatInput.addEventListener("input", () => {
    const n = Number(seatInput.value);
    if (seatInput.value === "") {
      selected = null;
      seatInput.setCustomValidity("");
      seatButtons.forEach(button => { button.classList.remove("selected"); button.setAttribute("aria-pressed", "false"); });
    } else if (Number.isInteger(n) && n >= 1 && n <= capacity && !unavailable.has(n)) {
      chooseSeat(n);
    } else {
      selected = null;
      seatInput.setCustomValidity("Please choose an available seat.");
      seatButtons.forEach(button => { button.classList.remove("selected"); button.setAttribute("aria-pressed", "false"); });
    }
  });
});