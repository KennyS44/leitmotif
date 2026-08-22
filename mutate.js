/* Mutation audit: break one thing on purpose, and see who notices.
 *
 * A suite reports how many checks passed, which says nothing about whether any
 * of them could have failed. This breaks the code in one specific way at a
 * time, runs the suite against the broken build, restores the file, and records
 * which assertions actually went red.
 *
 * What it is for is the last section of the output: assertions that no break
 * could disturb. That list is not proof they are useless — the mutations here
 * are a hand-written sample, not every possible fault — but nothing on it has
 * yet been shown to guard anything, and a check nobody can make fail is worse
 * than no check, because it is counted.
 *
 * Found on the first run: one assertion written as check(name, true, detail),
 * which is a print wearing a check's clothes.
 *
 * Run with ./dev.sh mutate. Source files are restored in a finally block, so an
 * interrupted run leaves nothing broken behind.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');

const M = [
  ['no ceiling on the melody', 'music.js',
    '  const TOP_NOTE = 96;', '  const TOP_NOTE = 300;'],

  ['nothing leans into the build phrase', 'music.js',
    '      const swell = plan.build ? 0.78 + 0.22 * (b / (barsPerPhrase - 1)) : 1;',
    '      const swell = 1;'],

  ['notes may be stabs', 'music.js',
    '  const MIN_NOTE = 0.16;', '  const MIN_NOTE = 0.01;'],

  ['every race walks in the same bar of rhythm', 'music.js',
    'function buildCell(p) {', 'function buildCell(p) { if (p) return [2, 1, 1, 1, 2, 1, 1, 1];'],

  ['the pad is voiced above the melody', 'music.js',
    '  const padRoot = p.root + PAD + stack;',
    '  const padRoot = p.root + PAD + stack + 36;'],

  ['the bass is voiced above the pad', 'music.js',
    '  const bassRoot = p.root + BASS + stack;',
    '  const bassRoot = p.root + BASS + stack + 24;'],

  ['no brightness ceiling on the accompaniment', 'mapping.js',
    '    tone: over > 0.02 ? 9000 * Math.pow(0.35, over * 2.2) : 0,', '    tone: 0,'],

  ['the accompaniment is trimmed to nothing', 'mapping.js',
    '    gain: clamp(1 - Math.max(0, c.cut - l.cut) * 0.9, 0.55, 1),', '    gain: 0.2,'],

  ['one shared stream of performance jitter again', 'music.js',
    '    const human = rng((p.seed ^ SALT[part]) >>> 0);',
    '    const human = (shared.used = shared.used || rng(p.seed >>> 0));'],

  ['bar shapes never come back', 'music.js',
    '      const barRand = rng((p.seed ^ ROLE_SALT[role] ^ (b * 2654435761)) >>> 0);',
    '      const barRand = rng((p.seed ^ ((b + 7) * 2654435761)) >>> 0);'],

  ['the mode never bends a degree', 'mapping.js',
    "  lydian:     { steps: [0, 2, 4, 6, 7, 9, 11], colour: 3 },    /* sharp fourth */",
    "  lydian:     { steps: [0, 2, 4, 6, 7, 9, 11], colour: null },"],

  ['the colour note is never marked as sounded', 'music.js',
    '          colour: isColour && !(lastBar && last),', '          colour: false,'],

  ['the percussion drifts off the grid', 'music.js',
    'function addPerc(out, p, t, timeOf, cell, beats, plan, swell, lastOfPhrase) {',
    'function addPerc(out, p, t, timeOf, cell, beats, plan, swell, lastOfPhrase) { t += 0.031;'],

  ['nobody joins the final chord but the melody', 'music.js',
    '  tracks.bass.push({ t: endAt, midi: bassRoot + tonic, dur: hold, vel: 0.62 });',
    '  if (false) tracks.bass.push({ t: endAt, midi: bassRoot + tonic, dur: hold, vel: 0.62 });'],

  ['every ending is cut short', 'music.js',
    '  const duration = endAt + hold + (abrupt ? 0.5 : 1.6);',
    '  const duration = endAt + hold + 0.2;'],

  ['a second class never brings a motif of its own', 'mapping.js',
    '  p.branchMotif = second ? drawMotif(second.family, (p.seed ^ 0x51ed270b) >>> 0) : null;',
    '  p.branchMotif = null;'],

  ['every character brings a second voice', 'mapping.js',
    '  p.branchMotif = second ? drawMotif(second.family, (p.seed ^ 0x51ed270b) >>> 0) : null;',
    "  p.branchMotif = drawMotif(CLASSES.bard.family, (p.seed ^ 0x51ed270b) >>> 0);"],

  ['the race instrument no longer strikes with the melody', 'music.js',
    '            tracks.hue.push({', '            if (n) tracks.hue.push({'],

  ['the tags do nothing', 'mapping.js',
    '  (ch.traits || []).forEach', '  [].forEach'],

  ['two characters of a class are twins', 'mapping.js',
    'function drawMotif(family, seed) {', 'function drawMotif(family, seed) { seed = 1;'],

  ['the melody wanders off the race grid', 'music.js',
    '  const onsets = onsetsOf(cell);',
    '  const onsets = onsetsOf(cell).map((x) => x + 0.017);'],
];

const run = (full) => {
  try {
    return execFileSync('node', full ? ['test.js', '--full'] : ['test.js'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) { return `${e.stdout || ''}${e.stderr || ''}`; }
};

/* the suite prints "  ok    name — detail" and "  FAIL  subject: name — detail",
   the label starting at column 8 in both */
const label = (l) => l.slice(8).split(' — ')[0].replace(/^[^:]+: /, '').trim();
const lines = (out, tag) => out.split('\n').filter((l) => l.startsWith(tag)).map(label);
const seen = (out) => [...lines(out, '  ok  '), ...lines(out, '  FAIL'), ...lines(out, '  open')];

const full = process.argv.includes('--full');
const base = run(full);
const all = new Set(seen(base));
console.log(`baseline: ${all.size} distinct assertions\n`);

const killed = new Set();
const missed = [];
for (const [name, file, from, to] of M) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(from)) { console.log(`SKIP    ${name} — anchor missing`); continue; }
  fs.writeFileSync(file, src.replace(from, to));
  let out;
  try { out = run(full); } finally { fs.writeFileSync(file, src); }
  const ran = seen(out).length;
  const caught = new Set(lines(out, '  FAIL '));
  if (ran < all.size * 0.5) { console.log(`BROKE   ${name} — the build stopped running, discarded`); continue; }
  caught.forEach((c) => killed.add(c));
  if (!caught.size) { missed.push(name); console.log(`MISSED  ${name}`); continue; }
  console.log(`caught  ${name}`);
  console.log(`        ${[...caught].slice(0, 3).join('; ')}${caught.size > 3 ? ` (+${caught.size - 3})` : ''}`);
}

console.log('\n--- assertions no mutation could make fail ---');
[...all].filter((n) => !killed.has(n)).sort().forEach((n) => console.log('   ', n));
console.log('\n--- breaks nothing noticed ---');
missed.forEach((n) => console.log('   ', n));
