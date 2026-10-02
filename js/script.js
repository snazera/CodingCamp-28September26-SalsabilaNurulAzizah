// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "expense_budget_transactions";

const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56",
  Other:     "#9966FF"
};

// ─── State ────────────────────────────────────────────────────────────────────

let transactions = [];
let spendingChart = null;

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Generates a unique string ID using the current timestamp and a random number.
 * @returns {string}
 */
function generateId() {
  return Date.now() + "-" + Math.random();
}

/**
 * Formats a number as a USD currency string with exactly two decimal places.
 * e.g. 1234.5 → "$1,234.50"
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return "$" + Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Truncates text to maxLength characters, appending "…" if it was cut.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

// ─── Error Display Functions ──────────────────────────────────────────────────

/**
 * Displays a dismissible error/warning message in the top error banner.
 * Removes the "hidden" class so the banner becomes visible.
 * @param {string} message
 */
function displayError(message) {
  const banner = document.getElementById("error-banner");
  if (!banner) return;
  banner.textContent = message;
  banner.classList.remove("hidden");
}

/**
 * Hides the error banner and clears all per-field validation error messages
 * from every .error-msg span in the form.
 */
function clearErrors() {
  const banner = document.getElementById("error-banner");
  if (banner) {
    banner.classList.add("hidden");
    banner.textContent = "";
  }

  const errorSpans = document.querySelectorAll(".error-msg");
  errorSpans.forEach(function (span) {
    span.textContent = "";
  });
}

/**
 * Renders per-field validation error messages beneath their respective inputs.
 * For each key in the errors object ("name", "amount", "category"), if the
 * value is non-null, the corresponding #error-{field} span is updated.
 * @param {{ name: string|null, amount: string|null, category: string|null }} errors
 */
function displayValidationErrors(errors) {
  Object.keys(errors).forEach(function (field) {
    if (errors[field] !== null) {
      const span = document.getElementById("error-" + field);
      if (span) {
        span.textContent = errors[field];
      }
    }
  });
}

// ─── Storage Functions ────────────────────────────────────────────────────────

/**
 * Returns true only if the given entry has all four required fields with the
 * correct types and constraints:
 *   - id:       non-empty string
 *   - name:     non-empty string after trimming
 *   - amount:   number greater than 0
 *   - category: non-empty string
 * @param {*} entry
 * @returns {boolean}
 */
function isValidTransaction(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.id === "string" && entry.id.length > 0 &&
    typeof entry.name === "string" && entry.name.trim().length > 0 &&
    typeof entry.amount === "number" && entry.amount > 0 &&
    typeof entry.category === "string" && entry.category.length > 0
  );
}

/**
 * Serialises the transactions array to JSON and writes it to Local Storage.
 * Calls displayError() with a persistence failure message if the write fails.
 * @param {Array} transactions
 * @returns {boolean} true on success, false on failure
 */
function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (e) {
    displayError("Your data could not be saved. Storage may be full or unavailable.");
    return false;
  }
}

/**
 * Reads and deserialises the Transaction_List from Local Storage.
 *
 * - If no data is found (null), returns [].
 * - If the data cannot be parsed as valid JSON, calls displayError() with a
 *   corrupted-data message and returns [].
 * - After parsing, filters entries through isValidTransaction(); if any were
 *   dropped, calls displayError() with a partial-recovery warning.
 * - Returns the array of valid transactions.
 *
 * @returns {Array} array of valid Transaction objects (may be empty)
 */
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  // Requirement 9.4 — no data in Storage → start fresh
  if (raw === null) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // Requirement 9.5 — corrupted JSON → discard and show error
    displayError("Your previously saved data could not be loaded because it was corrupted.");
    return [];
  }

  // Guard against non-array stored values
  if (!Array.isArray(parsed)) {
    displayError("Your previously saved data could not be loaded because it was corrupted.");
    return [];
  }

  // Requirement 9.6 — filter out malformed entries
  const valid = parsed.filter(isValidTransaction);
  if (valid.length < parsed.length) {
    displayError("Some of your previously saved transactions could not be recovered due to invalid data.");
  }

  return valid;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ["Food", "Transport", "Fun"];

