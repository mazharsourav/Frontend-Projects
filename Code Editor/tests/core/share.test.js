'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../helpers/load-core');

test('share links round-trip, including non-ASCII and long code', async () => {
  const project = {
    name: 'Ünïcode ✔', assignment: 'Task — 日本語', test: 'test("a", () => {})',
    hiddenTests: true, html: '<p>héllo</p>', css: 'p{color:red}', js: 'x'.repeat(50000),
  };
  const token = await Core.encodeShare(project);
  assert.match(token, /^[zr]\.[A-Za-z0-9_-]+$/);
  assert.ok(token.length < 5000, 'highly repetitive code should compress well');

  const back = await Core.decodeShare(token);
  assert.deepEqual(back, Core.normalizeProject(project));
});

test('decodeShare rejects garbage', async () => {
  await assert.rejects(Core.decodeShare('nonsense'));
  await assert.rejects(Core.decodeShare('z.@@@'));
});
