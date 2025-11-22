const BASE_URL = 'https://691688f8a7a34288a27d98c0.mockapi.io/books';

/* Get element by id. Throw if not found so errors surface early. */
function getById(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Element not found: #${id}`);
  }
  return el;
}

/* Replace inner HTML of an element. */
function setHTML(el, html) {
  el.innerHTML = html;
}

/* Minimal HTML escaping for safe innerHTML usage. */
function escapeHtml(value) {
  const s = value == null ? '' : `${value}`;
  return s.replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

/*
 * Fetch JSON with basic error normalization.
 * Throws on non-2xx so callers can use try/catch uniformly.
 */
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

/* Show or clear error text in #err-fieldId (if the element exists). */
function showFieldError(fieldId, isOk, message) {
  const errEl = document.getElementById(`err-${fieldId}`);
  if (!errEl) {
    return isOk;
  }
  errEl.textContent = isOk ? '' : message;
  return isOk;
}

/* Read inputs by ids and run simple validation. 
   Returns payload object on success; otherwise returns null and paints errors. */
function readFormAndValidate(ids, prefix) {
  const title = (getById(ids.title).value || '').trim();
  const author = (getById(ids.author).value || '').trim();
  const publisher = (getById(ids.publisher).value || '').trim();
  const yearStr = getById(ids.year).value;
  const pagesStr = getById(ids.pages).value;
  const topics = (getById(ids.topics).value || '').trim();

  const year = yearStr === '' ? null : Number(yearStr);
  const pages = pagesStr === '' ? null : Number(pagesStr);

  let ok = true;
  ok = showFieldError(`${prefix}title`,  title.length >= 3, 'Title: at least 3 characters.') && ok;
  ok = showFieldError(`${prefix}author`, author.length >= 2, 'Author: at least 2 characters.') && ok;


  // Changed after Professor's feedback
  if (year !== null) {
    const currentYear = new Date().getFullYear();
    const validYear = Number.isFinite(year) && year >= 1500 && year <= currentYear;
  
    ok = showFieldError(
      `${prefix}year`,
      validYear,
      `Year: 1500–${currentYear}.`
   ) && ok;

  } else {
   showFieldError(`${prefix}year`, true, '');
  }




  if (pages !== null) {
    const validPages = Number.isFinite(pages) && pages >= 1 && pages <= 5000;
    ok = showFieldError(`${prefix}pages`, validPages, 'Pages: 1–5000.') && ok;
  } else {
    showFieldError(`${prefix}pages`, true, '');
  }

  if (!ok) {
    return null;
  }

  return { title, author, publisher, year, pages, topics };
}

/* ---------- List page — Search + List All (toggle) + Delete ---------- */
async function initListPage() {
  const statusEl  = getById('status');
  const listEl    = getById('list');
  const qInput    = getById('q');
  const btnSearch = getById('btn-search');
  const btnToggle = getById('btn-toggle');

  // Local state
  let itemsCache = null;   // cache "all books" to avoid repeated network calls
  let isOpen = false;      // whether "List All" is currently open

  // Render helpers
  function renderList(items) {
    if (!items || items.length === 0) {
      setHTML(listEl, '');
      setHTML(statusEl, 'No results.');
      return;
    }
  
  // Changed after Professor's feedback
  const html = items.map(function (b) {
    const id    = escapeHtml(`${b.id || ''}`);
    const title = escapeHtml(b.title || '');
    const year  = (b.year != null)
      ? `<span class="year"> · ${escapeHtml(`${b.year}`)}</span>`
      :  '';

    return `
        <li>
        <a class="title" href="./detail.html?id=${id}">${title}</a>${year}
        <span class="inline-actions">
          <a class="button secondary" href="./edit.html?id=${id}">Edit</a>
          <button class="danger btn-delete" data-id="${id}">Delete</button>
        </span>
      </li>`;
  }).join('');


    setHTML(listEl, html);
    setHTML(statusEl, `Loaded ${items.length} item(s).`);
  }

  // Delete with delegation
  listEl.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-delete');
    if (!btn) {
      return;
    }

    const id = btn.getAttribute('data-id') || '';
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (!confirmed) {
      return;
    }

    try {
      await fetchJson(`${BASE_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      // Update local cache
      if (itemsCache) {
        itemsCache = itemsCache.filter(function (b) { return String(b.id) !== String(id); });
      }
      // If list is open, re-render; otherwise clear
      if (isOpen) {
        renderList(itemsCache);
      } else {
        setHTML(listEl, '');
        setHTML(statusEl, 'Deleted. Use “List All” or search again.');
      }
    } catch (err) {
      alert(`Delete failed (${err.message})`);
    }
  });

  // Ensure cache is loaded
  async function ensureAllLoaded() {
    if (itemsCache) {
      return;
    }
    setHTML(statusEl, 'Loading…');
    itemsCache = await fetchJson(BASE_URL);
  }

  // Search by title (client-side filter)
  btnSearch.addEventListener('click', async function () {
    const q = (qInput.value || '').trim().toLowerCase();
    if (!q) {
      setHTML(listEl, '');
      setHTML(statusEl, 'Enter a keyword, then click Search. Or click “List All”.');
      isOpen = false;
      btnToggle.textContent = 'List All';
      return;
    }

    await ensureAllLoaded();
    const filtered = itemsCache.filter(function (b) {
      return (b.title || '').toLowerCase().includes(q);
    });

    isOpen = false;                 // search view is not the "open all" mode
    btnToggle.textContent = 'List All';
    renderList(filtered);
  });

  // List All toggle (open/close)
  btnToggle.addEventListener('click', async function () {
    if (!isOpen) {
      await ensureAllLoaded();
      renderList(itemsCache);
      isOpen = true;
      btnToggle.textContent = 'Hide List';
    } else {
      setHTML(listEl, '');
      setHTML(statusEl, 'List hidden. Click “List All” to show again.');
      isOpen = false;
      btnToggle.textContent = 'List All';
    }
  });

  // Initial hint (no auto-load)
  setHTML(statusEl, 'Use “List All” to show all books, or enter a keyword then click Search.');
}

/* ---------- Detail page (GET one) ---------- */
async function initDetailPage() {
  const container = getById('detail');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    setHTML(container, '<p class="error">Missing id.</p>');
    return;
  }

  setHTML(container, 'Loading…');

  try {
    const b = await fetchJson(`${BASE_URL}/${encodeURIComponent(id)}`);
    const html = `
      <article>
        <h2>${escapeHtml(b.title || '')}</h2>
        <p><strong>Author:</strong> ${escapeHtml(b.author || '') || '—'}</p>
        <p><strong>Publisher:</strong> ${escapeHtml(b.publisher || '') || '—'}</p>
        <p><strong>Year:</strong> ${b.year != null ? escapeHtml(`${b.year}`) : '—'}</p>
        <p><strong>Pages:</strong> ${b.pages != null ? escapeHtml(`${b.pages}`) : '—'}</p>
        <p><strong>Topics:</strong> ${escapeHtml(b.topics || '') || '—'}</p>
      </article>`;
    setHTML(container, html);
  } catch (err) {
    setHTML(container, `<p class="error">Failed to load (${err.message}).</p>`);
  }
}

/* ---------- Create page (POST) ---------- */
function initCreatePage() {
  const form = getById('create-form');
  const statusEl = getById('create-status');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setHTML(statusEl, '');

    const payload = readFormAndValidate(
      { title: 'title', author: 'author', publisher: 'publisher', year: 'year', pages: 'pages', topics: 'topics' },
      '' // error id prefix
    );

    if (!payload) {
      setHTML(statusEl, '<span class="error">Please fix the errors above.</span>');
      return;
    }

    try {
      setHTML(statusEl, 'Submitting…');
      await fetchJson(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setHTML(statusEl, '<span class="success">Created. Back to list…</span>');
      setTimeout(function () {
        location.href = './index.html';
      }, 500);
    } catch (err) {
      setHTML(statusEl, `<span class="error">Create failed (${err.message}).</span>`);
    }
  });
}

/* ---------- Edit page (GET prefill + PUT) ---------- */
async function initEditPage() {
  const form = getById('edit-form');
  const statusEl = getById('edit-status');

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) {
    setHTML(statusEl, '<span class="error">Missing id.</span>');
    return;
  }

  try {
    setHTML(statusEl, 'Loading…');
    const b = await fetchJson(`${BASE_URL}/${encodeURIComponent(id)}`);

    getById('edit-id').value = b.id || '';
    getById('edit-title').value = b.title || '';
    getById('edit-author').value = b.author || '';
    getById('edit-publisher').value = b.publisher || '';
    getById('edit-year').value = b.year != null ? `${b.year}` : '';
    getById('edit-pages').value = b.pages != null ? `${b.pages}` : '';
    getById('edit-topics').value = b.topics || '';

    setHTML(statusEl, 'Ready.');
  } catch (err) {
    setHTML(statusEl, `<span class="error">Failed to load (${err.message}).</span>`);
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setHTML(statusEl, '');

    const payload = readFormAndValidate(
      { title: 'edit-title', author: 'edit-author', publisher: 'edit-publisher', year: 'edit-year', pages: 'edit-pages', topics: 'edit-topics' },
      'edit-'
    );

    if (!payload) {
      setHTML(statusEl, '<span class="error">Please fix the errors above.</span>');
      return;
    }

    try {
      setHTML(statusEl, 'Saving…');
      await fetchJson(`${BASE_URL}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setHTML(statusEl, '<span class="success">Updated. Back to list…</span>');
      setTimeout(function () {
        location.href = './index.html';
      }, 500);
    } catch (err) {
      setHTML(statusEl, `<span class="error">Update failed (${err.message}).</span>`);
    }
  });
}

/* ---------- Page Router ---------- */
window.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('page-list'))   { initListPage(); }
  if (document.getElementById('page-detail')) { initDetailPage(); }
  if (document.getElementById('page-create')) { initCreatePage(); }
  if (document.getElementById('page-edit'))   { initEditPage(); }
});
