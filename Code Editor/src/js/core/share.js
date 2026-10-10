/* Share links.
   A project is shared as "#p=<token>". Token = "z." + base64url(deflate-raw(JSON)),
   or "r." + base64url(JSON) when CompressionStream is unavailable. Nothing is
   sent to a server; the link itself carries the project. */
(function () {
  'use strict';

  const core = (globalThis.CodeLabCore = globalThis.CodeLabCore || {});

  function toB64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromB64Url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function pipeThrough(bytes, stream) {
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
    return new Uint8Array(buf);
  }

  async function encodeShare(project) {
    const p = core.normalizeProject(project);
    const bytes = new TextEncoder().encode(JSON.stringify({
      name: p.name, assignment: p.assignment, test: p.test, hiddenTests: p.hiddenTests,
      html: p.html, css: p.css, js: p.js,
    }));
    if (typeof CompressionStream === 'function') {
      try {
        return 'z.' + toB64Url(await pipeThrough(bytes, new CompressionStream('deflate-raw')));
      } catch (_) {
        // older browsers have CompressionStream but not the "deflate-raw" format
      }
    }
    return 'r.' + toB64Url(bytes);
  }

  async function decodeShare(token) {
    const kind = token.slice(0, 2), body = token.slice(2);
    let bytes;
    if (kind === 'r.') {
      bytes = fromB64Url(body);
    } else if (kind === 'z.') {
      if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot open compressed links');
      bytes = await pipeThrough(fromB64Url(body), new DecompressionStream('deflate-raw'));
    } else {
      throw new Error('Unrecognised link format');
    }
    return core.normalizeProject(JSON.parse(new TextDecoder().decode(bytes)));
  }

  core.encodeShare = encodeShare;
  core.decodeShare = decodeShare;
})();
