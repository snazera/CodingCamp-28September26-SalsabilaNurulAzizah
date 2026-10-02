# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a zero-dependency, single-page expense tracker using plain HTML, CSS, and Vanilla JavaScript. The implementation follows a strict bottom-up order: scaffold the project, lay down the HTML skeleton, add CSS layout and styles, then implement JavaScript in layers (constants → storage → validation → transaction logic → rendering → event wiring). Property-based tests are added alongside the functions they verify so bugs are caught early.

---

## Tasks

- [x] 1. Scaffold project structure and create empty files
  - Create the directory `css/` inside the project root
  - Create the directory `js/` inside the project root
  - Create `index.html` as an empty file (content added in Task 2)
  - Create `css/style.css` as an empty file (content added in Task 3)
  - Create `js/script.js` as an empty file (content added in Tasks 4–9)
  - _Requirements: 10.1_

- [x] 2. Build the HTML skeleton in `index.html`
  - [x] 2.1 Add the HTML boilerplate, page title, and CDN script tags
    - Write the `<!DOCTYPE html>` declaration, `<html>`, `<head>`, and `<body>` tags
    - Add `<title>Expense & Budget Visualizer</title>` in `<head>`
    - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
    - Add `<h1>Expense & Budget Visualizer</h1>` as the first element in `<body>`
    - Add `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` before the closing `</body>` tag
    - Add `<script src="js/script.js"></script>` immediately after the Chart.js script tag
    - _Requirements: 1.1, 10.1, 10.3, 10.4_

  - [x] 2.2 Add the error banner, balance section, and form section
    - Add `<div id="error-banner" class="error-banner hidden"></div>` after the `<h1>`
    - Add the Balance section: `<section id="balance-section">` containing `<h2>Total Balance</h2>` and `<p id="balance-display">$0.00</p>`
    - Add the Form section: `<section id="form-section">` containing `<form id="transaction-form" novalidate>` with:
      - A `.form-group` div for Item Name: `<label for="input-name">`, `<input type="text" id="input-name" maxlength="100">`, and `<span class="error-msg" id="error-name"></span>`
      - A `.form-group` div for Amount: `<label for="input-amount">`, `<input type="number" id="input-amount" min="0.01" max="999999999.99" step="0.01">`, and `<span class="error-msg" id="error-amount"></span>`
      - A `.form-group` div for Category: `<label for="input-category">`, `<select id="input-category">` with a disabled default option and three value options (Food, Transport, Fun), and `<span class="error-msg" id="error-category"></span>`
      - `<button type="submit">Add Transaction</button>`
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Add the two-column layout section with transactions list and chart
    - Add a `<div class="two-column-layout">` wrapper after the form section
    - Inside it, add `<section id="transactions-section">` containing `<h2>Transactions</h2>` and `<ul id="transaction-list"></ul>`
    - Inside it, add `<section id="chart-section">` containing `<h2>Spending by Category</h2>`, `<canvas id="spending-chart"></canvas>`, and `<p id="chart-empty-msg" class="hidden">No data to display.</p>`
    - _Requirements: 1.4, 5.1, 8.1, 8.6_

- [x] 3. Write all CSS in `css/style.css`
  - [x] 3.1 Add base styles and page-wide typography
    - Add a CSS reset (`* { box-sizing: border-box; margin: 0; padding: 0; }`)
    - Set `body` font, background colour, and a max-width container centered with `margin: auto`
    - Style the `h1` heading and `h2` section headings
    - Style the `#error-banner` with a hidden class (`.hidden { display: none; }`) and a visible warning/error state
    - _Requirements: 1.1, 10.5_

  - [x] 3.2 Style the balance section and form
    - Style `#balance-section` and `#balance-display` to stand out (font size, weight, colour)
    - Style `.form-group` with vertical spacing between label, input, and error text
    - Style `input`, `select`, and `button` elements for usability (padding, border, cursor)
    - Style `.error-msg` in red so validation errors are clearly visible
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 3.1_

  - [x] 3.3 Add the responsive two-column layout and scrollable transaction list
    - Implement `.two-column-layout` with `display: flex; flex-direction: row; gap: 1rem;` for ≥ 768px
    - Set `flex: 1; min-width: 0;` on `.two-column-layout > section` so each column takes 50%
    - Add `@media (max-width: 767px)` rule that sets `.two-column-layout` to `flex-direction: column` and each section to `width: 100%`
    - Set `#transaction-list` to `max-height: 400px; overflow-y: auto; list-style: none;` for scrollability
    - _Requirements: 1.4, 1.5, 1.6, 5.3_

  - [x] 3.4 Style individual transaction items and the chart section
    - Style each `li` transaction item with padding and a border or bottom separator
    - Style the delete button as a small, distinct button aligned to the right of the item row
    - Style `.empty-state` text with muted colour and centered alignment
    - Ensure `#spending-chart` and `#chart-section` are responsive (e.g. `max-width: 100%`)
    - _Requirements: 5.1, 6.1, 8.1_

