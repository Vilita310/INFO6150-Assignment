# Assignment 9 — Full CRUD Books App (MockAPI)

## API

* Base URL: `https://691688f8a7a34288a27d98c0.mockapi.io/books`
* JSON endpoints used:

  * `GET /books` — list many
  * `GET /books/:id` — get one
  * `POST /books` — create
  * `PUT /books/:id` — update
  * `DELETE /books/:id` — delete

## Pages

* `index.html` — list + search + “List All / Hide List” toggle + create link + edit/delete buttons
* `detail.html` — show one book by `?id=...`
* `create.html` — form to create a new book
* `edit.html` — pre-filled form to edit a book

## What I implemented

* **Declarative rendering**
  Uses `items.map(...).join('')` to produce the full HTML list and replace it once via `innerHTML`. Fewer DOM writes, clearer intent.

* **List All toggle**
  “**List All ↔ Hide List**” expands/collapses the list. The first click loads data and **caches** it (`itemsCache`); later toggles reuse the cache.

* **Search**
  Client-side filtering over the cached list by title (case-insensitive). If the cache is not loaded yet, it loads once and then filters.

* **Create**
  Validates the form, sends `POST /books`, shows a short success message, then returns to the list.

* **Edit**
  On page load: `GET /books/:id` to pre-fill the form. On submit: `PUT /books/:id`. On success, navigates back to the list (which re-renders).

* **Delete**
  Each list item has a Delete button with a confirmation prompt. After `DELETE /books/:id`:

  * If the list is currently expanded, the local cache is updated and the list re-renders immediately.
  * If the list is hidden, the UI is cleared and a message is shown.

* **Readability / style**

  * All `if` statements use braces (no single-line `if`).
  * Compound conditions use logical AND `&&` (not bitwise `&`).
  * String building uses template strings `` `${...}` `` (not `String(...)`).
  * Minimal `escapeHtml()` is used when inserting text with `innerHTML`.
  * Field errors are shown near inputs using `#err-<field>` elements.

## Validation rules (short)

* `title`: ≥ 3 characters
* `author`: ≥ 2 characters
* `year`: optional; if present, must be `1500–2100`
* `pages`: optional; if present, must be `1–5000`

