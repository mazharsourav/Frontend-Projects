/* Shared helpers, DOM references, persistence and the output log.
   App scripts are classic scripts that share one global scope; boot.js loads them in order. */

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const Core = globalThis.CodeLabCore;
const out = $('#output');
const preview = $('#preview');

const LEGACY_KEY   = 'academy-codelab-web';
const PROJECTS_KEY = 'codelab:projects';
const PREFS_KEY    = 'codelab:prefs';

// localStorage can throw (private windows, blocked site data), so every access is wrapped.
const storage = {
  get(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch{ return null; } },
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch{ return false; } },
};

const prefs = Object.assign({ theme:'dark', fontSize:14, autorun:true }, storage.get(PREFS_KEY) || {});
const savePrefs = () => storage.set(PREFS_KEY, prefs);

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const slug = s => (String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || 'project';

const escapeHtml = Core.escapeHtml;


function log(msg, type='info'){
  const isBad = type==='error' || type==='fail';
  const symbol = type==='error' ? '✘ ' : type==='warn' ? '! ' : '';

  const time = new Date().toLocaleTimeString();

  const line = document.createElement('div');
  if(isBad) line.style.fontWeight = '700';
  if(type==='warn') line.style.fontStyle = 'italic';

  line.innerHTML = `<span style="color:var(--muted)">[${time}]</span> ${symbol}${escapeHtml(msg)}`;

  out.appendChild(line); out.scrollTop = out.scrollHeight;
}

function clearOut(){ out.innerHTML=''; }

$('#clearOut')?.addEventListener('click', clearOut);


function loadScript(src, timeoutMs = 15000){
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    const timer = setTimeout(() => reject(new Error('timed out loading ' + src)), timeoutMs);
    s.src = src;
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => { clearTimeout(timer); reject(new Error('could not load ' + src)); };
    document.head.appendChild(s);
  });
}

function download(blob, filename){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
