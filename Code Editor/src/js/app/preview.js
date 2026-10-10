/* Running the project: the preview iframe, auto-run, popup window and the console input. */
let previewRunning = false;
let autoTimer;

function runWeb(withTests=false, { quiet=false } = {}){
  clearTimeout(autoTimer);   // a pending auto-run must not overwrite this run (or its test results)
  const tests = ($('#testArea').value || '').trim();
  if(withTests && !tests){
    log('No validation tests written — running without tests.', 'warn');
  }

  results.reset($('#hideTests').checked);
  preview.srcdoc = buildDoc(withTests);
  previewRunning = true;

  if(!quiet) log(withTests && tests ? 'Run with tests.' : 'Web preview updated.');
}

function buildDoc(withTests){
  return Core.buildSrcdoc({
    html:  ed_html.getValue(),
    css:   ed_css.getValue(),
    js:    ed_js.getValue(),
    tests: $('#testArea').value || '',
    withTests,
  });
}

function stopWeb(){
  preview.srcdoc = '<!doctype html><title>Stopped</title>';
  previewRunning = false;
  results.reset(false);
  log('Preview stopped. Press Run to start it again.');
}

$('#runWeb')?.addEventListener('click', ()=>runWeb(false));
$('#stopWeb')?.addEventListener('click', stopWeb);
$('#runTests')?.addEventListener('click', ()=>runWeb(true));

// The popup only hosts a sandboxed iframe, so the student's code never runs
// with this page's origin (no access to its storage or to window.opener).
$('#openPreview')?.addEventListener('click', ()=>{

  const w = window.open('', '_blank');
  if(!w){ log('The browser blocked the preview window.', 'warn'); return; }

  const frame = w.document.createElement('iframe');
  frame.setAttribute('sandbox', preview.getAttribute('sandbox'));
  frame.style.cssText = 'border:0;width:100vw;height:100vh;display:block';
  frame.srcdoc = buildDoc(false);

  w.document.title = 'Preview';
  w.document.body.style.margin = '0';
  w.document.body.appendChild(frame);
});

function scheduleAutoRun(){
  if(!prefs.autorun) return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => runWeb(false, { quiet:true }), 700);
}

$('#autorun').checked = !!prefs.autorun;
$('#autorun').addEventListener('change', e => {
  prefs.autorun = e.target.checked;
  savePrefs();
  if(prefs.autorun) scheduleAutoRun();
});


const consoleHistory = [];
let historyPos = 0;

$('#consoleForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#consoleInput');
  const code = input.value.trim();
  if(!code) return;

  consoleHistory.push(code);
  historyPos = consoleHistory.length;
  input.value = '';
  log('› ' + code);

  if(!previewRunning){ log('The preview is stopped. Press Run first.', 'warn'); return; }
  preview.contentWindow.postMessage({ codelab:1, type:'eval', code }, '*');
});

$('#consoleInput').addEventListener('keydown', e => {
  if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  if(!consoleHistory.length) return;

  e.preventDefault();
  historyPos += e.key === 'ArrowUp' ? -1 : 1;
  historyPos = Math.max(0, Math.min(consoleHistory.length, historyPos));
  e.target.value = consoleHistory[historyPos] || '';
});
