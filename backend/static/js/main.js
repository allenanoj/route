// Small enhancements only. Booking and database operations remain in Flask.
document.addEventListener('DOMContentLoaded', () => {
  const source = document.getElementById('source');
  const destination = document.getElementById('destination');
  const swap = document.querySelector('[data-swap]');
  if (source && destination && swap) {
    swap.addEventListener('click', () => {
      const previousSource = source.value;
      source.value = destination.value;
      destination.value = previousSource;
    });
  }

  // Local date, rather than UTC, avoids accidentally excluding today.
  const today = new Date();
  const localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  document.querySelectorAll('[data-future-date]').forEach(input => {
    input.min = localToday;
  });

  // Render a real seat map from Flask's existing trip capacity and booked seats.
  const seatMap = document.getElementById('seat-map');
  const seatInput = document.getElementById('seat_number');
  if (seatMap && seatInput) {
    const capacity = Number(seatMap.dataset.capacity);
    let booked = [];
    try { booked = JSON.parse(seatMap.dataset.bookedSeats || '[]').map(Number); }
    catch (_) { booked = []; }
    const bookedSet = new Set(booked);
    const seatButtons = [];

    if (Number.isSafeInteger(capacity) && capacity >= 1 && capacity <= 200) {
      seatMap.replaceChildren();
      let selectedSeat = null;
      const selectSeat = (number) => {
        if (bookedSet.has(number)) return;
        selectedSeat = number;
        seatInput.value = number;
        for (const button of seatButtons) {
          const active = Number(button.dataset.number) === number;
          button.classList.toggle('is-selected', active);
          button.setAttribute('aria-pressed', String(active));
        }
      };

      for (let row = 0; row < Math.ceil(capacity / 4); row++) {
        for (let column = 0; column < 5; column++) {
          if (column === 2) {
            const aisle = document.createElement('span');
            aisle.className = 'seat-gap';
            aisle.setAttribute('aria-hidden', 'true');
            seatMap.appendChild(aisle);
            continue;
          }
          const number = row * 4 + column + (column > 2 ? 0 : 1);
          if (number > capacity) {
            const empty = document.createElement('span');
            empty.className = 'seat-placeholder-cell';
            seatMap.appendChild(empty);
            continue;
          }
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'seat-button' + (bookedSet.has(number) ? ' is-booked' : '');
          button.dataset.number = String(number);
          button.textContent = String(number);
          button.setAttribute('aria-label', `Seat ${number}${bookedSet.has(number) ? ' (booked)' : ' (available)'}`);
          button.setAttribute('aria-pressed', 'false');
          button.disabled = bookedSet.has(number);
          button.addEventListener('click', () => selectSeat(number));
          seatButtons.push(button);
          seatMap.appendChild(button);
        }
      }
      seatInput.addEventListener('input', () => {
        const number = Number(seatInput.value);
        if (Number.isInteger(number) && number >= 1 && number <= capacity && !bookedSet.has(number)) {
          selectSeat(number);
        } else {
          selectedSeat = null;
          for (const button of seatButtons) { button.classList.remove('is-selected'); button.setAttribute('aria-pressed', 'false'); }
        }
      });
      const bookingForm = document.getElementById('booking-form');
      bookingForm?.addEventListener('submit', event => {
        const number = Number(seatInput.value);
        if (!Number.isInteger(number) || number < 1 || number > capacity || bookedSet.has(number)) {
          event.preventDefault();
          seatInput.setCustomValidity('Please choose an available seat.');
          seatInput.reportValidity();
        }
      });
      seatInput.addEventListener('input', () => seatInput.setCustomValidity(''));
    }
  }

  // The server still checks which booking belongs to the submitted user.
  document.querySelectorAll('[data-confirm-cancel]').forEach(form => {
    form.addEventListener('submit', event => {
      if (!window.confirm('Cancel this booking? This action cannot be undone.')) event.preventDefault();
    });
  });
});
