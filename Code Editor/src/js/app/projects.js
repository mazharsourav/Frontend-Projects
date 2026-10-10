/* Saved projects: the store, unsaved-changes tracking and the Project panel actions. */
function templateProject(id){
  const t = Core.TEMPLATES.find(t => t.id === id) || Core.TEMPLATES[0];
  return Core.normalizeProject({
    html:t.html, css:t.css, js:t.js, assignment:t.assignment || '', test:t.test || '',
  });
}

function loadProjects(){
  const saved = storage.get(PROJECTS_KEY);
  if(saved && saved.items && typeof saved.items === 'object' && Object.keys(saved.items).length){
    if(!saved.items[saved.current]) saved.current = Object.keys(saved.items)[0];
    return saved;
  }

  // First run, or an older single-slot save: carry that work over.
  let project = null;
  try{ const legacy = storage.get(LEGACY_KEY); if(legacy) project = Core.normalizeProject(legacy); }catch{}

  const id = uid();
  return {
    current: id,
    items: { [id]: { name:'My project', updated:Date.now(), project: project || templateProject('welcome') } },
  };
}

const projects = loadProjects();
const persistProjects = () => storage.set(PROJECTS_KEY, projects);
const currentItem = () => projects.items[projects.current];

function projectJSON(){
  return {
    version: 1,
    kind: 'web-only',
    name: currentItem().name,
    assignment: $('#assignment').value || '',
    test: $('#testArea').value || '',
    hiddenTests: $('#hideTests').checked,
    html: ed_html.getValue(),
    css:  ed_css.getValue(),
    js:   ed_js.getValue()
  };
}

// What counts as "changed": everything except the project name (renames save immediately).
function contentKey(){
  const p = projectJSON();
  delete p.name;
  return JSON.stringify(p);
}

let savedKey = '';
const isDirty = () => contentKey() !== savedKey;
const updateDirty = () => { $('#dirty').hidden = !isDirty(); };

let statusTimer;
function scheduleStatus(){
  clearTimeout(statusTimer);
  statusTimer = setTimeout(updateDirty, 250);
}

function syncHiddenTests(){
  const hidden = $('#hideTests').checked;
  $('#testArea').hidden = hidden;
  $('#testsHiddenNote').hidden = !hidden;
}

// Puts a project into the editors. markClean=false leaves it counted as unsaved changes.
function applyProject(raw, { markClean=true } = {}){
  const proj = Core.normalizeProject(raw);

  $('#assignment').value = proj.assignment;
  $('#testArea').value = proj.test;
  $('#hideTests').checked = proj.hiddenTests;
  syncHiddenTests();

  ed_html.setValue(proj.html, -1);
  ed_css.setValue(proj.css, -1);
  ed_js.setValue(proj.js, -1);

  if(markClean) savedKey = contentKey();
  updateDirty();
}

function confirmDiscard(action){
  if(!isDirty()) return Promise.resolve(true);
  return openDialog({
    heading: 'Unsaved changes',
    text: `You have unsaved changes. ${action} and discard them?`,
    confirmText: 'Discard changes',
    cancelText: 'Keep editing',
    focus: 'cancel',
  });
}

function refreshProjectSelect(){
  const select = $('#projectSelect');
  select.innerHTML = '';

  Object.entries(projects.items)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([id, item]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = item.name;
      select.appendChild(opt);
    });

  select.value = projects.current;
}

function saveProject(){
  currentItem().project = Core.normalizeProject(projectJSON());
  currentItem().updated = Date.now();
  savedKey = contentKey();
  updateDirty();

  if(persistProjects()) log(`Saved "${currentItem().name}" in this browser.`);
  else log('Unable to save: this browser is blocking local storage. Use Export instead.', 'error');
}

function switchProject(id){
  projects.current = id;
  persistProjects();
  applyProject(currentItem().project);
  refreshProjectSelect();
  runWeb(false, { quiet:true });
  log(`Opened "${currentItem().name}".`);
}

$('#projectSelect').addEventListener('change', async e => {
  const select = e.target;
  const id = select.value;
  if(id === projects.current) return;
  if(!(await confirmDiscard('Switch project'))){ select.value = projects.current; return; }
  switchProject(id);
});

$('#newBtn').addEventListener('click', async () => {
  if(!(await confirmDiscard('Create a new project'))) return;
  const name = await openDialog({
    heading: 'New project',
    input: { label: 'Project title', value: 'Untitled' },
    confirmText: 'Create',
  });
  if(name === null) return;

  const id = uid();
  projects.items[id] = { name: name.trim() || 'Untitled', updated: Date.now(), project: templateProject('blank') };
  switchProject(id);
});

$('#renameBtn').addEventListener('click', async () => {
  const name = await openDialog({
    heading: 'Rename project',
    input: { label: 'Project title', value: currentItem().name },
    confirmText: 'Rename',
  });
  if(name === null || !name.trim()) return;
  currentItem().name = name.trim();
  persistProjects();
  refreshProjectSelect();
  log(`Renamed to "${currentItem().name}".`);
});

$('#deleteBtn').addEventListener('click', async () => {
  const name = currentItem().name;
  const confirmed = await openDialog({
    heading: 'Delete project?',
    text: `"${name}" will be removed from this browser. This cannot be undone.`,
    confirmText: 'Delete',
    focus: 'cancel',
  });
  if(!confirmed) return;

  delete projects.items[projects.current];
  if(!Object.keys(projects.items).length){
    const id = uid();
    projects.items[id] = { name:'My project', updated:Date.now(), project: templateProject('welcome') };
  }
  switchProject(Object.keys(projects.items)[0]);
  log(`Deleted "${name}".`);
});

$('#saveBtn').addEventListener('click', saveProject);
