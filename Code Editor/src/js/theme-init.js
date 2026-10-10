/* Sets the saved theme before first paint, so there is no flash of the wrong theme.
   Loaded synchronously from <head>, which is why it is a separate, tiny file. */
try {
  var savedTheme = JSON.parse(localStorage.getItem('codelab:prefs') || '{}').theme;
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
} catch (e) {}
