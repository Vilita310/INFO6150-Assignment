const YEAR_NOW = new Date().getFullYear();
const form = document.getElementById('signup-form');
const errorsEl = document.getElementById('errors');
const okEl = document.getElementById('ok');
const nameEl = document.getElementById('name');
const yearEl = document.getElementById('birthyear');
const inUS = document.getElementById('inUS');
const zipWrap = document.getElementById('zip-wrap');
const zipEl = document.getElementById('zip');
const passEl = document.getElementById('password');

inUS.addEventListener('change', () => {
  zipWrap.style.display = inUS.checked ? 'block' : 'none';
  if (!inUS.checked) zipEl.value = '';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  errorsEl.innerHTML = '';
  okEl.textContent = '';
  const errs = [];
  const name = (nameEl.value || '').trim();
  if (name.length < 3) errs.push('Name: required and must be at least 3 characters.');
  const ys = (yearEl.value || '').trim();
  if (!ys) errs.push('Birth year: required.');
  else if (!/^\d+$/.test(ys)) errs.push('Birth year: must be integer.');
  else {
    const y = +ys;
    if (!(y > 1900 && y < YEAR_NOW)) errs.push('Birth year: must be >1900 and <' + YEAR_NOW + '.');
  }
  if (inUS.checked) {
    const z = (zipEl.value || '').trim();
    if (!z) errs.push('ZIP: required when living in US.');
    else if (!/^\d{5}$/.test(z)) errs.push('ZIP: must be exactly 5 digits.');
  }
  const p = (passEl.value || '');
  if (p.length < 8) errs.push('Password: must be at least 8 characters.');
  if (!form.querySelector('input[name=pizza]:checked')) errs.push('Pizza preference: choose one.');
  if (errs.length)
    errs.forEach(m => {
      const li = document.createElement('li');
      li.textContent = m;
      errorsEl.appendChild(li);
    });
  else okEl.textContent = 'Accepted';
});

document.getElementById('reset').addEventListener('click', () => {
  errorsEl.innerHTML = '';
  okEl.textContent = '';
  setTimeout(() => { if (!inUS.checked) zipWrap.style.display = 'none'; }, 0);
});
