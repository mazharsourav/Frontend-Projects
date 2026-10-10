/* Infinite-loop guard.
   Adds "__lg();" at the start of every braced for/while/do body so an infinite loop throws
   after ~2s instead of freezing the tab. Best effort: if the rewritten code does not parse,
   the original is returned untouched. */
(function () {
  'use strict';

  const core = (globalThis.CodeLabCore = globalThis.CodeLabCore || {});

  function canParse(src) {
    try { new Function(src); return true; } catch (_) { return false; }
  }

  const isIdent = c => c !== undefined && /[A-Za-z0-9_$]/.test(c);
  const isSpace = c => c !== undefined && /\s/.test(c);

  function skipWs(s, i) {
    while (i < s.length && isSpace(s[i])) i++;
    return i;
  }

  // A "/" starts a regex (not a division) after an operator, "(" etc. or a keyword.
  function regexAllowed(s, i) {
    let j = i - 1;
    while (j >= 0 && isSpace(s[j])) j--;
    if (j < 0) return true;
    if ('(,=:[!&|?{};+-*%<>~^'.includes(s[j])) return true;
    return /(?:^|[^\w$])(?:return|typeof|case|in|of|delete|void|throw|new|else|do)$/.test(s.slice(Math.max(0, j - 7), j + 1));
  }

  function skipRegex(s, i) {
    let j = i + 1, inClass = false;
    while (j < s.length) {
      const c = s[j];
      if (c === '\n') return i + 1;
      if (c === '\\') { j += 2; continue; }
      if (c === '[') inClass = true;
      else if (c === ']') inClass = false;
      else if (c === '/' && !inClass) {
        j++;
        while (/[a-z]/i.test(s[j] || '')) j++;
        return j;
      }
      j++;
    }
    return i + 1;
  }

  function skipString(s, i) {
    const q = s[i];
    let j = i + 1;
    while (j < s.length) {
      const c = s[j];
      if (c === '\\') { j += 2; continue; }
      if (c === q) return j + 1;
      if (q === '`' && c === '$' && s[j + 1] === '{') {
        const close = findClose(s, j + 1, '{', '}');
        if (close < 0) return s.length;
        j = close + 1;
        continue;
      }
      if (q !== '`' && c === '\n') return j;
      j++;
    }
    return s.length;
  }

  // If s[i] starts a string, comment or regex literal, returns the index after it; else -1.
  function skipLiteral(s, i) {
    const c = s[i], d = s[i + 1];
    if (c === '"' || c === "'" || c === '`') return skipString(s, i);
    if (c === '/') {
      if (d === '/') { const j = s.indexOf('\n', i); return j < 0 ? s.length : j; }
      if (d === '*') { const j = s.indexOf('*/', i + 2); return j < 0 ? s.length : j + 2; }
      if (regexAllowed(s, i)) return skipRegex(s, i);
    }
    return -1;
  }

  // s[i] === open; returns the index of the matching close, or -1.
  function findClose(s, i, open, close) {
    let depth = 0;
    while (i < s.length) {
      const skipped = skipLiteral(s, i);
      if (skipped >= 0) { i = skipped; continue; }
      const c = s[i];
      if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return i; }
      i++;
    }
    return -1;
  }

  function insertGuards(src) {
    let out = '', i = 0;
    const n = src.length;

    while (i < n) {
      const skipped = skipLiteral(src, i);
      if (skipped >= 0) { out += src.slice(i, skipped); i = skipped; continue; }

      const c = src[i];
      const startsWord = isIdent(c) && !isIdent(src[i - 1]) && src[i - 1] !== '.';
      if (!startsWord) { out += c; i++; continue; }

      let j = i;
      while (j < n && isIdent(src[j])) j++;
      const word = src.slice(i, j);
      out += word;
      i = j;

      if (word === 'for' || word === 'while') {
        let k = skipWs(src, i);
        if (word === 'for' && src.startsWith('await', k)) k = skipWs(src, k + 5);
        if (src[k] === '(') {
          const close = findClose(src, k, '(', ')');
          const m = close < 0 ? -1 : skipWs(src, close + 1);
          if (m >= 0 && src[m] === '{') {
            out += src.slice(i, m + 1) + '__lg();';
            i = m + 1;
          }
        }
      } else if (word === 'do') {
        const m = skipWs(src, i);
        if (src[m] === '{') {
          out += src.slice(i, m + 1) + '__lg();';
          i = m + 1;
        }
      }
    }
    return out;
  }

  function guardLoops(src) {
    if (!canParse(src)) return src;       // let the browser report the real error
    try {
      const guarded = insertGuards(src);
      return canParse(guarded) ? guarded : src;
    } catch (_) {
      return src;
    }
  }

  core.guardLoops = guardLoops;
})();
