/* Builds the document that runs inside the preview iframe. */
(function () {
  'use strict';

  const core = (globalThis.CodeLabCore = globalThis.CodeLabCore || {});

  // Keeps student code from closing the <script> element it is embedded in.
  const escapeScript = s => String(s).replace(/<\/script/gi, '<\\/script');

  // Runs inside the preview iframe. Forwards console output and errors to the
  // editor, answers console-input evaluations, stops runaway loops (__lg) and,
  // when tests are on, provides test()/assert() as read-only globals.
  function previewBridge(withTests) {
    return `(function(){
  var target = window.parent !== window ? window.parent : null;
  function send(type, text, extra){
    var m = {codelab:1, type:type, text:String(text)};
    if(extra) for(var k in extra) m[k] = extra[k];
    try{ if(target) target.postMessage(m, '*'); }catch(_){}
  }
  function fmt(a){
    if(typeof a === 'string') return a;
    if(a instanceof Error) return a.name + ': ' + a.message;
    try{ var s = JSON.stringify(a); return s === undefined ? String(a) : s; }catch(_){ return String(a); }
  }
  ['log','info','warn','error'].forEach(function(k){
    var orig = console[k];
    console[k] = function(){
      send(k, Array.prototype.map.call(arguments, fmt).join(' '));
      return orig.apply(console, arguments);
    };
  });
  var origAssert = console.assert;
  console.assert = function(ok){
    if(!ok) send('error', 'Assertion failed: ' + Array.prototype.slice.call(arguments, 1).map(fmt).join(' '));
    return origAssert.apply(console, arguments);
  };
  window.addEventListener('error', function(e){ send('error', e.message); });
  window.addEventListener('unhandledrejection', function(e){ send('error', 'Unhandled rejection: ' + fmt(e.reason)); });

  var ticks = 0, since = 0;
  Object.defineProperty(window, '__lg', {value: function(){
    if(++ticks & 1023) return;
    var now = Date.now();
    if(!since){ since = now; setTimeout(function(){ since = 0; }, 0); }
    else if(now - since > 2000) throw new Error('Stopped: a loop ran for over 2 seconds without finishing (possible infinite loop).');
  }});

  window.addEventListener('message', function(e){
    var d = e.data;
    if(e.source !== target || !d || d.codelab !== 1 || d.type !== 'eval') return;
    try{ send('result', fmt((0, eval)(String(d.code)))); }
    catch(err){ send('error', fmt(err)); }
  });
${withTests ? `
  var passed = 0, failed = 0;
  function lock(name, fn){ Object.defineProperty(window, name, {value: fn}); }
  lock('assert', function(cond, msg){ if(!cond) throw new Error(msg || 'Assertion failed'); });
  lock('test', function(name, fn){
    try{ fn(); passed++; send('test', name, {ok:true, name:name}); }
    catch(e){ failed++; send('test', name, {ok:false, name:name, detail:(e && e.message) || String(e)}); }
  });
  window.addEventListener('load', function(){
    if(passed + failed) send('summary', '', {passed:passed, failed:failed});
  });` : ''}
})();`;
  }

  // Student code and tests are separate scripts, so an error in one does not
  // stop the other. Tests sit in a block so their let/const never clash with
  // the student's top-level names.
  function buildSrcdoc({ html = '', css = '', js = '', tests = '', withTests = false, guard = true }) {
    const testCode = String(tests).trim();
    const runTests = withTests && !!testCode;
    const studentJs = escapeScript(guard ? core.guardLoops(js) : js);

    return `<!doctype html>

<html lang="en" dir="ltr">

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width,initial-scale=1">

<style>${css}\n</style>

<script>${previewBridge(runTests)}<\/script>

</head>

<body>${html}

<script>${studentJs}<\/script>
${runTests ? `<script>{\n${escapeScript(testCode)}\n}<\/script>` : ''}

</body>

</html>`;
  }

  core.previewBridge = previewBridge;
  core.buildSrcdoc = buildSrcdoc;
})();
