/* The "Templates…" menu: replace the editors with a starter project. */
(() => {
  const select = $('#templateSelect');
  select.innerHTML = '<option value="">Templates…</option>' +
    Core.TEMPLATES.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

  select.addEventListener('change', async () => {
    const id = select.value;
    select.value = '';
    if(!id) return;
    if(!(await confirmDiscard('Load the template'))) return;

    applyProject(templateProject(id), { markClean:false });
    updateDirty();
    runWeb(false, { quiet:true });
    log(`Loaded the "${Core.TEMPLATES.find(t => t.id === id).name}" template. Press Save to keep it.`);
  });
})();
