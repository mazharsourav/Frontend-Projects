'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../helpers/load-core');
const { runPreview } = require('../helpers/run-preview');

test('an infinite loop is stopped instead of hanging', () => {
  const doc = Core.buildSrcdoc({ js: 'while (true) { }' });
  const started = Date.now();
  const { uncaught } = runPreview(doc);
  const elapsed = Date.now() - started;

  assert.equal(uncaught.length, 1);
  assert.match(uncaught[0], /possible infinite loop/);
  assert.ok(elapsed < 6000, `took ${elapsed}ms`);
});

test('buildSrcdoc runs tests and reports each result and a summary', () => {
  const doc = Core.buildSrcdoc({
    js: 'console.log("hi", {a: 1});',
    tests: 'test("adds", () => assert(1 + 1 === 2));\ntest("fails", () => assert(false, "nope"));',
    withTests: true,
  });
  const { messages } = runPreview(doc);

  const log = messages.find(m => m.type === 'log');
  assert.equal(log.text, 'hi {"a":1}');

  const tests = messages.filter(m => m.type === 'test');
  assert.deepEqual(tests.map(t => [t.name, t.ok, t.detail]), [
    ['adds', true, undefined],
    ['fails', false, 'nope'],
  ]);

  const summary = messages.find(m => m.type === 'summary');
  assert.deepEqual([summary.passed, summary.failed], [1, 1]);
});

test('tests still run when the student code throws', () => {
  const doc = Core.buildSrcdoc({
    js: 'throw new Error("boom");',
    tests: 'test("still runs", () => assert(true));',
    withTests: true,
  });
  const { messages } = runPreview(doc);
  assert.ok(messages.some(m => m.type === 'test' && m.name === 'still runs' && m.ok));
});

test('student code cannot replace test() or assert()', () => {
  const doc = Core.buildSrcdoc({
    js: 'try { window.test = function(){}; } catch (e) {}',
    tests: 'test("real", () => assert(false, "still checked"));',
    withTests: true,
  });
  const { messages } = runPreview(doc);
  const t = messages.find(m => m.type === 'test');
  assert.equal(t.ok, false);
});

test('tests are skipped when withTests is off or the tests are empty', () => {
  const off = Core.buildSrcdoc({ tests: 'test("x", () => {});', withTests: false });
  assert.doesNotMatch(off, /test\("x"/);
  const empty = Core.buildSrcdoc({ tests: '   ', withTests: true });
  assert.doesNotMatch(empty, /Object\.defineProperty\(window, name/);
});

test('top-level const in tests does not clash with student code', () => {
  const doc = Core.buildSrcdoc({
    js: 'const count = 1;',
    tests: 'const count = 2; test("ok", () => assert(count === 2));',
    withTests: true,
  });
  const { messages, uncaught } = runPreview(doc);
  assert.deepEqual(uncaught, []);
  assert.ok(messages.some(m => m.type === 'test' && m.ok));
});

test('</script inside student code cannot break out of its element', () => {
  const doc = Core.buildSrcdoc({ js: 'const s = "</script><b>";' });
  assert.equal((doc.match(/<\/script>/g) || []).length, 2); // bridge + student only
});
