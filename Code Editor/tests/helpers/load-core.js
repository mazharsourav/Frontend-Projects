'use strict';

// Loads the same DOM-free modules the page loads, in the same order, and
// returns the shared CodeLabCore namespace they fill in.
const path = require('node:path');

const MODULES = ['project', 'loop-guard', 'preview-doc', 'share', 'zip', 'templates'];
const dir = path.join(__dirname, '..', '..', 'src', 'js', 'core');

for (const name of MODULES) require(path.join(dir, `${name}.js`));

module.exports = globalThis.CodeLabCore;
