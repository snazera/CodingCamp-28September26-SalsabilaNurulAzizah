# Design Document — Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a zero-dependency, single-page web application that runs entirely in the browser. There is no server, no build step, and no framework. The entire program lives in three files:

```
index.html      — page structure and CDN script tags
css/style.css   — all visual styling and responsive layout
js/script.js    — all application logic
```

The application works by keeping one central "source of truth" — an in-memory JavaScript array called `transactions`. Every user action (adding a transaction, deleting a transaction, loading the page) goes through a predictable cycle:

1. **Update data** — modify the `transactions` array
2. **Save to storage** — write the updated array to Local Storage
3. **Re-render the UI** — read from the `transactions` array and redraw the page

This "update → save → render" pattern means every part of the UI always reflects the same underlying data. If the `transactions` array is correct, the page will look correct.

### What the app does

- Lets users enter expenses (name, amount, category)
- Validates form input before accepting a transaction
- Saves all transactions to browser Local Storage so data survives page refresh
- Displays a scrollable list of all transactions with a delete button on each
- Shows a running total balance
- Renders a live pie chart (Chart.js) breaking spending down by category

---

## Architecture

Because this is a plain HTML/CSS/JS app with no framework, there is no router, no component tree, and no virtual DOM. Instead, the architecture is organised around three simple responsibilities:

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  ┌──────────┐   events   ┌──────────────────────────┐   │
│  │   DOM    │ ─────────► │    js/script.js          │   │
│  │ (HTML)   │            │                          │   │
│  │          │ ◄───────── │  ┌────────────────────┐  │   │
│  └──────────┘  renders   │  │  State (array)     │  │   │
│                          │  │  transactions = [] │  │   │
│  ┌──────────┐            │  └────────┬───────────┘  │   │
│  │ Chart.js │ ◄───────── │           │               │   │
│  │ (CDN)    │  chart API │  ┌────────▼───────────┐  │   │
│  └──────────┘            │  │  Local Storage     │  │   │
│                          │  └────────────────────┘  │   │
│                          └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Three layers:**

| Layer | File | Responsibility |
|---|---|---|
| Structure | `index.html` | Declares all HTML elements; loads Chart.js from CDN |
| Style | `css/style.css` | Layout, colours, responsive breakpoints |
| Logic | `js/script.js` | All data management, validation, rendering, event handling |

### Key architectural decisions

**Why no framework?** The target audience is beginner developers learning how the web works. Vanilla JS forces direct interaction with the DOM, events, and storage — skills that transfer to any framework later.

**Why re-render on every change?** Rather than making targeted DOM patches, the renderer rebuilds the transaction list and recalculates everything from the `transactions` array on each change. This is slightly less efficient than targeted updates but is far simpler to understand, debug, and maintain at this scale.

**Why Local Storage?** It requires no server, no API, and no authentication. It is synchronous and always available in a modern browser, making it ideal for a zero-backend project.

---

## Components and Interfaces

"Components" in this app are JavaScript functions — not UI framework components. Each function has one clear job.

### State

```js
// The single source of truth — an array of transaction objects
let transactions = [];

// Reference to the Chart.js instance so we can update it later
let spendingChart = null;
```

### Functions

#### Initialisation

| Function | Purpose |
|---|---|
| `init()` | Entry point. Called on `DOMContentLoaded`. Loads data from storage, renders everything, sets up event listeners. |

#### Storage

| Function | Signature | Purpose |
|---|---|---|
| `loadFromStorage()` | `() → Transaction[]` | Reads the JSON string from Local Storage, parses it, validates each entry, and returns a clean array. Returns `[]` on failure. |
| `saveToStorage(transactions)` | `(Transaction[]) → boolean` | Serialises the array to JSON and writes it to Local Storage. Returns `true` on success, `false` on failure. |

#### Validation

| Function | Signature | Purpose |
|---|---|---|
| `validateForm(name, amount, category)` | `(string, string, string) → ValidationResult` | Checks all three inputs against the rules in Requirements 3. Returns an object describing whether validation passed and any error messages. |

`ValidationResult` shape:
```js
{
  valid: boolean,         // true if all fields pass
  errors: {
    name: string | null,
    amount: string | null,
    category: string | null
  }
}
```

#### Transaction management

