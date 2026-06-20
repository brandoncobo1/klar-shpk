#!/usr/bin/env node
/*
 * build-inline.js — keeps klar.css as the single source of truth.
 *
 * Every HTML file inlines klar.css (for performance: no render-blocking
 * stylesheet request). This script re-injects the current klar.css into the
 * block between these two markers in each *.html file:
 *
 *     // ════ INLINED klar.css ... ════
 *     ...styles...
 *     // ════ END inlined klar.css ════
 *
 * USAGE:  node build-inline.js     (run after editing klar.css, before deploying)
 *
 * The page-specific <style> blocks and @font-face declarations live OUTSIDE the
 * markers and are never touched.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const START = '/* ════ INLINED klar.css (was render-blocking; inlined to remove the critical-path request) ════ */';
const END = '/* ════ END inlined klar.css ════ */';

const css = fs.readFileSync(path.join(dir, 'klar.css'), 'utf8').replace(/\s+$/, '');
const indented = css.split('\n').map(l => (l.length ? '    ' + l : l)).join('\n');
const block = `    ${START}\n${indented}\n    ${END}`;

// Matches the start marker (incl. leading indentation) through the end marker.
const re = /[ \t]*\/\* ════ INLINED klar\.css[\s\S]*?\/\* ════ END inlined klar\.css ════ \*\//;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let changed = 0;
for (const f of files) {
  const p = path.join(dir, f);
  const html = fs.readFileSync(p, 'utf8');
  if (!re.test(html)) { console.log(`skip      ${f}  (no inline markers)`); continue; }
  const out = html.replace(re, () => block);
  if (out !== html) { fs.writeFileSync(p, out); changed++; console.log(`inlined → ${f}`); }
  else console.log(`unchanged ${f}`);
}
console.log(`\nDone. ${changed} file(s) re-synced from klar.css.`);
