/* The three code editors (Ace, or plain text areas if Ace is unavailable), their tabs and sizing. */
const hasAce = typeof window.ace !== 'undefined';

// Same small surface the app uses from an Ace editor, backed by a <textarea>.
function makeFallbackEditor(id){
  const host = document.getElementById(id);
  const ta = document.createElement('textarea');
  ta.className = 'text fallback-editor';
  ta.spellcheck = false;
  ta.setAttribute('aria-label', host.closest('.editor-wrap').dataset.pane.toUpperCase() + ' code');
  host.appendChild(ta);

  const listeners = [];
  const emit = () => listeners.forEach(fn => fn());
  ta.addEventListener('input', emit);
  ta.addEventListener('keydown', e => {
    if(e.key === 'Tab' && !e.ctrlKey && !e.metaKey){
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      emit();
    }
  });

  return {
    getValue: () => ta.value,
    setValue(v){ ta.value = v; emit(); },
    on(evt, fn){ if(evt === 'change') listeners.push(fn); },
    setFontSize(size){ ta.style.fontSize = size; },
    setOption(){},
    resize(){},
    focus(){ ta.focus(); },
  };
}

function makeEditor(id, mode){
  if(!hasAce) return makeFallbackEditor(id);

  const ed = ace.edit(id, {
    theme:'ace/theme/dracula',
    mode, tabSize:2, useSoftTabs:true, showPrintMargin:false, wrap:true
  });

  ed.session.setUseWrapMode(true);
  ed.commands.addCommand({
    name:'run', bindKey:{win:'Ctrl-Enter',mac:'Command-Enter'},
    exec(){ runWeb(false); }
  });

  ed.commands.addCommand({
    name:'save', bindKey:{win:'Ctrl-S',mac:'Command-S'},
    exec(){ saveProject(); }
  });

  ed.commands.addCommand({
    name:'format', bindKey:{win:'Shift-Alt-F',mac:'Shift-Option-F'},
    exec(){ formatActive(); }
  });

  return ed;
}

const ed_html = makeEditor('ed_html','ace/mode/html');
const ed_css  = makeEditor('ed_css','ace/mode/css');
const ed_js   = makeEditor('ed_js','ace/mode/javascript');

const editors = { html: ed_html, css: ed_css, js: ed_js };

if(!hasAce) log('The code editor library could not be loaded, so plain text areas are used instead.', 'warn');

if(hasAce){
  try{
    ace.config.loadModule('ace/ext/emmet', () => {
      // The extension needs the Emmet core as a global (window.emmet) before it is switched on.
      loadScript('https://cloud9ide.github.io/emmet-core/emmet.js')
        .then(() => {
          ed_html.setOption('enableEmmet', true);
          ed_css.setOption('enableEmmet', true);
        })
        .catch(() => {});
    });
  }catch{}
}

function applyFontSize(){
  Object.values(editors).forEach(ed => ed.setFontSize(prefs.fontSize + 'px'));
}


const TAB_ORDER = ['html','css','js'];

const wraps   = Object.fromEntries($$('#webEditors .editor-wrap').map(w => [w.dataset.pane, w]));

function activePane(){
  const t = $('#webTabs .tab.active');
  return t ? t.dataset.pane : 'html';
}

function showPane(name){

  TAB_ORDER.forEach(k => { if(wraps[k]) wraps[k].hidden = (k !== name); });
  $$('#webTabs .tab').forEach(t => {
    const on = t.dataset.pane === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });

  requestAnimationFrame(() => {
    const ed = editors[name];
    if(ed && ed.resize){ ed.resize(true); ed.focus(); }
  });

}

$('#webTabs')?.addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab'); if(!btn) return;
  showPane(btn.dataset.pane);
});

$('#webTabs')?.addEventListener('keydown', (e)=>{
  const idx = TAB_ORDER.indexOf(activePane());
  if(e.key==='ArrowLeft' || e.key==='ArrowRight'){
    const delta = e.key==='ArrowLeft' ? -1 : 1;
    showPane(TAB_ORDER[(idx+delta+TAB_ORDER.length)%TAB_ORDER.length]);
    e.preventDefault();
  }
});

// Dragging the editor's bottom-right corner resizes it; Ace has to be told.
if('ResizeObserver' in window){
  const ro = new ResizeObserver(() => editors[activePane()].resize(true));
  Object.values(wraps).forEach(w => ro.observe(w));
}

showPane('html');