| Function | Signature | Purpose |
|---|---|---|
| `createTransaction(name, amount, category)` | `(string, number, string) → Transaction` | Builds a new Transaction object with a generated unique ID. |
| `addTransaction(transaction)` | `(Transaction) → void` | Pushes transaction to the array, saves to storage, triggers a full re-render. |
| `deleteTransaction(id)` | `(string) → void` | Filters the transaction out of the array, saves to storage, triggers a full re-render. |

#### Rendering

| Function | Purpose |
|---|---|
| `render()` | Master render function. Calls `renderTransactionList()`, `renderBalance()`, and `renderChart()` in sequence. Called after every state change. |
| `renderTransactionList()` | Clears the `<ul>` in the Transactions section and rebuilds it from the current `transactions` array. Shows the empty-state message when the array is empty. |
| `renderBalance()` | Calculates the sum of all amounts and updates the Balance_Display element. |
| `renderChart()` | Aggregates amounts by category, then either creates or updates the Chart.js pie chart instance. |

#### Utilities

| Function | Purpose |
|---|---|
| `generateId()` | Returns a unique string ID for a new transaction (e.g. using `Date.now()` combined with `Math.random()`). |
| `formatCurrency(amount)` | Formats a number as `$1,234.56` (two decimal places, currency symbol). |
| `truncateText(text, maxLength)` | Truncates a string to `maxLength` characters, appending `…` if truncated. Used for display names. |
| `displayError(message)` | Shows a dismissible error banner at the top of the page. |
| `clearErrors()` | Removes all visible validation error messages from the form. |
| `displayValidationErrors(errors)` | Renders per-field validation error messages beneath each input. |

#### Chart.js bridge

| Function | Purpose |
|---|---|
| `getCategoryTotals()` | Aggregates the `transactions` array into a map of `{ category → total amount }`. Returns an object used by `renderChart()`. |
| `initChart(canvas)` | Creates the Chart.js pie chart instance on first render and stores it in `spendingChart`. |
| `updateChart(categoryTotals)` | If `spendingChart` already exists, updates its data and calls `.update()` on the instance instead of recreating it. |

### Event listeners

All event listeners are registered once inside `init()`.

| Event | Element | Handler behaviour |
|---|---|---|
| `DOMContentLoaded` | `document` | Calls `init()` |
| `submit` | `<form>` | Reads inputs, validates, calls `addTransaction()` on success |
| `click` | Transactions `<ul>` (delegated) | Checks if the clicked element is a delete button; calls `deleteTransaction()` with the ID stored in `data-id` |

> **Event delegation** on the `<ul>` means we attach one listener to the parent list rather than one per transaction item. This is important because transaction items are added and removed dynamically — listeners attached to individual items would be lost on re-render.

---

## Data Models

### Transaction object

This is the central data structure. Every expense is stored as one of these objects.

```js
{
  id: "1718000000000-0.123456789",   // string — unique identifier
  name: "Coffee",                    // string — item name, max 100 chars
  amount: 4.50,                      // number — positive, 0.01–999999999.99
  category: "Food"                   // string — "Food" | "Transport" | "Fun"
}
```

**Field details:**

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `string` | Unique, non-empty | Generated from timestamp + random number. Never editable. |
| `name` | `string` | 1–100 chars, not whitespace-only | Stored as entered. Display may truncate to 50 chars. |
| `amount` | `number` | 0.01 – 999,999,999.99 | Stored as a JavaScript `number`. Never negative. |
| `category` | `string` | `"Food"` \| `"Transport"` \| `"Fun"` | Fixed enum. Any other value is treated as `"Other"` only for chart display. |

### Storage schema

The `transactions` array is serialised as a JSON string and stored under a fixed key:

```js
const STORAGE_KEY = "expense_budget_transactions";

// What gets written to Local Storage:
localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

// Example stored value:
// '[{"id":"...","name":"Coffee","amount":4.5,"category":"Food"},...]'
```

**On load**, the app reads this string, parses it with `JSON.parse()`, and validates each entry. Entries missing required fields or having wrong types are silently discarded with a warning message shown to the user (Requirement 9.6).

### Category colour map

Chart colours are defined as a constant so they never change between renders (Requirement 8.3):

```js
const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56",
  Other:     "#9966FF"
};
```

### ValidationResult object

Returned by `validateForm()` — not stored anywhere, only used transiently during form submission.

