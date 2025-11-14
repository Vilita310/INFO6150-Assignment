const BASE_URL = 'https://691688f8a7a34288a27d98c0.mockapi.io/books'; // My collection

// ---------- helpers ----------
const $id = (id) => document.getElementById(id);
const setHTML = (el, html) => { el.innerHTML = html; };

function escapeHtml(text) {
  return `${text ?? ''}`.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------- list page ----------
async function initListPage() {
  const statusEl = $id('status');
  const listEl = $id('list');
  const btnSearch = $id('btn-search');
  const btnReset  = $id('btn-reset');
  const qInput    = $id('q');

  async function loadList(queryText = '') {
    setHTML(statusEl, 'Loading…');
    try {
      const data = await fetchJson(BASE_URL);  // GET /books
      const q = (queryText || '').toLowerCase();
      const filtered = q ? data.filter(b => (b.title || '').toLowerCase().includes(q)) : data;

      if (filtered.length === 0) {
        setHTML(listEl, '');
        setHTML(statusEl, 'No results.');
        return;
      }

      const itemsHtml = filtered.map(b => {
        const id = encodeURIComponent(String(b.id)); 
        const title = escapeHtml(b.title ?? '');
        const year = b.year != null ? escapeHtml(String(b.year)) : '';
        return `
          <li>
            <strong><a href="./detail.html?id=${id}">${title}</a></strong>
            ${year ? ` · ${year}` : ''}
          </li>`;
      }).join('');

      setHTML(listEl, itemsHtml);
      setHTML(statusEl, `Loaded ${filtered.length} item(s).`);
    } catch (err) {
      setHTML(listEl, '');
      setHTML(statusEl, `Failed to load list (${err.message})`);
    }
  }

  btnSearch.addEventListener('click', () => loadList(qInput.value));
  btnReset.addEventListener('click', () => { qInput.value = ''; loadList(''); });

  loadList('');
}

// ---------- detail page ----------
async function initDetailPage() {
  const detailEl = $id('detail');
  const params = new URLSearchParams(location.search);
  const idParam = params.get('id');

  if (!idParam) {
    location.href = './index.html';
    return;
  }

  setHTML(detailEl, 'Loading…');
  try {
    const b = await fetchJson(`${BASE_URL}/${encodeURIComponent(idParam)}`); // GET /books/:id
    const html = `
      <article>
        <h2>${escapeHtml(b.title ?? '')}</h2>
        <p><strong>Author:</strong> ${escapeHtml(b.author ?? '') || '—'}</p>
        <p><strong>Publisher:</strong> ${escapeHtml(b.publisher ?? '') || '—'}</p>
        <p><strong>Year:</strong> ${b.year != null ? escapeHtml(String(b.year)) : '—'}</p>
        <p><strong>Pages:</strong> ${b.pages != null ? escapeHtml(String(b.pages)) : '—'}</p>
        <p><strong>Topics:</strong> ${escapeHtml(b.topics ?? '') || '—'}</p>
      </article>`;
    setHTML(detailEl, html);
  } catch (err) {
    setHTML(detailEl, `<p class="error">Failed to load (${err.message})</p>`);
  }
}

// ---------- create page ----------
function initCreatePage() {
  const form = $id('create-form');
  const status = $id('create-status');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    setHTML(status, '');

    const title = ($id('title').value || '').trim();
    const author = ($id('author').value || '').trim();
    const publisher = ($id('publisher').value || '').trim();
    const yearRaw = $id('year').value;
    const pagesRaw = $id('pages').value;
    const topics = ($id('topics').value || '').trim();

    const year = yearRaw === '' ? null : Number(yearRaw);
    const pages = pagesRaw === '' ? null : Number(pagesRaw);

    let ok = true;
    ok &= showFieldRule('title', title.length >= 3 && title.length <= 100, 'Title: 3–100 chars.');
    ok &= showFieldRule('author', author.length >= 2 && author.length <= 60, 'Author: 2–60 chars.');
    ok &= (year === null ? showFieldRule('year', true, '') : showNumberRule('year', year, 1500, 2100));
    ok &= (pages === null ? showFieldRule('pages', true, '') : showNumberRule('pages', pages, 1, 5000));

    if (!ok) { setHTML(status, `<span class="error">Please fix the errors above.</span>`); return; }

    const payload = { title, author, publisher, year, pages, topics };

    try {
      setHTML(status, 'Submitting…');
      await fetchJson(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setHTML(status, `<span class="success">Created. Returning to list…</span>`);
      setTimeout(() => { location.href = './index.html'; }, 600);
    } catch (err) {
      setHTML(status, `<span class="error">Create failed (${err.message}).</span>`);
    }
  });
}

// ---------- validation ----------
function showFieldRule(name, ok, msg) {
  const err = $id(`err-${name}`);
  if (!err) return ok;
  if (ok) { setHTML(err, ''); return true; }
  setHTML(err, msg);
  return false;
}

function showNumberRule(name, value, min, max) {
  const ok = Number.isFinite(value) && value >= min && value <= max;
  return showFieldRule(name, ok, `${name[0].toUpperCase() + name.slice(1)}: ${min}–${max}.`);
}

// ---------- router ----------
window.addEventListener('DOMContentLoaded', () => {
  if ($id('page-list'))   initListPage();
  if ($id('page-detail')) initDetailPage();
  if ($id('page-create')) initCreatePage();
});