/**
 * Validates the raw form field values before a Transaction is created.
 *
 * Rules:
 *   name     — required (non-empty after trim); max 100 characters
 *   amount   — required; must be a positive number; max 999,999,999.99
 *   category — must be one of the three fixed options: Food, Transport, Fun
 *
 * @param {string} name
 * @param {string} amount  raw string value from the number input
 * @param {string} category
 * @returns {{ valid: boolean, errors: { name: string|null, amount: string|null, category: string|null } }}
 */
function validateForm(name, amount, category) {
  const errors = { name: null, amount: null, category: null };

  // ── Name validation ────────────────────────────────────────────────────────
  if (typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Item Name is required.";
  } else if (name.trim().length > 100) {
    errors.name = "Item Name must be 100 characters or fewer.";
  }

  // ── Amount validation ──────────────────────────────────────────────────────
  const parsedAmount = parseFloat(amount);
  if (amount === "" || amount === null || amount === undefined || isNaN(parsedAmount)) {
    errors.amount = "Amount is required.";
  } else if (parsedAmount <= 0) {
    errors.amount = "Amount must be a positive number.";
  } else if (parsedAmount > 999999999.99) {
    errors.amount = "Amount must not exceed 999,999,999.99.";
  }

  // ── Category validation ────────────────────────────────────────────────────
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.category = "Please select a category.";
  }

  return {
    valid: Object.values(errors).every(function (e) { return e === null; }),
    errors: errors
  };
}

// ─── Transaction Management ───────────────────────────────────────────────────

/**
 * Creates a new Transaction object from validated form field values.
 * The amount is parsed from a string to a float to ensure numeric storage.
 * @param {string} name     - the expense item name
 * @param {string} amount   - raw string value from the number input
 * @param {string} category - one of "Food", "Transport", or "Fun"
 * @returns {{ id: string, name: string, amount: number, category: string }}
 */
function createTransaction(name, amount, category) {
  return {
    id: generateId(),
    name: name,
    amount: parseFloat(amount),
    category: category
  };
}

/**
 * Adds a transaction to the in-memory list, persists to Local Storage, and
 * re-renders the UI.
 *
 * The transaction is always kept in memory even if the storage write fails;
 * a visible error banner is shown to the user in that case.
 *
 * @param {{ id: string, name: string, amount: number, category: string }} transaction
 */
function addTransaction(transaction) {
  transactions.push(transaction);

  const saved = saveToStorage(transactions);
  if (!saved) {
    displayError("Your transaction was added but could not be saved. It may be lost on refresh.");
  }

  render();
}

/**
 * Removes the transaction with the given id from the in-memory list, persists
 * the updated list to Local Storage, and re-renders the UI.
 *
 * If the Storage write fails the deletion is rolled back (the transaction is
 * restored to its original position in memory) and an error banner is shown.
 *
 * @param {string} id - the unique identifier of the transaction to delete
 */
function deleteTransaction(id) {
  // Keep a rollback copy in case the storage write fails (Req 6.6)
  const rollback = transactions.slice();

  // Remove the matching transaction from the in-memory list (Req 6.2)
  transactions = transactions.filter(function (t) { return t.id !== id; });

  // Persist the updated list (Req 6.3)
  const saved = saveToStorage(transactions);
  if (!saved) {
    // Storage failed — restore the original list and surface the error (Req 6.6)
    transactions = rollback;
    displayError("The transaction could not be deleted because the data could not be saved.");
    return;
  }

  // Re-render balance, transaction list, and chart (Req 6.5)
  render();
}

// ─── Rendering Helpers ────────────────────────────────────────────────────────

/**
 * Aggregates the transactions array into a per-category total map.
 * Any category not present in CATEGORY_COLORS is bucketed under "Other".
 * @returns {{ [category: string]: number }}
 */