```js
{
  valid: true,
  errors: {
    name: null,
    amount: null,
    category: null
  }
}

// Example of a failed validation:
{
  valid: false,
  errors: {
    name: "Item Name is required.",
    amount: null,
    category: "Please select a category."
  }
}
```

---

## DOM Structure Overview

Below is the HTML skeleton that `index.html` will implement. Every element with an `id` is referenced by `js/script.js`.

```html
<body>
  <!-- Page title — Requirement 1.1 -->
  <h1>Expense & Budget Visualizer</h1>

  <!-- Error banner — shown/hidden programmatically -->
  <div id="error-banner" class="error-banner hidden"></div>

  <!-- Balance Display — Requirement 1.2, 7 -->
  <section id="balance-section">
    <h2>Total Balance</h2>
    <p id="balance-display">$0.00</p>
  </section>

  <!-- Add Transaction Form — Requirement 2, 3 -->
  <section id="form-section">
    <form id="transaction-form" novalidate>
      <div class="form-group">
        <label for="input-name">Item Name</label>
        <input type="text" id="input-name" maxlength="100" />
        <span class="error-msg" id="error-name"></span>
      </div>
      <div class="form-group">
        <label for="input-amount">Amount</label>
        <input type="number" id="input-amount" min="0.01" max="999999999.99" step="0.01" />
        <span class="error-msg" id="error-amount"></span>
      </div>
      <div class="form-group">
        <label for="input-category">Category</label>
        <select id="input-category">
          <option value="" disabled selected>Select a category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Fun">Fun</option>
        </select>
        <span class="error-msg" id="error-category"></span>
      </div>
      <button type="submit">Add Transaction</button>
    </form>
  </section>

  <!-- Two-column section — Requirement 1.4, 1.5, 1.6 -->
  <div class="two-column-layout">

    <!-- Transactions List — Requirement 5, 6 -->
    <section id="transactions-section">
      <h2>Transactions</h2>
      <ul id="transaction-list">
        <!-- Transaction items inserted here by renderTransactionList() -->
        <!-- Empty state shown when list is empty: -->
        <!-- <li class="empty-state">No transactions recorded yet.</li> -->
      </ul>
    </section>

    <!-- Chart — Requirement 8 -->
    <section id="chart-section">
      <h2>Spending by Category</h2>
      <canvas id="spending-chart"></canvas>
      <p id="chart-empty-msg" class="hidden">No data to display.</p>
    </section>

  </div>

  <!-- Chart.js from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- App logic — loaded after Chart.js -->
  <script src="js/script.js"></script>
</body>
```

**Why `novalidate` on the form?** It disables the browser's built-in validation popups so our custom validation messages (Requirement 3) show in the UI instead.

**Why is Chart.js loaded before `script.js`?** The `script.js` file references `Chart` (the global Chart.js constructor). If `script.js` loaded first, `Chart` would be undefined.

---

## Responsive Layout Approach

The two-column / stacked layout is handled entirely in CSS using Flexbox.

### Two-column layout (≥ 768px)

```css
.two-column-layout {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

.two-column-layout > section {
  flex: 1;        /* each section takes 50% of the available width */
  min-width: 0;   /* prevents flex children from overflowing */
}
```

### Stacked layout (< 768px)

```css
@media (max-width: 767px) {
  .two-column-layout {
    flex-direction: column;
  }

  .two-column-layout > section {
    width: 100%;
  }
}
```

### Scrollable transaction list

When there are many transactions, the list scrolls within its column without resizing the layout:

```css
#transaction-list {
  max-height: 400px;   /* or a vh-based value */
  overflow-y: auto;
}
```

---

## Chart.js Integration

Chart.js is loaded from a CDN and exposes a global `Chart` constructor. The integration requires careful handling of the chart lifecycle.

### Why lifecycle management matters

Chart.js attaches state to the `<canvas>` element. If you call `new Chart(canvas, config)` twice on the same canvas without destroying the previous instance, you get a "Canvas is already in use" error. The solution is to keep a reference to the chart instance and update it rather than recreating it.

### Chart initialisation and update flow

