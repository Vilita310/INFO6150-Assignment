/* INFO 6150 — Jing Cao
   - I try to use async/await + try/catch to handle fetch() (as in our class's slides last week we learned).
   - Build DOM nodes by inserting HTML with insertAdjacentHTML.
   - Keep names descriptive as professor mentioned in the feedback on Thurday, and avoid "var" and unclear part.
   - Cache list data to avoid extra network traffic.
*/

/** Public API base */
const API_BASE = 'https://ghibliapi.vercel.app';

/** Cached list and don't re-fetch for every search (Avoid repeated calls). */
let filmsCache = [];

/** Shorthand to get element by id (as in slides: Query the node first, then fill it) */
const byId = (id) => document.getElementById(id);

/** Write a neutral status message into an element (like “Loading…” / “Failed…”) */
function setStatus(el, message) {
  el.innerHTML = `<p class="empty">${message}</p>`;
}

/** Safe text conversion for templating */
function toText(value) {
  return String(value ?? '');
}

/** MAIN ENTRY — called on page load (similar to class's slides’ init()) */
async function init() {
  // Get references once
  const resultsEl = byId('results');
  const detailsEl = byId('details');

  // Initial placeholders
  setStatus(resultsEl, 'Use “List All” or search by title.');
  setStatus(detailsEl, 'Details will appear here.');

  // Wire the form and “List All” button
  wireUI();
}

/** Wire up form submit and List button once */
function wireUI() {
  const formEl = byId('search-form');
  const listBtn = byId('btn-list');

  listBtn.addEventListener('click', () => listFilms());
  formEl.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const q = byId('q').value.trim();
    searchFilms(q);
  });
}

/** Load all films (from cache or network), then render first 20 for light bandwidth */
async function listFilms() {
  const resultsEl = byId('results');
  const detailsEl = byId('details');

  setStatus(resultsEl, 'Loading films...');
  setStatus(detailsEl, 'Select a film to view details.');

  try {
    const items = await getAllFilms();
    renderFilmList(items.slice(0, 20));
  } catch (err) {
    // Use try/catch with window.alert for user feedback
    console.error(err);
    setStatus(resultsEl, `Failed to load films (${err})`);
    window.alert(`Error loading films: ${err}`);
  }
}

/** Client-side title search to keep it simple */
async function searchFilms(query) {
  const resultsEl = byId('results');
  const detailsEl = byId('details');

  setStatus(resultsEl, 'Searching...');
  setStatus(detailsEl, 'Select a film to view details.');

  try {
    const items = await getAllFilms();
    const q = (query || '').toLowerCase();
    const filtered = items.filter((f) =>
      (f.title || '').toLowerCase().includes(q)
    );
    renderFilmList(filtered.slice(0, 20));
  } catch (err) {
    console.error(err);
    setStatus(resultsEl, `Failed to search (${err})`);
    window.alert(`Search failed: ${err}`);
  }
}

/** Fetch all films once and cache the result (so that do not call the same endpoint twice) */
async function getAllFilms() {
  if (filmsCache.length > 0) return filmsCache;
  const response = await fetch(`${API_BASE}/films`); // fetch() returns a promise
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();               // await response.json()
  filmsCache = Array.isArray(json) ? json : [];
  return filmsCache;
}

/** Render the film list: title + year + “Details” button (like in class slides: insertAdjacentHTML) */
function renderFilmList(items) {
  const resultsEl = byId('results');

  if (!items || items.length === 0) {
    setStatus(resultsEl, 'No films found.');
    return;
  }

  let html = '<h2>Films</h2><ul>';
  for (const film of items) {
    const title = toText(film.title);
    const year = toText(film.release_date);
    const id = toText(film.id);

    html += `
      <li>
        <div>
          <strong>${title}</strong>
          <span class="small">· ${year}</span>
        </div>
        <button class="detail-btn" data-id="${id}" aria-label="Details for ${title}">
          Details
        </button>
      </li>`;
  }
  html += '</ul>';

  resultsEl.innerHTML = html;

  // Attach one click handler per button after HTML is in place
  resultsEl.querySelectorAll('.detail-btn').forEach((btn) => {
    btn.addEventListener('click', () => loadFilmDetail(btn.dataset.id));
  });
}

/** Fetch one film by id and render detail panel */
async function loadFilmDetail(id) {
  const detailsEl = byId('details');
  if (!id) {
    setStatus(detailsEl, 'No ID.');
    return;
  }
  setStatus(detailsEl, 'Loading details...');

  try {
    const response = await fetch(`${API_BASE}/films/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const film = await response.json();
    renderFilmDetail(film);
  } catch (err) {
    console.error(err);
    setStatus(detailsEl, `Failed to load details (${err})`);
    window.alert(`Error loading details: ${err}`);
  }
}

/** Fill the details box */
function renderFilmDetail(film) {
  const detailsEl = byId('details');
  if (!film) {
    setStatus(detailsEl, 'No details.');
    return;
  }

  const {
    title = '',
    release_date: year = '',
    director = '',
    running_time: runningTime = '',
    description = '',
  } = film;

  detailsEl.innerHTML = `
    <h2>Film Detail</h2>
    <p>
      <strong>${toText(title)}</strong>
      <span class="small">· ${toText(year)}</span>
    </p>
    <p class="small">Director: ${toText(director)} · Running time: ${toText(runningTime)} min</p>
    <p>${toText(description)}</p>
  `;
}

window.addEventListener('DOMContentLoaded', init);
