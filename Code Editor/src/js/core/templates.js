/* Starter projects offered in the Templates menu. */
(function () {
  'use strict';

  const core = (globalThis.CodeLabCore = globalThis.CodeLabCore || {});

  core.TEMPLATES = [
    {
      id: 'welcome',
      name: 'Welcome card',
      html: `<!-- Welcome card -->
<section class="card" style="max-width:520px;margin:24px auto;padding:18px;text-align:center">
  <h1>Welcome to the Editor</h1>
  <p>This example runs locally in the browser.</p>
  <button id="btn">Try me</button>
</section>`,
      css: `body{font-family:system-ui;background:#f7fafc;margin:0}
h1{color:#0f172a}
#btn{padding:.75rem 1rem;border:0;border-radius:10px;background:#0f172a;color:#fff;font-weight:700}`,
      js: `document.getElementById('btn').addEventListener('click',()=>alert('Well done!'));
console.log('Hello from JavaScript!');`,
    },
    {
      id: 'blank',
      name: 'Blank',
      html: '',
      css: '',
      js: '',
    },
    {
      id: 'counter',
      name: 'Exercise: counter (with tests)',
      assignment: 'Make the **Add one** button increase the number, and the **Reset** button set it back to 0.\n\nUse "Run with tests" to check your work.',
      html: `<main class="counter">
  <h1>Counter</h1>
  <p>Count: <span id="count">0</span></p>
  <button id="inc">Add one</button>
  <button id="reset">Reset</button>
</main>`,
      css: `body{font-family:system-ui;margin:0;display:grid;place-items:center;min-height:100vh}
.counter{text-align:center}
button{padding:.6rem 1rem;font-size:1rem}`,
      js: `// TODO: make "Add one" increase the count and "Reset" set it back to 0.
`,
      test: `test('starts at 0', () => {
  assert(document.getElementById('count').textContent === '0', 'The count should start at 0');
});

test('Add one increases the count', () => {
  document.getElementById('inc').click();
  document.getElementById('inc').click();
  const shown = document.getElementById('count').textContent;
  assert(shown === '2', 'After two clicks the count should be 2, but it is ' + shown);
});

test('Reset sets it back to 0', () => {
  document.getElementById('reset').click();
  const shown = document.getElementById('count').textContent;
  assert(shown === '0', 'After Reset the count should be 0, but it is ' + shown);
});`,
    },
    {
      id: 'form',
      name: 'Exercise: form validation (with tests)',
      assignment: 'When the form is submitted, show **Invalid email** in the message area if the address has no "@", otherwise show **Thanks!**.',
      html: `<form id="signup" novalidate>
  <label>Email <input id="email" type="email"></label>
  <button>Sign up</button>
  <p id="msg" role="alert"></p>
</form>`,
      css: `body{font-family:system-ui;max-width:360px;margin:40px auto}
input,button{padding:.5rem;font-size:1rem}`,
      js: `const form = document.getElementById('signup');

form.addEventListener('submit', event => {
  event.preventDefault();
  // TODO: write "Invalid email" or "Thanks!" into #msg
});`,
      test: `function submitWith(value) {
  document.getElementById('email').value = value;
  document.getElementById('signup').requestSubmit();
  return document.getElementById('msg').textContent;
}

test('rejects an address without @', () => {
  const shown = submitWith('nobody');
  assert(shown === 'Invalid email', 'Expected "Invalid email", got "' + shown + '"');
});

test('accepts a valid address', () => {
  const shown = submitWith('a@b.co');
  assert(shown === 'Thanks!', 'Expected "Thanks!", got "' + shown + '"');
});`,
    },
    {
      id: 'canvas',
      name: 'Canvas animation',
      html: '<canvas id="c" width="480" height="260"></canvas>',
      css: `body{margin:0;display:grid;place-items:center;min-height:100vh;background:#111}
canvas{background:#fff;border-radius:12px}`,
      js: `const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let x = 40, dx = 3;

function frame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(x, canvas.height / 2, 24, 0, Math.PI * 2);
  ctx.fill();

  x += dx;
  if (x < 24 || x > canvas.width - 24) dx = -dx;
  requestAnimationFrame(frame);
}
frame();`,
    },
    {
      id: 'fetch',
      name: 'Fetch data',
      html: `<main>
  <h1>Advice</h1>
  <p id="out">Loading...</p>
  <button id="again">Another one</button>
</main>`,
      css: `body{font-family:system-ui;max-width:420px;margin:40px auto}
#out{font-size:1.2rem;min-height:3rem}`,
      js: `async function load() {
  const out = document.getElementById('out');
  out.textContent = 'Loading...';
  try {
    const res = await fetch('https://api.github.com/zen');
    out.textContent = await res.text();
  } catch (err) {
    out.textContent = 'Could not load: ' + err.message;
  }
}

document.getElementById('again').addEventListener('click', load);
load();`,
    },
  ];
})();