```
First render (transactions exist):
  getCategoryTotals() → { Food: 12.50, Fun: 8.00 }
  initChart(canvas) → creates spendingChart instance
  spendingChart.data.labels = ["Food", "Fun"]
  spendingChart.data.datasets[0].data = [12.50, 8.00]
  spendingChart.update()

Subsequent renders:
  getCategoryTotals() → { Food: 17.00, Fun: 8.00, Transport: 5.00 }
  updateChart(totals)  → modifies spendingChart.data in place
  spendingChart.update() → Chart.js animates to new values

Empty state:
  spendingChart exists → destroy() it
  spendingChart = null
  Show #chart-empty-msg
```

### Chart configuration

```js
{
  type: "pie",
  data: {
    labels: [],          // populated from getCategoryTotals()
    datasets: [{
      data: [],          // amounts in matching order to labels
      backgroundColor: [] // colours from CATEGORY_COLORS
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "bottom" }
    }
  }
}
```

### Offline / CDN failure handling

If Chart.js fails to load (no network), `Chart` will be undefined. The `renderChart()` function checks for this:

```js
function renderChart() {
  if (typeof Chart === "undefined") {
    displayError("Chart.js could not be loaded. Please check your network connection.");
    return;
  }
  // ... rest of chart logic
}
```

This satisfies Requirement 10.6.

---

## Local Storage Read / Write Strategy

### Writing

Every time `transactions` changes (add or delete), the entire array is serialised and overwritten:

```js
function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (e) {
    // Storage quota exceeded or storage is blocked
    displayError("Your data could not be saved. Storage may be full or unavailable.");
    return false;
  }
}
```

This is simpler than patching individual items and safe for the small data sizes expected in this app.

### Reading

On page load, `loadFromStorage()` performs three steps:

1. **Read** — `localStorage.getItem(STORAGE_KEY)` returns a string or `null`
2. **Parse** — `JSON.parse()` converts the string to an array; if it throws, the data is corrupted (Requirement 9.5)
3. **Validate** — each entry is checked for required fields and correct types; malformed entries are dropped with a warning (Requirement 9.6)

```js
function isValidTransaction(entry) {
  return (
    typeof entry.id === "string" && entry.id.length > 0 &&
    typeof entry.name === "string" && entry.name.trim().length > 0 &&
    typeof entry.amount === "number" && entry.amount > 0 &&
    typeof entry.category === "string" && entry.category.length > 0
  );
}
```

### Storage key

```js
const STORAGE_KEY = "expense_budget_transactions";
```

A single, stable key name ensures there are no naming conflicts across page refreshes.

---

## Event Flow Descriptions

### Flow 1: Adding a Transaction

```
User fills form → clicks "Add Transaction"
        │
        ▼
  form "submit" event fires
        │
        ▼
  Read values from DOM:
    name     = input#input-name.value.trim()
    amount   = parseFloat(input#input-amount.value)
    category = select#input-category.value
        │
        ▼
  validateForm(name, amount, category)
        │
    ┌───┴────────────────────────────────────┐
    │ invalid                                │ valid
    ▼                                        ▼
  displayValidationErrors(result.errors)  clearErrors()
  STOP                                    createTransaction(name, amount, category)
                                               → { id, name, amount, category }
                                          transactions.push(newTransaction)
                                          saveToStorage(transactions)
                                               │
                                           ┌───┴───────────┐
                                           │ fail           │ success
                                           ▼               ▼
                                       displayError()   form.reset()
                                       keep in memory   render()
                                                            │
                                                            ▼
                                                   renderTransactionList()
                                                   renderBalance()
                                                   renderChart()
```

### Flow 2: Deleting a Transaction

```
User clicks delete button on a transaction item
        │
        ▼
  click event bubbles to <ul> (event delegation)
        │
        ▼
  Check: event.target matches "[data-delete-id]"?
        │
    ┌───┴──────────────────────┐
    │ no                       │ yes
    ▼                          ▼
  ignore               id = event.target.dataset.deleteId
                       transactions = transactions.filter(t => t.id !== id)
                       success = saveToStorage(transactions)
                               │
                           ┌───┴───────────┐
                           │ fail           │ success
                           ▼               ▼
                  rollback in-memory    render()
                  displayError()           │
                                           ▼
                                  renderTransactionList()
                                  renderBalance()
                                  renderChart()
```

### Flow 3: Page Load

