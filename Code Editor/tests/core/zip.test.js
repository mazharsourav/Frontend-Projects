'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../helpers/load-core');

// Reads a stored (uncompressed) ZIP back into { name: text }, checking every CRC.
function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  const end = bytes.length - 22;
  assert.equal(dv.getUint32(end, true), 0x06054b50);
  const count = dv.getUint16(end + 10, true);
  let p = dv.getUint32(end + 16, true);

  const files = {};
  for (let i = 0; i < count; i++) {
    assert.equal(dv.getUint32(p, true), 0x02014b50);
    const crc = dv.getUint32(p + 16, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));

    assert.equal(dv.getUint32(local, true), 0x04034b50);
    const lNameLen = dv.getUint16(local + 26, true);
    const dataStart = local + 30 + lNameLen;
    const data = bytes.subarray(dataStart, dataStart + size);
    assert.equal(Core.crc32(data), crc, `crc of ${name}`);
    files[name] = dec.decode(data);
    p += 46 + nameLen;
  }
  return files;
}

test('crc32 matches the standard check value', () => {
  assert.equal(Core.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('makeZip writes a readable archive', () => {
  const zip = Core.makeZip([
    { name: 'a.txt', data: 'hello' },
    { name: 'dir/b.txt', data: 'wörld ✔' },
    { name: 'empty.txt', data: '' },
  ]);
  assert.deepEqual(readZip(zip), { 'a.txt': 'hello', 'dir/b.txt': 'wörld ✔', 'empty.txt': '' });
});

test('projectFiles builds a standalone folder and hides hidden tests', () => {
  const base = { name: 'Demo', html: '<h1>Hi</h1>', css: 'h1{}', js: 'go()', assignment: 'Do X', test: 'test()' };

  const open = Core.projectFiles(base).map(f => f.name);
  assert.deepEqual(open, ['index.html', 'style.css', 'script.js', 'assignment.md', 'tests.js']);

  const hidden = Core.projectFiles({ ...base, hiddenTests: true }).map(f => f.name);
  assert.ok(!hidden.includes('tests.js'));

  const index = Core.projectFiles(base)[0].data;
  assert.match(index, /<link rel="stylesheet" href="style.css">/);
  assert.match(index, /<h1>Hi<\/h1>/);
  assert.match(index, /<script src="script.js">/);
});
