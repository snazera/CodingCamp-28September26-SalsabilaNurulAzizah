# Requirements Document

## Introduction

The **Expense & Budget Visualizer** is a beginner-friendly, single-page web application that helps users track their personal spending. Users can add and delete expense transactions, see a running total balance, and view their spending broken down by category in a pie chart. All data is saved in the browser using Local Storage so that transactions persist across page refreshes. The application is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks or backend required.

This document defines the functional requirements for the Minimum Viable Product (MVP). Optional features listed in the project brief (custom categories, monthly summaries, sorting, spending limits, dark mode) are explicitly out of scope for this MVP.

---

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single expense record containing an item name, a numeric amount, and a category.
- **Transaction_List**: The in-memory JavaScript array that holds all Transaction objects for the current session.
- **Transaction_Item**: One rendered row in the UI representing a single Transaction.
- **Storage**: The browser's Local Storage API, used to persist Transaction data between page loads.
- **Form**: The HTML form containing the Item Name input, Amount input, Category dropdown, and Add Transaction button.
- **Validator**: The JavaScript logic responsible for checking that Form inputs are complete and valid before a Transaction is created.
- **Balance_Display**: The UI element labelled "Total Balance" that shows the sum of all Transaction amounts.
- **Chart**: The pie chart rendered using Chart.js that displays spending distribution by category.
- **Category**: One of three fixed labels used to classify a Transaction — Food, Transport, or Fun.
- **Renderer**: The JavaScript logic responsible for updating the DOM to reflect the current state of the Transaction_List, Balance_Display, and Chart.

---

## Requirements

---

### Requirement 1: Page Structure and Layout

**User Story:** As a beginner developer, I want a clear, well-structured single-page layout, so that I can understand how the HTML elements are organised and how the page is divided into logical sections.

#### Acceptance Criteria

1. THE App SHALL display a visible page title "Expense & Budget Visualizer" at the top of the page as an h1 heading element.
2. THE App SHALL display a Balance_Display section beneath the page title showing the label "Total Balance" and the current total amount, where the total amount updates to reflect the sum of all recorded transactions.
3. THE App SHALL display a Form section beneath the Balance_Display containing input fields for transaction name, amount, category, and a submit button.
4. THE App SHALL display a Transactions section and a Spending by Category section beneath the Form, where both sections are always visible regardless of whether any transactions have been recorded.
5. WHILE the viewport width is 768px or wider, THE App SHALL display the Transactions section and the Spending by Category section side by side in a two-column layout where each column occupies 50% of the available page width.
6. WHILE the viewport width is less than 768px, THE App SHALL stack the Transactions section above the Spending by Category section vertically, each occupying 100% of the available page width.

---

### Requirement 2: Add Transaction Form

**User Story:** As a user, I want a form with clearly labelled inputs, so that I can enter the name, amount, and category of each expense without confusion.

#### Acceptance Criteria

1. THE Form SHALL contain a text input field labelled "Item Name" for entering the name of the expense, with a maximum length of 100 characters.
2. THE Form SHALL contain a numeric input field labelled "Amount" for entering the cost of the expense, accepting values in the range 0.01 to 999,999,999.99.
3. THE Form SHALL contain a dropdown input labelled "Category" with exactly three options: Food, Transport, and Fun.
4. THE Form SHALL contain a button labelled "Add Transaction" that, when clicked, submits the form data for processing.
5. THE Form SHALL display a non-selectable placeholder option labelled "Select a category" in the Category dropdown as the default state when the page first loads.
6. WHEN a Transaction is successfully added, THE Form SHALL reset all input fields to their empty default state and the Category dropdown to the "Select a category" placeholder.

---

### Requirement 3: Input Validation

**User Story:** As a user, I want to be told when I have forgotten to fill in a field, so that I do not accidentally save an incomplete transaction.

#### Acceptance Criteria

