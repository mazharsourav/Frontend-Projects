'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../helpers/load-core');

test('normalizeProject accepts the current shape', () => {
  const p = Core.normalizeProject({ assignment: 'A', test: 'T', html: '<p>', css: 'p{}', js: 'x', hiddenTests: true, name: 'N' });
  assert.deepEqual(p, {
    version: 1, kind: 'web-only', name: 'N', assignment: 'A', test: 'T',
    hiddenTests: true, html: '<p>', css: 'p{}', js: 'x',
  });
});

test('normalizeProject accepts the legacy shapes', () => {
  const p = Core.normalizeProject({ task: 'Do it', tests: 'check()', web: { html: 'h', css: 'c', js: 'j' } });
  assert.equal(p.assignment, 'Do it');
  assert.equal(p.test, 'check()');
  assert.deepEqual([p.html, p.css, p.js], ['h', 'c', 'j']);
  assert.equal(p.hiddenTests, false);
});

test('normalizeProject rejects non-objects', () => {
  assert.throws(() => Core.normalizeProject(null));
  assert.throws(() => Core.normalizeProject('text'));
});

test('escapeHtml escapes markup and quotes', () => {
  assert.equal(Core.escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});
