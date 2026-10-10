/* Project shape and small string helpers. Pure logic: no DOM, so it also runs in Node tests. */
(function () {
  'use strict';

  const core = (globalThis.CodeLabCore = globalThis.CodeLabCore || {});

  function normalizeProject(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Not an object');

    // accept old/new shapes; fall back to empty strings
    const web = raw.web && typeof raw.web === 'object' ? raw.web : {};
    const pick = (...vals) => {
      for (const v of vals) if (typeof v === 'string') return v;
      return '';
    };

    return {
      version: 1,
      kind: 'web-only',
      name: pick(raw.name),
      assignment: pick(raw.assignment, raw.task),
      test: pick(raw.test, raw.tests),
      hiddenTests: raw.hiddenTests === true,
      html: pick(raw.html, web.html),
      css: pick(raw.css, web.css),
      js: pick(raw.js, web.js),
    };
  }

  const escapeHtml = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  core.normalizeProject = normalizeProject;
  core.escapeHtml = escapeHtml;
})();