1. WHEN the "Add Transaction" button is clicked and the Item Name field is empty or contains only whitespace, THE Validator SHALL prevent the Transaction from being created and SHALL display a message indicating that the Item Name is required.
2. WHEN the "Add Transaction" button is clicked and the Item Name field contains more than 100 characters, THE Validator SHALL prevent the Transaction from being created and SHALL display a message indicating the maximum character limit.
3. WHEN the "Add Transaction" button is clicked and the Amount field is empty, THE Validator SHALL prevent the Transaction from being created and SHALL display a message indicating that the Amount is required.
4. WHEN the "Add Transaction" button is clicked and the Amount field contains a value that is not greater than 0, THE Validator SHALL prevent the Transaction from being created and SHALL display a message indicating that the Amount must be a positive number.
5. WHEN the "Add Transaction" button is clicked and the Amount field contains a value greater than 999,999,999.99, THE Validator SHALL prevent the Transaction from being created and SHALL display a message indicating the maximum allowed amount.
6. WHEN the "Add Transaction" button is clicked and no Category has been selected, THE Validator SHALL prevent the Transaction from being created and SHALL display a message indicating that a Category is required.
7. WHEN all fields are valid, THE Validator SHALL allow Transaction creation to proceed and SHALL display no validation error messages.

---

### Requirement 4: Creating and Storing a Transaction

**User Story:** As a user, I want my expense to be saved immediately after I submit the form, so that my data is not lost if I refresh the page.

#### Acceptance Criteria

1. WHEN the Validator confirms all fields are valid, THE App SHALL create a Transaction object containing a unique identifier, the Item Name string with a maximum length of 100 characters, the Amount as a positive number in the range 0.01 to 999,999,999.99, and the Category string.
2. WHEN a Transaction object is created, THE App SHALL add it to the Transaction_List.
3. WHEN the Transaction_List is updated, THE App SHALL serialise the Transaction_List and save it to Storage under a consistent key name.
4. IF serialisation or the Storage write operation fails, THEN THE App SHALL retain the Transaction in the Transaction_List in memory and display an error message indicating that the data could not be persisted.
5. WHEN a Transaction is successfully saved to Storage, THE Renderer SHALL add a new Transaction_Item to the Transactions section of the page without requiring a full page reload.
6. WHEN a Transaction is successfully saved, THE Form SHALL clear all input fields and reset the Category dropdown to its default prompt state.

---

### Requirement 5: Displaying the Transaction List

**User Story:** As a user, I want to see all my recorded expenses in a list, so that I can review what I have spent money on.

#### Acceptance Criteria

1. THE Renderer SHALL display each Transaction in the Transaction_List as a Transaction_Item showing the item name truncated to a maximum of 50 characters for display, the amount formatted as a non-negative currency value with 2 decimal places and a currency symbol, and the category label.
2. THE App SHALL render Transaction_Items in the order they were added, with the most recently added item appearing last.
3. WHILE the number of Transaction_Items exceeds the visible height of the Transactions section, THE App SHALL make the Transactions section scrollable so that all items are accessible without resizing the layout.
4. WHEN the Transaction_List is empty, THE Renderer SHALL display a placeholder message in the Transactions section indicating that no transactions have been recorded yet, in place of the Transaction_Item list.
5. IF a Transaction in the Transaction_List has a missing or empty item name, amount, or category label, THEN THE Renderer SHALL display a fallback indicator (e.g. "—") for each missing field in place of the missing value.

---

### Requirement 6: Deleting a Transaction

**User Story:** As a user, I want to remove a transaction I added by mistake, so that my balance and chart stay accurate.

#### Acceptance Criteria

1. THE Renderer SHALL display a delete button alongside each Transaction_Item in the Transactions section.
2. WHEN the delete button of a Transaction_Item is clicked, THE App SHALL remove the corresponding Transaction from the Transaction_List.
3. WHEN a Transaction is removed from the Transaction_List, THE App SHALL update Storage to reflect the new Transaction_List.
4. WHEN a Transaction is removed from the Transaction_List, THE Renderer SHALL remove the corresponding Transaction_Item from the Transactions section without requiring a full page reload.
5. WHEN a Transaction is removed from the Transaction_List, THE Renderer SHALL recalculate and update the Balance_Display and Chart to reflect the updated Transaction_List.
6. IF Storage fails to update after a Transaction is removed, THEN THE App SHALL retain the Transaction in the Transaction_List and display an error message indicating the deletion could not be saved.

---

### Requirement 7: Total Balance Calculation