```
Browser opens index.html
        │
        ▼
  Chart.js CDN script loads → Chart global available
  js/script.js loads
        │
        ▼
  DOMContentLoaded fires → init()
        │
        ▼
  loadFromStorage()
        │
    ┌───┬───────────────────────────────────────┐
    │   │                                       │
    │ null (no data)   parse error         valid JSON
    │   │                   │                   │
    ▼   ▼                   ▼                   ▼
  transactions = []  transactions = []   validate each entry
  show $0.00          displayError()      drop malformed entries
  empty chart         show $0.00          (warn if any dropped)
                      empty chart         transactions = validEntries
                                               │
                                               ▼
                                   render()
                                       │
                                       ▼
                               renderTransactionList()
                               renderBalance()
                               renderChart()
        │
        ▼
  Register event listeners:
    form "submit" → add transaction handler
    ul "click"    → delete transaction handler (delegated)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid name inputs are always rejected

*For any* string that is either (a) composed entirely of whitespace characters (spaces, tabs, newlines), or (b) longer than 100 characters, the `validateForm()` function SHALL return `{ valid: false }` and the transaction SHALL NOT be added to the `transactions` array.

**Validates: Requirements 3.1, 3.2**

---

### Property 2: Out-of-range amount inputs are always rejected

*For any* amount value that falls outside the valid range of 0.01 to 999,999,999.99 — including zero, negative numbers, and values exceeding the maximum — the `validateForm()` function SHALL return `{ valid: false }` and the transaction SHALL NOT be added to the `transactions` array.

**Validates: Requirements 3.3, 3.4, 3.5**

---

### Property 3: Valid inputs always produce a correctly shaped transaction

*For any* combination of a valid name (1–100 non-whitespace-only characters), a valid amount (0.01–999,999,999.99), and a valid category ("Food", "Transport", or "Fun"), `validateForm()` SHALL return `{ valid: true }` and `createTransaction()` SHALL return a Transaction object containing those exact values plus a non-empty unique `id`.

**Validates: Requirements 3.7, 4.1**

---

### Property 4: Transaction serialisation is a round-trip

*For any* array of valid Transaction objects, serialising the array to a JSON string and then deserialising and validating each entry SHALL produce an array equivalent to the original — same length, and same `id`, `name`, `amount`, and `category` on each entry.

**Validates: Requirements 4.3, 9.1, 9.2, 9.6**

---

### Property 5: Storage loading discards only malformed entries

*For any* JSON array that mixes well-formed Transaction objects with entries that have missing or incorrectly typed fields, `loadFromStorage()` SHALL return an array containing all and only the well-formed entries, discarding every malformed entry.

**Validates: Requirements 9.5, 9.6**

---

### Property 6: Balance always equals the sum of all amounts

*For any* `transactions` array, the total calculated by the balance logic SHALL equal the arithmetic sum of every `amount` field across all Transaction objects in the array, formatted to two decimal places with a currency symbol — regardless of whether transactions are being added, deleted, or loaded from storage.

**Validates: Requirements 1.2, 7.2, 7.3, 7.4**

---

### Property 7: Category totals are consistent with the full transaction total

*For any* `transactions` array, `getCategoryTotals()` SHALL return an object whose values (the per-category subtotals) sum to exactly the same value as the sum of all `amount` fields in the `transactions` array. Transactions with a category other than "Food", "Transport", or "Fun" SHALL be accumulated under an "Other" key.

**Validates: Requirements 8.2, 8.7**

---

### Property 8: Adding a transaction grows the list by exactly one

*For any* starting `transactions` array and any valid Transaction object, calling `addTransaction()` SHALL produce a `transactions` array whose length is exactly one greater than before, and which contains the newly added transaction at the last position.

**Validates: Requirements 4.2, 5.2**

---

### Property 9: Deleting a transaction removes exactly one entry

*For any* `transactions` array that contains at least one entry, and any transaction `id` that exists within that array, calling `deleteTransaction(id)` SHALL produce a new array whose length is exactly one less than the original, with no entry matching that `id` — while all other entries remain unchanged.

**Validates: Requirements 6.2, 6.5**

---

## Error Handling

### Categories of errors

| Error type | When it occurs | User-visible response |
|---|---|---|
| Validation error | Invalid form input on submit | Per-field error messages beneath inputs; form not submitted |
| Storage write failure | `localStorage.setItem()` throws | Banner error message; transaction kept in memory only |
| Storage read / parse failure | Corrupted JSON in Local Storage | Banner error message; app starts with empty state |
| Malformed stored entries | Valid JSON but invalid transaction fields | Banner warning; bad entries skipped, valid entries loaded |
| Chart.js not loaded | CDN unreachable, no network | Banner error message in chart section |

### Error display strategy

- **Validation errors** appear as small text directly beneath their input field. They are cleared when the form is successfully submitted or when the user begins typing in the affected field.
- **Application errors** (storage, CDN) appear in a dismissible banner at the top of the page.
- Errors never block the user from reading their existing data or using the app in a degraded state.

---

## Testing Strategy

### Overall approach

This app is primarily composed of DOM manipulation, event handling, and third-party library calls — categories where property-based testing has limited applicability. The core testable logic (validation, balance calculation, serialisation, data manipulation) is implemented as pure functions that can be tested in isolation.

**Testing layers:**

1. **Unit tests** — pure functions with no DOM or storage dependency
2. **Property-based tests** — universally quantified properties on pure logic functions
3. **Integration tests** — full page interaction via browser or DOM-emulating test runner

### Unit tests (example-based)

These cover specific scenarios and edge cases:

| Function | Test cases |
|---|---|
| `validateForm()` | Empty name, whitespace-only name, name > 100 chars, empty amount, amount = 0, amount < 0, amount > max, no category, all valid |
| `createTransaction()` | Returns object with correct shape; `id` is unique across two calls |
| `formatCurrency()` | `4.5` → `"$4.50"`, `1000` → `"$1,000.00"`, `0` → `"$0.00"` |
| `truncateText()` | Text shorter than limit unchanged; text at limit unchanged; text over limit truncated with `…` |
| `getCategoryTotals()` | Empty array returns `{}`; mixed categories return correct sums |
| `loadFromStorage()` | Null storage returns `[]`; corrupted JSON returns `[]`; valid JSON returns parsed array; mixed valid/invalid entries returns only valid |
| `isValidTransaction()` | Each field missing individually; wrong type for each field; all valid |

### Property-based tests

Property-based tests are appropriate for the pure logic functions identified in the Correctness Properties section. Use a JavaScript property-based testing library such as [fast-check](https://fast-check.dev/) configured to run a minimum of 100 iterations per property.

Each test MUST include a comment tag referencing its design property:
`// Feature: expense-budget-visualizer, Property N: <property text>`

