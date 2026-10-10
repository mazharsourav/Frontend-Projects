/* Appearance preferences: light/dark theme and the editor font size. */
function applyTheme(){
  document.documentElement.dataset.theme = prefs.theme;
  const light = prefs.theme === 'light';
  $('#themeBtn').textContent = light ? 'Dark' : 'Light';
  $('#themeBtn').setAttribute('aria-pressed', String(light));
}

$('#themeBtn').addEventListener('click', () => {
  prefs.theme = prefs.theme === 'light' ? 'dark' : 'light';
  savePrefs();
  applyTheme();
});

$('#fontSize').value = String(prefs.fontSize);
$('#fontSize').addEventListener('change', e => {
  prefs.fontSize = Number(e.target.value) || 14;
  savePrefs();
  applyFontSize();
});
