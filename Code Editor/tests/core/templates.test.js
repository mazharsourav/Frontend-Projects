'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../helpers/load-core');

test('every template is a valid project and its JS parses', () => {
  const ids = new Set();
  for (const t of Core.TEMPLATES) {
    assert.ok(!ids.has(t.id), 'unique id ' + t.id);
    ids.add(t.id);
    Core.normalizeProject({ html: t.html, css: t.css, js: t.js, assignment: t.assignment, test: t.test });
    assert.doesNotThrow(() => new Function(t.js), `js of ${t.id}`);
    assert.doesNotThrow(() => new Function(t.test || ''), `tests of ${t.id}`);
  }
  assert.equal(Core.TEMPLATES[0].id, 'welcome');
});
