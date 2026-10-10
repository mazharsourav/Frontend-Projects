/* Code formatting with Prettier, fetched from a CDN the first time it is needed. */
let prettierReady = null;

function loadPrettier(){
  if(prettierReady) return prettierReady;

  const base = 'https://cdn.jsdelivr.net/npm/prettier@3.3.3/';
  const load = file => loadScript(base + file);

  prettierReady = load('standalone.js')
    .then(() => Promise.all(['html','postcss','babel','estree'].map(p => load(`plugins/${p}.js`))));
  prettierReady.catch(() => { prettierReady = null; });   // allow a retry
  return prettierReady;
}

async function formatActive(){
  const name = activePane();
  const ed = editors[name];
  const parser = { html:'html', css:'css', js:'babel' }[name];

  try{
    log('Formatting...');
    await loadPrettier();
    const formatted = await prettier.format(ed.getValue(), {
      parser, plugins:Object.values(prettierPlugins), tabWidth:2,
    });
    ed.setValue(formatted, -1);
    log(`Formatted ${name.toUpperCase()}.`);
  }catch(e){
    log('Could not format: ' + (e.message || e), 'error');
  }
}

$('#formatBtn').addEventListener('click', formatActive);