- [x] 4. Implement constants, state variables, and utility functions in `js/script.js`
  - [x] 4.1 Define constants and state variables
    - Declare `const STORAGE_KEY = "expense_budget_transactions";`
    - Declare `const CATEGORY_COLORS = { Food: "#FF6384", Transport: "#36A2EB", Fun: "#FFCE56", Other: "#9966FF" };`
    - Declare `let transactions = [];`
    - Declare `let spendingChart = null;`
    - _Requirements: 4.3, 8.3_

  - [x] 4.2 Implement `generateId()`, `formatCurrency()`, and `truncateText()`
    - Write `generateId()`: returns `Date.now() + "-" + Math.random()` as a string
    - Write `formatCurrency(amount)`: uses `toLocaleString` (or manual formatting) to return `"$1,234.56"` style strings with exactly two decimal places
    - Write `truncateText(text, maxLength)`: returns the text unchanged if `text.length <= maxLength`, otherwise returns `text.slice(0, maxLength) + "…"`
    - _Requirements: 4.1, 5.1_

  - [x] 4.3 Implement `displayError()`, `clearErrors()`, and `displayValidationErrors()`
    - Write `displayError(message)`: sets `textContent` of `#error-banner` to the message and removes the `hidden` class
    - Write `clearErrors()`: adds `hidden` to `#error-banner` and clears the text content of all `.error-msg` spans
    - Write `displayValidationErrors(errors)`: for each key in `errors` (`name`, `amount`, `category`), if the value is non-null, set the corresponding `#error-{field}` span's text to the error message
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.4, 6.6_

- [x] 5. Implement Local Storage read and write functions
  - [x] 5.1 Implement `saveToStorage(transactions)` and `isValidTransaction(entry)`
    - Write `isValidTransaction(entry)`: returns `true` only if all four fields (`id`, `name`, `amount`, `category`) have the correct type and satisfy their constraints (non-empty string id, non-empty trimmed name string, positive number amount, non-empty string category)
    - Write `saveToStorage(transactions)`: wraps `localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))` in a try/catch; calls `displayError()` with a persistence failure message on catch; returns `true` on success, `false` on failure
    - _Requirements: 4.3, 4.4, 6.3, 6.6, 9.6_

  - [x] 5.2 Implement `loadFromStorage()`
    - Write `loadFromStorage()`: calls `localStorage.getItem(STORAGE_KEY)`; returns `[]` if `null`
    - Wrap `JSON.parse()` in try/catch; on error, call `displayError()` with a corrupted-data message and return `[]` (satisfies Requirement 9.5)
    - After parsing, filter the array through `isValidTransaction()`; if any entries were dropped, call `displayError()` with a partial-recovery warning; return the filtered array (satisfies Requirement 9.6)
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6_

  - [ ]* 5.3 Write property test for serialisation round-trip (Property 4)
    - Install Vitest and fast-check as dev dependencies: `npm init -y && npm install --save-dev vitest fast-check`
    - Create `tests/storage.test.js`
    - **Property 4: Transaction serialisation is a round-trip**
    - Generate arrays of valid Transaction objects; serialise to JSON and deserialise through `isValidTransaction()` filter; assert output length equals input length and all fields match
    - **Validates: Requirements 4.3, 9.1, 9.2, 9.6**

  - [ ]* 5.4 Write property test for storage discards only malformed entries (Property 5)
    - Add to `tests/storage.test.js`
    - **Property 5: Storage loading discards only malformed entries**
    - Generate arrays mixing valid Transaction objects with objects that have missing or wrong-typed fields; run through `isValidTransaction()` filter; assert only well-formed entries remain
    - **Validates: Requirements 9.5, 9.6**

