'use strict';
const vm = require('node:vm');

// Runs the scripts of a generated preview document in a fake iframe global.
// Returns every message the iframe posted to its parent, plus uncaught errors.
function runPreview(srcdoc) {
  const scripts = [...srcdoc.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const messages = [];
  const listeners = {};
  const sandbox = {
    parent: { postMessage: m => messages.push(m) },
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
    console: { log() {}, info() {}, warn() {}, error() {}, assert() {} },
    setTimeout,
    Date,
  };
  sandbox.window = sandbox;                 // inside an iframe, window is the global
  const ctx = vm.createContext(sandbox);

  const uncaught = [];
  for (const code of scripts) {
    try { vm.runInContext(code, ctx); } catch (e) { uncaught.push(e.message); }
  }
  (listeners.load || []).forEach(fn => fn());
  return { messages, uncaught, ctx };
}

module.exports = { runPreview };
