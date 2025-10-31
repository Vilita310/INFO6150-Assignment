// Final revision: All if statements use {} blocks
const currentYear = new Date().getFullYear();

const form = document.getElementById('signup-form');
const errorsList = document.getElementById('errors');
const successMsg = document.getElementById('ok');
const nameInput = document.getElementById('name');
const birthYearInput = document.getElementById('birthyear');
const inUSCheckbox = document.getElementById('inUS');
const zipWrapper = document.getElementById('zip-wrap');
const zipInput = document.getElementById('zip');
const passwordInput = document.getElementById('password');

inUSCheckbox.addEventListener('change', () => {
  if (inUSCheckbox.checked) {
    zipWrapper.style.display = 'block';
  } else {
    zipWrapper.style.display = 'none';
    zipInput.value = '';
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  errorsList.innerHTML = '';
  successMsg.textContent = '';
  const errors = [];

  const nameValue = nameInput.value.trim();
  if (nameValue.length < 3) {
    errors.push('Name must be at least 3 characters.');
  }

  const birthYearStr = birthYearInput.value.trim();
  if (!/^[0-9]+$/.test(birthYearStr)) {
    errors.push('Birth year must be an integer.');
  } else {
    const birthYear = Number(birthYearStr);
    if (birthYear <= 1900 || birthYear >= currentYear) {
      errors.push(`Birth year must be between 1900 and ${currentYear}.`);
    }
  }

  if (inUSCheckbox.checked) {
    const zipVal = zipInput.value.trim();
    if (!/^[0-9]{5}$/.test(zipVal)) {
      errors.push('ZIP must be 5 digits.');
    }
  }

  const passwordVal = passwordInput.value;
  if (passwordVal.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  const pizzaChoice = form.querySelector('input[name="pizza"]:checked');
  if (!pizzaChoice) {
    errors.push('Please select a pizza preference.');
  }

  if (errors.length > 0) {
    errors.forEach((msg) => {
      const li = document.createElement('li');
      li.textContent = msg;
      errorsList.appendChild(li);
    });
  } else {
    successMsg.textContent = 'Accepted';
  }
});

document.getElementById('reset').addEventListener('click', () => {
  errorsList.innerHTML = '';
  successMsg.textContent = '';
  if (!inUSCheckbox.checked) {
    zipWrapper.style.display = 'none';
  }
});