- [x] 6. Implement form validation
  - [x] 6.1 Implement `validateForm(name, amount, category)`
    - Check `name`: if empty or whitespace-only → `errors.name = "Item Name is required."`; if length > 100 → `errors.name = "Item Name must be 100 characters or fewer."`
    - Check `amount`: if empty / NaN → `errors.amount = "Amount is required."`; if `<= 0` → `errors.amount = "Amount must be a positive number."`; if `> 999999999.99` → `errors.amount = "Amount must not exceed 999,999,999.99."`
    - Check `category`: if empty or not one of the valid options → `errors.category = "Please select a category."`
    - Return `{ valid: Object.values(errors).every(e => e === null), errors }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 6.2 Write property test for invalid name inputs (Property 1)
    - Create `tests/validation.test.js`
    - **Property 1: Invalid name inputs are always rejected**
    - Generate whitespace-only strings and strings with length > 100; assert `validateForm()` returns `{ valid: false }` for all
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.3 Write property test for out-of-range amount inputs (Property 2)
    - Add to `tests/validation.test.js`
    - **Property 2: Out-of-range amount inputs are always rejected**
    - Generate numbers ≤ 0 and numbers > 999,999,999.99; assert `validateForm()` returns `{ valid: false }` for all
    - **Validates: Requirements 3.3, 3.4, 3.5**

  - [ ]* 6.4 Write property test for valid inputs producing a correct transaction (Property 3)
    - Add to `tests/validation.test.js`
    - **Property 3: Valid inputs always produce a correctly shaped transaction**
    - Generate valid (name, amount, category) triples; assert `validateForm()` returns `{ valid: true }` and `createTransaction()` returns an object with the correct fields plus a non-empty unique `id`
    - **Validates: Requirements 3.7, 4.1**

- [x] 7. Implement transaction creation and management functions
  - [x] 7.1 Implement `createTransaction(name, amount, category)`
    - Return `{ id: generateId(), name, amount: parseFloat(amount), category }`
    - _Requirements: 4.1_

  - [~] 7.2 Implement `addTransaction(transaction)`
    - Push `transaction` onto `transactions`
    - Call `saveToStorage(transactions)`; on failure, call `displayError()` — keep the transaction in memory regardless
    - Call `render()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 7.3 Implement `deleteTransaction(id)`
    - Store the current array as a rollback copy
    - Set `transactions = transactions.filter(t => t.id !== id)`
    - Call `saveToStorage(transactions)`; on failure, restore from rollback copy, call `displayError()`, and return early
    - Call `render()` on success
    - _Requirements: 6.2, 6.3, 6.5, 6.6_

  - [ ]* 7.4 Write property test for addition grows list by exactly one (Property 8)
    - Create `tests/transactions.test.js`
    - **Property 8: Adding a transaction grows the list by exactly one**
    - Generate starting arrays of valid transactions plus a new valid transaction; assert array length increases by exactly one and the new item appears last
    - **Validates: Requirements 4.2, 5.2**

  - [ ]* 7.5 Write property test for deletion removes exactly one entry (Property 9)
    - Add to `tests/transactions.test.js`
    - **Property 9: Deleting a transaction removes exactly one entry**
    - Generate arrays with ≥ 1 transaction; pick a random existing id; assert array length decreases by exactly one and no remaining entry has that id
    - **Validates: Requirements 6.2, 6.5**

- [x] 8. Checkpoint — ensure all existing tests pass
  - Run `npx vitest --run` and verify all property tests from Tasks 5–7 pass before continuing.
  - Ask the user if any tests are failing or any questions arise before moving to rendering.

