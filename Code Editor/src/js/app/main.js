/* Wiring that spans features, then start-up. Must load last. */

// Same shortcuts as the editors, for when focus is outside them.
// (Ace stops the event itself when an editor has focus.)
document.addEventListener('keydown', (e)=>{
  if(e.defaultPrevented || !(e.ctrlKey || e.metaKey)) return;

  if(e.key.toLowerCase() === 's'){ e.preventDefault(); saveProject(); }
  else if(e.key === 'Enter'){ e.preventDefault(); runWeb(false); }
});

[ed_html, ed_css, ed_js].forEach(ed => ed.on('change', () => { scheduleAutoRun(); scheduleStatus(); }));
['#assignment', '#testArea'].forEach(sel => $(sel).addEventListener('input', scheduleStatus));
$('#hideTests').addEventListener('change', () => { syncHiddenTests(); updateDirty(); });

window.addEventListener('beforeunload', e => {
  if(isDirty()){ e.preventDefault(); e.returnValue = ''; }
});

(async function init(){
  applyTheme();
  applyFontSize();
  refreshProjectSelect();

  if(!(await loadFromHash())) applyProject(currentItem().project);

  runWeb(false, { quiet:true });
  log('Ready — Web-only Editor (HTML/CSS/JS)');
})();
