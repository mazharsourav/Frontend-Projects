/* Test results panel, and the messages the preview iframe sends up (console output,
   errors, test results). */
const results = (() => {
  const box = $('#results'), list = $('#testList'), score = $('#score'), fill = $('#barFill');
  let passed = 0, failed = 0, masked = false;

  const render = () => {
    const total = passed + failed;
    score.textContent = `${passed} / ${total} passed`;
    fill.style.width = total ? (100 * passed / total) + '%' : '0%';
  };

  return {
    reset(maskNames){
      passed = failed = 0;
      masked = maskNames;
      list.innerHTML = '';
      score.textContent = '';
      fill.style.width = '0%';
      box.hidden = true;
    },
    add(t){
      const n = passed + failed + 1;
      if(t.ok) passed++; else failed++;

      const li = document.createElement('li');
      li.className = t.ok ? 'pass' : 'fail';
      const name = masked ? `Hidden test ${n}` : t.name;
      li.textContent = (t.ok ? '✔ ' : '✘ ') + name + (!t.ok && t.detail ? ' — ' + t.detail : '');
      list.appendChild(li);

      box.hidden = false;
      render();
    },
  };
})();

window.addEventListener('message', e => {
  const d = e.data;
  if(e.source !== preview.contentWindow || !d || d.codelab !== 1) return;

  switch(d.type){
    case 'test':    results.add(d); break;
    case 'summary': log((d.failed ? '✘ ' : '✔ ') + `${d.passed} passed, ${d.failed} failed`, d.failed ? 'fail' : 'pass'); break;
    case 'result':  log('← ' + d.text); break;
    default:        log(d.text, d.type);
  }
});