- [ ] 9. Implement rendering functions
  - [x] 9.1 Implement `getCategoryTotals()` and balance calculation helper
    - Write `getCategoryTotals()`: iterate `transactions`; accumulate amounts per category key; map any category not in `CATEGORY_COLORS` to `"Other"`; return the totals object
    - Write an inline balance calculation (used inside `renderBalance()`): `transactions.reduce((sum, t) => sum + t.amount, 0)`
    - _Requirements: 7.2, 8.2, 8.7_

  - [ ]* 9.2 Write property test for balance equals sum of all amounts (Property 6)
    - Create `tests/rendering.test.js`
    - **Property 6: Balance always equals the sum of all amounts**
    - Generate arrays of transactions with random positive amounts; assert that balance calculation result equals the arithmetic sum of all amounts (within floating-point tolerance)
    - **Validates: Requirements 1.2, 7.2, 7.3, 7.4**

  - [ ]* 9.3 Write property test for category totals consistent with transaction total (Property 7)
    - Add to `tests/rendering.test.js`
    - **Property 7: Category totals are consistent with the full transaction total**
    - Generate arrays with random category distributions including unknown categories; assert that the sum of all values in `getCategoryTotals()` equals the sum of all `amount` fields
    - **Validates: Requirements 8.2, 8.7**

  - [x] 9.4 Implement `renderTransactionList()`
    - Get the `#transaction-list` element
    - If `transactions` is empty, set its `innerHTML` to `<li class="empty-state">No transactions recorded yet.</li>` and return
    - Otherwise, build an HTML string of `<li>` elements, each showing:
      - `truncateText(t.name, 50)` (fallback `"—"` if missing)
      - `formatCurrency(t.amount)` (fallback `"—"` if missing)
      - The category label (fallback `"—"` if missing)
      - A delete button: `<button class="delete-btn" data-delete-id="${t.id}">Delete</button>`
    - Set `#transaction-list.innerHTML` to the built string
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 6.1_

  - [x] 9.5 Implement `renderBalance()`
    - Calculate total from `transactions`
    - Set `#balance-display.textContent = formatCurrency(total)`
    - _Requirements: 1.2, 7.1, 7.2, 7.3, 7.4_

  - [x] 9.6 Implement `initChart(canvas)`, `updateChart(categoryTotals)`, and `renderChart()`
    - Write `initChart(canvas)`: creates a new `Chart` instance with type `"pie"`, empty `labels` and `data`, and `responsive: true; plugins.legend.position: "bottom"` options; stores it in `spendingChart`
    - Write `updateChart(categoryTotals)`: extracts labels and values from the totals object; maps each label to its colour from `CATEGORY_COLORS`; updates `spendingChart.data.labels`, `.data.datasets[0].data`, and `.data.datasets[0].backgroundColor`; calls `spendingChart.update()`
    - Write `renderChart()`: checks `typeof Chart === "undefined"` — if true, call `displayError("Chart.js could not be loaded...")` and return; if `transactions` is empty, destroy existing chart instance, set `spendingChart = null`, and show `#chart-empty-msg`; otherwise hide `#chart-empty-msg`, init or update the chart with `getCategoryTotals()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.3, 10.6_

  - [ ] 9.7 Implement the master `render()` function
    - Write `render()` that calls `renderTransactionList()`, `renderBalance()`, and `renderChart()` in sequence
    - _Requirements: 4.5, 6.4, 6.5, 7.2, 7.3_

- [x] 10. Implement event listeners and `init()` to wire everything together
  - [x] 10.1 Implement the form submit handler
    - Add a `"submit"` event listener to `#transaction-form`
    - Call `event.preventDefault()`
    - Read and trim values from `#input-name`, `#input-amount`, and `#input-category`
    - Call `clearErrors()`
    - Call `validateForm(name, amount, category)`
    - On invalid result: call `displayValidationErrors(result.errors)` and return
    - On valid result: call `createTransaction(name, amount, category)`, then `addTransaction(transaction)`, then `document.getElementById("transaction-form").reset()`
    - _Requirements: 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.5, 4.6_

  - [x] 10.2 Implement the delegated delete click handler
    - Add a `"click"` event listener to `#transaction-list`
    - Check if `event.target` matches `"[data-delete-id]"`; if not, return early
    - Read `id = event.target.dataset.deleteId`
    - Call `deleteTransaction(id)`
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 10.3 Implement `init()` and wire `DOMContentLoaded`
    - Write `init()`:
      - Call `loadFromStorage()` and assign the result to `transactions`
      - Call `render()`
      - Register the form submit listener (Task 10.1)
      - Register the delegated delete listener (Task 10.2)
    - Add `document.addEventListener("DOMContentLoaded", init)` at the bottom of `js/script.js`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 11. Final checkpoint — ensure all tests pass and verify the app end-to-end
  - Run `npx vitest --run` and confirm all property tests pass.
  - Open `index.html` directly in a browser (no server needed) and manually verify: adding a transaction updates the list, balance, and chart; deleting a transaction updates all three; refreshing the page restores saved data; submitting an empty form shows validation errors; the layout is responsive at narrow viewport widths.
  - Ensure all tests pass; ask the user if any questions arise before considering the feature complete.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but running them catches logic bugs early.
- Property tests are placed immediately after the functions they verify — this is intentional so errors surface close to where the code was written.
- Each task references specific requirements for traceability back to the requirements document.
- The test setup (Vitest + fast-check) only needs to be done once in Task 5.3; subsequent test tasks just add new test files or blocks.
- The dependency graph below lists only leaf sub-tasks (decimal-numbered). Top-level tasks and checkpoint tasks are excluded.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.2"] },
    { "id": 2, "tasks": ["2.3", "3.3", "4.3"] },
    { "id": 3, "tasks": ["3.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["5.3", "5.4", "6.2", "6.3", "7.1"] },
    { "id": 6, "tasks": ["6.4", "7.2", "7.3"] },
    { "id": 7, "tasks": ["7.4", "7.5", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["9.5", "9.6"] },
    { "id": 10, "tasks": ["9.7"] },
    { "id": 11, "tasks": ["10.1", "10.2"] },
    { "id": 12, "tasks": ["10.3"] }
  ]
}
```