function getCategoryTotals() {
  const totals = {};

  transactions.forEach(function (t) {
    // Map unrecognised categories to "Other" (Requirement 8.7)
    const key = Object.prototype.hasOwnProperty.call(CATEGORY_COLORS, t.category)
      ? t.category
      : "Other";

    totals[key] = (totals[key] || 0) + t.amount;
  });

  return totals;
}

// ─── Rendering Functions ──────────────────────────────────────────────────────

/**
 * Rebuilds the transaction list in the DOM from the current transactions array.
 * Shows an empty-state message when there are no transactions (Requirement 5.4).
 * Each item shows the name, formatted amount, category, and a delete button
 * (Requirements 5.1, 5.2, 5.5, 6.1).
 */
function renderTransactionList() {
  const list = document.getElementById("transaction-list");
  if (!list) return;

  if (transactions.length === 0) {
    list.innerHTML = '<li class="empty-state">No transactions recorded yet.</li>';
    return;
  }

  const html = transactions.map(function (t) {
    // Use fallback "—" for any missing display field (Requirement 5.5)
    const displayName     = t.name     ? truncateText(t.name, 50) : "—";
    const displayAmount   = (t.amount !== undefined && t.amount !== null)
      ? formatCurrency(t.amount)
      : "—";
    const displayCategory = t.category ? t.category : "—";

    return (
      '<li class="transaction-item">' +
        '<span class="transaction-name">'     + displayName     + '</span>' +
        '<span class="transaction-amount">'   + displayAmount   + '</span>' +
        '<span class="transaction-category">' + displayCategory + '</span>' +
        '<button class="delete-btn" data-delete-id="' + t.id + '">Delete</button>' +
      '</li>'
    );
  }).join("");

  list.innerHTML = html;
}

/**
 * Recalculates the total balance from the transactions array and updates the
 * Balance_Display element (Requirements 7.1, 7.2, 7.3, 7.4).
 */
function renderBalance() {
  const display = document.getElementById("balance-display");
  if (!display) return;

  // Inline balance calculation: sum all amounts
  const total = transactions.reduce(function (sum, t) {
    return sum + t.amount;
  }, 0);

  display.textContent = formatCurrency(total);
}

/**
 * Creates a new Chart.js pie chart on the given canvas element and stores the
 * instance in spendingChart (Requirement 8.1, 8.3).
 * @param {HTMLCanvasElement} canvas
 */
