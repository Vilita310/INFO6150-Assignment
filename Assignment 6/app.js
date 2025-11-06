var API = 'https://ghibliapi.vercel.app';
var resultsEl = document.getElementById('results');
var detailsEl = document.getElementById('details');
var form = document.getElementById('search-form');
var btnList = document.getElementById('btn-list');

function showResults(html) { resultsEl.innerHTML = html; }
function showDetails(html) { detailsEl.innerHTML = html; }
function empty(el, text) { el.innerHTML = '<p class="empty">' + text + '</p>'; }
function esc(s) { return String(s == null ? '' : s); }

// Render film list
function renderFilmList(items) {
  if (!items || items.length === 0) {
    showResults('<p class="empty">No films found.</p>');
    return;
  }
  var html = '<h2>Films</h2><ul>';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var title = esc(it.title);
    var id = esc(it.id);
    var year = esc(it.release_date);
    html += '<li>' +
      '<div><strong>' + title + '</strong> <span class="small">· ' + year + '</span></div>' +
      '<button data-id="' + id + '">Details</button>' +
    '</li>';
  }
  html += '</ul>';
  showResults(html);

  // wire detail buttons
  var buttons = resultsEl.querySelectorAll('button[data-id]');
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].addEventListener('click', function (e) {
      var id = e.currentTarget.getAttribute('data-id');
      loadFilmDetail(id);
    });
  }
}

// Render film detail
function renderFilmDetail(obj) {
  if (!obj) {
    showDetails('<p class="empty">No details.</p>');
    return;
  }
  var title = esc(obj.title);
  var year = esc(obj.release_date);
  var director = esc(obj.director);
  var runningTime = esc(obj.running_time);
  var description = esc(obj.description);

  var html = '<h2>Film Detail</h2>' +
    '<p><strong>' + title + '</strong> <span class="small">· ' + year + '</span></p>' +
    '<p class="small">Director: ' + director + ' · Running time: ' + runningTime + ' min</p>' +
    '<p>' + description + '</p>';
  showDetails(html);
}

// Load all films
function listFilms() {
  empty(resultsEl, 'Loading films...');
  empty(detailsEl, 'Select a film to view details.');
  fetch(API + '/films')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (all) {
      var first20 = all.slice(0, 20);
      renderFilmList(first20);
    })
    .catch(function (err) {
      showResults('<p class="empty">Failed to load films (' + String(err) + ')</p>');
    });
}

// Client-side search by title
function searchFilms(query) {
  empty(resultsEl, 'Searching...');
  empty(detailsEl, 'Select a film to view details.');
  fetch(API + '/films')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (all) {
      var q = (query || '').toLowerCase();
      var filtered = all.filter(function (f) {
        return (f.title || '').toLowerCase().indexOf(q) !== -1;
      });
      renderFilmList(filtered.slice(0, 20));
    })
    .catch(function (err) {
      showResults('<p class="empty">Failed to search (' + String(err) + ')</p>');
    });
}

// GET single film by id
function loadFilmDetail(id) {
  if (!id) { showDetails('<p class="empty">No ID.</p>'); return; }
  empty(detailsEl, 'Loading details...');
  fetch(API + '/films/' + encodeURIComponent(id))
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      renderFilmDetail(data);
    })
    .catch(function (err) {
      showDetails('<p class="empty">Failed to load details (' + String(err) + ')</p>');
    });
}

// Wire UI
btnList.addEventListener('click', function () { listFilms(); });
form.addEventListener('submit', function (e) {
  e.preventDefault();
  var q = document.getElementById('q').value.trim();
  searchFilms(q);
});

// Initial state
showResults('<p class="empty">Use “List All” or search by title.</p>');
showDetails('<p class="empty">Details will appear here.</p>');