| Property | Function under test | Generator strategy |
|---|---|---|
| Property 1: Invalid name inputs rejected | `validateForm()` | Generate whitespace-only strings; generate strings with length > 100 |
| Property 2: Out-of-range amounts rejected | `validateForm()` | Generate numbers ≤ 0 and numbers > 999,999,999.99 |
| Property 3: Valid inputs produce correct transaction | `validateForm()` + `createTransaction()` | Generate valid (name, amount, category) triples |
| Property 4: Serialisation round-trip | `loadFromStorage()` + JSON round-trip | Generate arrays of valid Transaction objects |
| Property 5: Storage discards only malformed entries | `loadFromStorage()` | Generate arrays mixing valid and invalid entries |
| Property 6: Balance equals sum of all amounts | Balance calculation logic | Generate arrays of transactions with random amounts |
| Property 7: Category totals consistent with total | `getCategoryTotals()` | Generate arrays with random category distributions including unknown categories |
| Property 8: Addition grows list by exactly one | `addTransaction()` | Generate starting arrays + valid Transaction objects to add |
| Property 9: Deletion removes exactly one entry | `deleteTransaction()` | Generate arrays with ≥1 item + pick random existing ID to delete |

### Integration tests

These verify the full user-facing behaviour in a real or emulated browser environment:

- Add a valid transaction → appears in list, balance updates, chart updates
- Add a transaction → refresh page → transaction reappears (Local Storage persistence)
- Delete a transaction → list shrinks, balance recalculates, chart updates
- Add with invalid form → error messages appear, no transaction added
- Load page with corrupted Local Storage → error banner shown, app starts clean
- Load page with no network (Chart.js unavailable) → error shown in chart area
- Add multiple transactions across all three categories → pie chart shows three segments

### Test runner recommendation

For unit and property tests, [Vitest](https://vitest.dev/) is a lightweight, zero-config test runner that works without a build step when used with `--environment jsdom`. Run tests with:

```
npx vitest --run
```

This runs once (no watch mode) and exits with a pass/fail result.
