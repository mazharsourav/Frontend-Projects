'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const Core = require('../helpers/load-core');

test('guardLoops guards for, while and do bodies', () => {
  const out = Core.guardLoops('for (let i = 0; i < 3; i++) { a(); }\nwhile (x) { b(); }\ndo { c(); } while (y);');
  assert.equal((out.match(/__lg\(\);/g) || []).length, 3);
});

test('guardLoops handles nested parentheses and for-await heads', () => {
  const out = Core.guardLoops('async function f(){ for await (const v of g(h(1))) { use(v); } }');
  assert.match(out, /\{__lg\(\);/);
});

test('guardLoops leaves strings, comments, regexes and property names alone', () => {
  const src = [
    'const s = "for (;;) { x }";',
    "const t = 'while (1) {}';",
    'const u = `for (;;) { ${1 + 1} }`;',
    '// while (true) { }',
    '/* for (;;) { } */',
    'const r = /["\']for (;;) {/;',
    'obj.for = 1; obj.while = 2;',
  ].join('\n');
  assert.equal(Core.guardLoops(src), src);
});

test('guardLoops skips unbraced bodies and code that does not parse', () => {
  const unbraced = 'for (let i = 0; i < 3; i++) count++;';
  assert.equal(Core.guardLoops(unbraced), unbraced);

  const broken = 'for (let i = 0; i < 3; i++) { ';
  assert.equal(Core.guardLoops(broken), broken);
});

test('guarded code keeps its behaviour', () => {
  const src = 'let total = 0; for (let i = 1; i <= 10; i++) { total += i; } total;';
  const guarded = Core.guardLoops(src);
  assert.notEqual(guarded, src);
  const result = vm.runInNewContext(guarded, { __lg() {} });
  assert.equal(result, 55);
});
