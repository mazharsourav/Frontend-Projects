/* Start-up. Loads the Ace editor (cdnjs, then jsDelivr), then the app scripts in order.
   The app starts either way: without Ace it falls back to plain text areas. */
(function () {
  'use strict';

  var ACE_SOURCES = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.43.2/ace.js',
      integrity: 'sha512-ZIa+FlPaGDSM+lTl9JaxnQvcfma7ETsOHd9Thbhp5u4RX1uYiDNW7XvUrXv4dJSPetXbiTzWilHEkSg4YpmltQ=='
    },
    { src: 'https://cdn.jsdelivr.net/npm/ace-builds@1.43.2/src-min/ace.js' }
  ];

  // Order matters: later files use what earlier ones define.
  var APP_SCRIPTS = [
    'utils', 'dialog', 'results', 'editors', 'preview', 'format',
    'projects', 'template-menu', 'import-export', 'theme', 'main'
  ].map(function (name) { return 'src/js/app/' + name + '.js'; });

  var ACE_TIMEOUT_MS = 8000;
  var started = false;

  function startApp() {
    if (started) return;
    started = true;

    APP_SCRIPTS.forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;           // dynamically added scripts still run in insertion order
      document.body.appendChild(s);
    });
  }

  function loadAce(i) {
    if (i >= ACE_SOURCES.length) return startApp();

    var s = document.createElement('script');
    var timer = setTimeout(function () {
      s.onload = s.onerror = null;
      loadAce(i + 1);
    }, ACE_TIMEOUT_MS);

    s.src = ACE_SOURCES[i].src;
    if (ACE_SOURCES[i].integrity) {
      s.integrity = ACE_SOURCES[i].integrity;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
    }
    s.onload = function () { clearTimeout(timer); startApp(); };
    s.onerror = function () { clearTimeout(timer); loadAce(i + 1); };
    document.head.appendChild(s);
  }

  loadAce(0);
})();
