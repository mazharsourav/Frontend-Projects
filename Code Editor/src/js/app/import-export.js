/* Getting projects in and out: JSON / ZIP export, file import and share links. */
function exportProject(){
  try{
    const data = JSON.stringify(projectJSON(), null, 2);
    const filename = slug(currentItem().name) + '.json';
    download(new Blob([data], {type:'application/json'}), filename);
    log(`Exported ${filename}.`);
  }catch(e){ log('Unable to export: '+e, 'error'); }
}

function exportZip(){
  try{
    const bytes = Core.makeZip(Core.projectFiles(projectJSON()));
    const filename = slug(currentItem().name) + '.zip';
    download(new Blob([bytes], {type:'application/zip'}), filename);
    log(`Exported ${filename} (index.html, style.css, script.js).`);
  }catch(e){ log('Unable to export: '+e, 'error'); }
}

async function shareLink(){
  try{
    const token = await Core.encodeShare(projectJSON());
    const url = location.href.split('#')[0] + '#p=' + token;

    let copied = false;
    try{ await navigator.clipboard.writeText(url); copied = true; }catch{}
    if(!copied){
      await openDialog({
        heading: 'Copy link',
        text: 'Your browser blocked automatic copying. Copy this link to share the project.',
        input: { label: 'Link', value: url, readonly: true },
        confirmText: 'Done',
        cancelText: null,
      });
    }

    log(`${copied ? 'Link copied' : 'Link ready'} (${url.length} characters).`);
    if(url.length > 8000) log('This link is very long; some apps may cut it off. Export JSON is safer for big projects.', 'warn');
  }catch(e){ log('Unable to create the link: ' + e.message, 'error'); }
}

$('#exportBtn').addEventListener('click', exportProject);
$('#zipBtn').addEventListener('click', exportZip);
$('#shareBtn').addEventListener('click', shareLink);

$('#loadBtn').addEventListener('click', ()=> $('#openFile').click());
$('#openFile').addEventListener('change', async (e)=>{
  const f = e.target.files?.[0];
  e.target.value = '';                       // lets the same file be chosen again
  if(!f) return;
  if(!(await confirmDiscard('Load the file'))) return;

  try{
    applyProject(JSON.parse(await f.text()), { markClean:false });
    runWeb(false, { quiet:true });
    log(`Loaded ${f.name}. Press Save to keep it in this browser.`);
  }catch(err){ log('Invalid project file', 'error'); }
});

// "#p=<token>" in the address means someone shared a project: open it as a new saved project.
async function loadFromHash(){
  const m = location.hash.match(/^#p=(.+)$/);
  if(!m) return false;

  try{
    const shared = await Core.decodeShare(m[1]);
    const id = uid();
    projects.items[id] = { name: shared.name || 'Shared project', updated: Date.now(), project: shared };
    projects.current = id;
    persistProjects();

    history.replaceState(null, '', location.pathname + location.search);   // reloads open it from storage
    applyProject(shared);
    refreshProjectSelect();
    log(`Opened the shared project "${currentItem().name}".`);
    return true;
  }catch(e){
    log('Could not open the shared link: ' + e.message, 'error');
    return false;
  }
}

window.addEventListener('hashchange', async () => {
  if(!/^#p=/.test(location.hash)) return;
  if(!(await confirmDiscard('Open the shared project'))){
    history.replaceState(null, '', location.pathname + location.search);
    return;
  }
  if(await loadFromHash()) runWeb(false, { quiet:true });
});