function initChart(canvas) {
  spendingChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

/**
 * Updates the existing Chart.js instance in-place with new category data
 * (Requirement 8.4, 8.5). Avoids recreating the canvas so Chart.js does not
 * throw a "Canvas is already in use" error.
 * @param {{ [category: string]: number }} categoryTotals
 */
function updateChart(categoryTotals) {
  const labels = Object.keys(categoryTotals);
  const data   = labels.map(function (label) { return categoryTotals[label]; });
  const colors = labels.map(function (label) {
    return CATEGORY_COLORS[label] || CATEGORY_COLORS["Other"];
  });

  spendingChart.data.labels                       = labels;
  spendingChart.data.datasets[0].data             = data;
  spendingChart.data.datasets[0].backgroundColor  = colors;
  spendingChart.update();
}

/**
 * Manages the full lifecycle of the spending pie chart.
 *
 * - If Chart.js failed to load from CDN, shows an error and returns (Req 10.6).
 * - If the transaction list is empty, destroys any existing chart instance and
 *   shows the empty-state message (Requirement 8.6).
 * - Otherwise, hides the empty-state message and either creates the chart for
 *   the first time or updates the existing one (Requirements 8.1–8.5, 8.7).
 */
function renderChart() {
  // Guard: Chart.js must be available (Requirement 10.6)
  if (typeof Chart === "undefined") {
    displayError("Chart.js could not be loaded. Please check your network connection.");
    return;
  }

  const canvas   = document.getElementById("spending-chart");
  const emptyMsg = document.getElementById("chart-empty-msg");

  if (transactions.length === 0) {
    // Destroy the existing chart instance so the canvas can be reused later
    if (spendingChart !== null) {
      spendingChart.destroy();
      spendingChart = null;
    }
    if (emptyMsg) emptyMsg.classList.remove("hidden");
    return;
  }

  // There are transactions — hide the empty message
  if (emptyMsg) emptyMsg.classList.add("hidden");

  const totals = getCategoryTotals();

  if (spendingChart === null) {
    // First render with data — create the chart instance
    initChart(canvas);
  }

  // Update (or populate for the first time) the chart data
  updateChart(totals);
}

// ─── Master Render ────────────────────────────────────────────────────────────

/**
 * Master render function. Called after every state change (add, delete, load).
 * Delegates to the three sub-renderers in sequence so the entire UI stays in
 * sync with the transactions array (Requirements 4.5, 6.4, 6.5, 7.2, 7.3).
 */
function render() {
  renderTransactionList();
  renderBalance();
  renderChart();
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Delegated click handler for the #transaction-list <ul> element.
 *
 * Uses event delegation so a single listener covers all delete buttons,
 * including those rendered after the initial page load.
 *
 * Steps:
 *  1. Check whether the clicked element carries a data-delete-id attribute.
 *     If not, the click was not on a delete button — return early.
 *  2. Read the transaction id from the dataset.
 *  3. Call deleteTransaction(id) to remove it from state, Storage, and the DOM.
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 *
 * @param {Event} event - the "click" event bubbled up to #transaction-list
 */
function handleDeleteClick(event) {
  // Guard: only act when a delete button (with data-delete-id) was clicked
  if (!event.target.matches("[data-delete-id]")) return;

  const id = event.target.dataset.deleteId;
  deleteTransaction(id);
}

/**
 * Handles form submission for adding a new transaction.
 *
 * Steps:
 *  1. Prevent the browser's default form submit behaviour.
 *  2. Read and trim the current input values from the DOM.
 *  3. Clear any previously displayed errors.
 *  4. Validate the inputs with validateForm().
 *  5a. If invalid — render per-field error messages and return early.
 *  5b. If valid   — create a Transaction, add it to the list, reset the form.
 *
 * Requirements: 2.4, 2.6, 3.1–3.7, 4.5, 4.6
 *
 * @param {Event} event - the "submit" event fired by #transaction-form
 */
function handleFormSubmit(event) {
  event.preventDefault();

  // Read raw values from the DOM inputs
  const name     = document.getElementById("input-name").value.trim();
  const amount   = document.getElementById("input-amount").value.trim();
  const category = document.getElementById("input-category").value;

  // Clear any previous error messages before re-validating (Req 3.7)
  clearErrors();

  // Validate all three fields
  const result = validateForm(name, amount, category);

  if (!result.valid) {
    // Surface per-field error messages and abort (Requirements 3.1–3.6)
    displayValidationErrors(result.errors);
    return;
  }

  // All inputs are valid — create and register the transaction (Req 4.1, 4.2)
  const transaction = createTransaction(name, amount, category);
  addTransaction(transaction);

  // Reset the form to its empty default state (Requirements 2.6, 4.6)
  document.getElementById("transaction-form").reset();
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Application entry point. Called once on DOMContentLoaded.
 *
 * Responsibilities:
 *  1. Load any persisted transactions from Local Storage and populate the
 *     in-memory state (Requirements 9.1, 9.2).
 *  2. Perform an initial render so the UI reflects the loaded data — or shows
 *     the empty state if no data exists (Requirements 9.3, 9.4).
 *  3. Attach the form submit listener and the delegated delete listener so the
 *     app responds to user interaction.
 */
function init() {
  // Req 9.1 / 9.2 — read and deserialise the Transaction_List from Storage
  transactions = loadFromStorage();

  // Req 9.3 / 9.4 — render the full UI with whatever data was loaded
  render();

  // Wire up the form submission handler (Task 10.1)
  const form = document.getElementById("transaction-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Wire up the delegated delete button handler (Task 10.2)
  const list = document.getElementById("transaction-list");
  if (list) {
    list.addEventListener("click", handleDeleteClick);
  }
}

// Kick off the application only after the DOM is fully parsed (Req 9.1)
document.addEventListener("DOMContentLoaded", init);