**User Story:** As a user, I want to see my total spending update automatically whenever I add or delete a transaction, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL initialise the Balance_Display to 0.00 when no transactions exist.
2. WHEN a Transaction is added to the Transaction_List, THE App SHALL recalculate the total by summing the Amount of every Transaction in the Transaction_List and SHALL update the Balance_Display with the new total.
3. WHEN a Transaction is removed from the Transaction_List, THE App SHALL recalculate the total by summing the Amount of every remaining Transaction and SHALL update the Balance_Display with the new total.
4. THE Balance_Display SHALL present the total amount formatted to two decimal places with a currency symbol.
5. IF the calculated total is negative, THEN THE App SHALL still display the value formatted to two decimal places with the currency symbol, indicating a negative balance without treating it as an error state.

---

### Requirement 8: Spending by Category Chart

**User Story:** As a user, I want to see a pie chart that shows how my spending is split across categories, so that I can understand my spending habits at a glance.

#### Acceptance Criteria

1. THE App SHALL render a pie chart in the "Spending by Category" section using the Chart.js library loaded from a CDN.
2. THE Chart SHALL display one segment per Category for which at least one Transaction exists in the Transaction_List, where each segment's size is calculated as that Category's total amount divided by the sum of all Transaction amounts, rounded to two decimal places.
3. THE Chart SHALL assign a distinct colour to each of the three Categories such that no two Categories share the same colour and each Category always renders with the same colour on every render.
4. WHEN a Transaction is added to the Transaction_List, THE Renderer SHALL update the Chart to reflect the new spending distribution without requiring a full page reload.
5. WHEN a Transaction is removed from the Transaction_List, THE Renderer SHALL update the Chart to reflect the new spending distribution without requiring a full page reload.
6. WHEN the Transaction_List is empty, THE Chart SHALL display a placeholder message indicating there is no data, and no segments SHALL be rendered.
7. IF a Transaction's Category does not match Food, Transport, or Fun, THEN THE Chart SHALL group that Transaction's amount into an "Other" segment with its own distinct colour.

---

### Requirement 9: Data Persistence on Page Load

**User Story:** As a user, I want my previously recorded transactions to reappear when I reopen or refresh the page, so that I do not have to re-enter data I have already saved.

#### Acceptance Criteria

1. WHEN the App is loaded in the browser, THE App SHALL read the serialised Transaction_List from Storage.
2. WHEN a serialised Transaction_List is found in Storage, THE App SHALL deserialise it and load it into the in-memory Transaction_List within 500 milliseconds of page load.
3. WHEN the Transaction_List is loaded from Storage, THE Renderer SHALL render all Transaction_Items, update the Balance_Display, and render the Chart to reflect the persisted data.
4. WHEN no data is found in Storage, THE App SHALL initialise with an empty Transaction_List, a Balance_Display showing 0.00, and an empty Chart state.
5. IF the data retrieved from Storage cannot be parsed as valid JSON, THEN THE App SHALL discard the corrupted data, initialise with an empty Transaction_List, and display an error message indicating that previous data could not be loaded.
6. IF the data retrieved from Storage is valid JSON but contains Transaction entries with missing or incorrectly typed fields, THEN THE App SHALL discard only the malformed entries, load all valid entries into the Transaction_List, and display a warning message indicating that some previous data could not be recovered.

---

### Requirement 10: File Structure and Technology Constraints

**User Story:** As a beginner developer, I want the project to follow a simple, predictable file structure, so that I can easily find and understand each file's purpose.

#### Acceptance Criteria

1. THE App SHALL be implemented using exactly one HTML file (`index.html`), one CSS file (`css/style.css`), and one JavaScript file (`js/script.js`), with no additional HTML, CSS, or JavaScript files present in the project.
2. THE App SHALL use only HTML, CSS, and Vanilla JavaScript as implementation languages — no JavaScript frameworks or UI libraries other than Chart.js are permitted.
3. THE App SHALL load Chart.js from a public CDN link declared in `index.html` and SHALL NOT bundle or download Chart.js as a local file.
4. THE App SHALL require no build tools, package managers, or server — it SHALL run correctly when `index.html` is opened directly in a modern web browser (Chrome, Firefox, Edge, or Safari in their latest stable versions at time of development).
5. THE App SHALL store all CSS in `css/style.css` with no inline `<style>` blocks and no inline `style` attributes in the HTML, so that styles remain easy to read and modify.
6. IF `index.html` is opened directly in a browser without an active network connection, THEN THE App SHALL display an error message indicating that Chart.js could not be loaded and that a network connection is required for the chart to function.
