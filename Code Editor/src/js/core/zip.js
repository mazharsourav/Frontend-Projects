/* Minimal ZIP writer (stored, no compression), enough for a few text files,
   plus the file list a project becomes when exported as a folder. */
(function () {
  'use strict';

  const core = (globalThis.CodeLabCore = globalThis.CodeLabCore || {});

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeZip(files) {
    const enc = new TextEncoder();
    const u16 = n => [n & 0xff, (n >>> 8) & 0xff];
    const u32 = n => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
    const DOS_DATE = 0x21;      // 1980-01-01
    const FLAGS = 0x0800;       // UTF-8 names

    const parts = [], central = [];
    let offset = 0;

    for (const f of files) {
      const name = enc.encode(f.name);
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data);

      const local = Uint8Array.from([
        0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(FLAGS), ...u16(0), ...u16(0), ...u16(DOS_DATE),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
      ]);
      parts.push(local, name, data);

      central.push(Uint8Array.from([
        0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(FLAGS), ...u16(0), ...u16(0), ...u16(DOS_DATE),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
        ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ]), name);

      offset += local.length + name.length + data.length;
    }

    const cdSize = central.reduce((n, c) => n + c.length, 0);
    const end = Uint8Array.from([
      0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
      ...u32(cdSize), ...u32(offset), ...u16(0),
    ]);

    const all = [...parts, ...central, end];
    const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
    let pos = 0;
    for (const p of all) { out.set(p, pos); pos += p.length; }
    return out;
  }

  function projectFiles(project) {
    const p = core.normalizeProject(project);
    const index = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${core.escapeHtml(p.name || 'Project')}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
${p.html}
<script src="script.js"><\/script>
</body>
</html>
`;
    const files = [
      { name: 'index.html', data: index },
      { name: 'style.css', data: p.css },
      { name: 'script.js', data: p.js },
    ];
    if (p.assignment.trim()) files.push({ name: 'assignment.md', data: p.assignment });
    if (p.test.trim() && !p.hiddenTests) files.push({ name: 'tests.js', data: p.test });
    return files;
  }

  core.crc32 = crc32;
  core.makeZip = makeZip;
  core.projectFiles = projectFiles;
})();
