'use strict';

/* Character sheet -> musical parameters.
 *
 * This file is the whole idea of the project. The synthesiser downstream is
 * generic: it plays whatever it is handed. Everything that makes a paladin
 * sound like a paladin is decided here, by hand.
 *
 * The rule that keeps it audible: every field owns a different musical axis.
 * If two fields both pushed on, say, tempo, their changes would cancel and the
 * user would hear nothing when editing either one.
 *
 *   class      -> the motif itself, and the instruments playing it
 *   subclass   -> a short fork off the motif, in a second voice
 *   race       -> the rhythmic cell everything else is built on
 *   alignment  -> mode and harmonic tension
 *   traits     -> how densely the cell is filled, how wide the motif reaches
 *   looks      -> register, timbre and space
 *
 * The two that carry identity are the motif and the cell. Everything else
 * dresses them: a trait can widen or thin the theme, but it cannot invent a
 * different one, and nothing is allowed to fight the pulse the race set.
 */

/* Each mode has one note that carries its identity — its "colour note", the
   degree that is bent away from the plain major scale. Sounding that one degree
   is what makes the mode audible; a melody that never touches it is in the mode
   on paper only. So every alignment names the scale degree the theme must hit.
 *
 * Ionian is the exception: it bends nothing, which is why plain major is the
 * mode that most easily sounds like every other plain major. It gets a
 * suspended fourth in the harmony and a pedal bass instead, so that "lawful
 * good" has a colour of its own rather than being the absence of one. */
const MODES = {
  lydian:     { steps: [0, 2, 4, 6, 7, 9, 11], colour: 3 },    /* sharp fourth */
  ionian:     { steps: [0, 2, 4, 5, 7, 9, 11], colour: null }, /* bends nothing */
  mixolydian: { steps: [0, 2, 4, 5, 7, 9, 10], colour: 6 },    /* flat seventh */
  dorian:     { steps: [0, 2, 3, 5, 7, 9, 10], colour: 5 },    /* natural sixth */
  aeolian:    { steps: [0, 2, 3, 5, 7, 8, 10], colour: 2 },    /* flat third */
  phrygian:   { steps: [0, 1, 3, 5, 7, 8, 10], colour: 1 },    /* flat second */
  locrian:    { steps: [0, 1, 3, 5, 6, 8, 10], colour: 4 },    /* flat fifth */
};

/* The nine alignments. The good/evil axis picks brightness, the law/chaos axis
   decides how far the mode is allowed to wander from the plain one. */
const ALIGNMENTS = {
  LG: { label: 'Lawful Good',     mode: 'ionian',     sync: 0.05, tension: -0.10, cadence: 1.00 },
  NG: { label: 'Neutral Good',    mode: 'ionian',     sync: 0.18, tension: -0.05, cadence: 0.80 },
  CG: { label: 'Chaotic Good',    mode: 'lydian',     sync: 0.40, tension:  0.05, cadence: 0.55 },
  LN: { label: 'Lawful Neutral',  mode: 'dorian',     sync: 0.05, tension:  0.00, cadence: 1.00 },
  TN: { label: 'True Neutral',    mode: 'dorian',     sync: 0.20, tension:  0.05, cadence: 0.75 },
  CN: { label: 'Chaotic Neutral', mode: 'mixolydian', sync: 0.45, tension:  0.15, cadence: 0.45 },
  LE: { label: 'Lawful Evil',     mode: 'aeolian',    sync: 0.05, tension:  0.25, cadence: 0.95 },
  NE: { label: 'Neutral Evil',    mode: 'phrygian',   sync: 0.22, tension:  0.35, cadence: 0.70 },
  CE: { label: 'Chaotic Evil',    mode: 'locrian',    sync: 0.50, tension:  0.50, cadence: 0.35 },
};

/* Class owns a FAMILY of motifs, not one motif.
 *
 * A single stored melody per class is the thing that makes a generator feel
 * like a menu: every paladin in the world would get the same tune, and picking
 * "paladin" would be picking a prepared file. So a class instead states the
 * rules a paladin's melody has to obey, and which melody inside those rules
 * this particular character gets is decided by the whole sheet.
 *
 *   steps   — the intervals this class is allowed to move by
 *   contour — where the line has to end up: rising, falling, arched, level
 *   target  — how far it must reach (the peak, for an arch)
 *   len     — how many notes
 *
 * Two paladins now come out related but not identical: same allowed intervals,
 * same upward reach, different melody. That is family resemblance, which is
 * what "class" should sound like.
 *
 * `lead` carries it, `pad` is the bed underneath, `perc` is the kit.
 *
 * Cleric and Paladin are deliberately far apart now, on the reading that their
 * official descriptions all but hand over: a cleric "reaches out to the divine
 * magic of the Outer Planes and channels it", a paladin is "united by oaths"
 * and "lives on the front lines". One receives power from outside, the other
 * swore it himself. So the cleric is a conduit — organ and choir, instruments
 * with no attack, that sound like a building rather than a person, a narrow
 * stepwise line that unfolds rather than pushes. The paladin asserts — brass
 * with a real attack, a marching kit, a motif that reaches up a fourth and
 * lands. Wisdom keeps a melody even; Charisma makes it reach. */
const CLASSES = {
  fighter:    { label: 'Fighter',    family: { steps: [2, 3, 4, -1, -2],  contour: 'arch', target: [3, 5],   len: [4, 4] },    lead: 'brass',  pad: 'strings', perc: 'martial', tempo:  +6, dyn: +0.10 },
  paladin:    { label: 'Paladin',    family: { steps: [2, 3, 4, 5],       contour: 'rise', target: [4, 7],   len: [4, 5] },    lead: 'brass',  pad: 'choir',   perc: 'martial', tempo:  -4, dyn: +0.14, leap: +0.15, cadence: +0.20, attack: 0.80 },
  barbarian:  { label: 'Barbarian',  family: { steps: [1, -1, -3, -4],    contour: 'fall', target: [-5, -2], len: [4, 4] },  lead: 'horn',   pad: 'dark',    perc: 'heavy',   tempo:  +4, dyn: +0.15, rough: 0.42, reg: -12, attack: 0.70 },
  cleric:     { label: 'Cleric',     family: { steps: [1, 2, -1, -2],     contour: 'arch', target: [2, 3],   len: [4, 4] },     lead: 'organ',  pad: 'choir',   perc: 'frame',   tempo: -12, rev: +0.20, leap: -0.15, cadence: +0.15, attack: 1.50 },
  druid:      { label: 'Druid',      family: { steps: [1, 2, 3, -1],      contour: 'arch', target: [2, 4],   len: [4, 5] },      lead: 'whistle',pad: 'air',     perc: 'frame',   tempo:  -2, orn: +0.20 },
  ranger:     { label: 'Ranger',     family: { steps: [1, 2, 3, -1],      contour: 'rise', target: [3, 5],   len: [4, 4] },     lead: 'fiddle', pad: 'strings', perc: 'frame',   tempo:  +2, cellMod: -0.10 },
  rogue:      { label: 'Rogue',      family: { steps: [-1, 1, -2, 2],     contour: 'flat', target: [-2, 2],  len: [4, 5] },      lead: 'pizz',   pad: 'dark',    perc: 'light',   tempo:  +6, sync: +0.20, cellMod: -0.10 },
  bard:       { label: 'Bard',       family: { steps: [1, 2, 3, 4, -1],   contour: 'arch', target: [3, 5],   len: [5, 5] },       lead: 'lute',   pad: 'strings', perc: 'light',   tempo:  +8, orn: +0.20 },
  monk:       { label: 'Monk',       family: { steps: [2, -2, 1, -1],     contour: 'flat', target: [-1, 1],  len: [4, 4] },       lead: 'flute',  pad: 'air',     perc: 'wood',    tempo:  +4, cellMod: -0.10 },
  wizard:     { label: 'Wizard',     family: { steps: [2, 3, 1],          contour: 'rise', target: [5, 8],   len: [4, 4] },     lead: 'harp',   pad: 'glass',   perc: 'wood',    tempo:  -4, rev: +0.15 },
  sorcerer:   { label: 'Sorcerer',   family: { steps: [3, 2, 4, -1],      contour: 'rise', target: [4, 7],   len: [4, 4] },   lead: 'glass',  pad: 'air',     perc: 'light',   tempo:  +2, orn: +0.25, rev: +0.10 },
  warlock:    { label: 'Warlock',    family: { steps: [-1, -2, -3, 1],    contour: 'fall', target: [-5, -2], len: [4, 4] },    lead: 'bell',   pad: 'dark',    perc: 'frame',   tempo:  -6, tension: +0.25, reg: -5 },
  artificer:  { label: 'Artificer',  family: { steps: [1, 2, -1],         contour: 'rise', target: [1, 3],   len: [4, 5] },  lead: 'pulse',  pad: 'organ',   perc: 'tick',    tempo:  +4, sync: +0.20 },
};

/* A subclass is not a second class, and it should not sound like one.
 *
 * A second class brings its own motif and its own voice — the character is two
 * things at once. A subclass bends the one motif the character already has: it
 * is the same paladin, sworn to a different oath. So a subclass replaces the
 * tail of the motif and nudges a few parameters, and that is all. The head of
 * the phrase still says "paladin"; the end of it says which kind.
 *
 * `tail` overwrites the last steps of the class motif — the small fork. */
const SUBCLASSES = {
  paladin: {
    devotion:  { label: 'Oath of Devotion',     tail: [7, 4],  cadence: +0.15, rev: +0.10, hue: 'choir' },
    ancients:  { label: 'Oath of the Ancients', tail: [6, 4],  orn: +0.15, tempo: -4, hue: 'flute' },
    vengeance: { label: 'Oath of Vengeance',    tail: [3, -4], tension: +0.35, attack: 0.55, dyn: +0.14, rough: 0.22, tempo: +6, hue: 'horn' },
    conquest:  { label: 'Oath of Conquest',     tail: [1, -5], tension: +0.30, reg: -7, dyn: +0.14, rough: 0.20, hue: 'dark' },
  },
  cleric: {
    life:      { label: 'Life Domain',      tail: [4, 2],  rev: +0.15, tension: -0.10, hue: 'choir' },
    light:     { label: 'Light Domain',     tail: [5, 7],  reg: +5, rev: +0.15, hue: 'glass' },
    tempest:   { label: 'Tempest Domain',   tail: [2, -3], dyn: +0.15, rough: 0.20, perc: 'heavy' },
    trickery:  { label: 'Trickery Domain',  tail: [1, -1], sync: +0.20, orn: +0.15, hue: 'pizz' },
  },
  wizard: {
    evocation: { label: 'Evocation',    tail: [7, 9],  dyn: +0.12, attack: 0.75 },
    illusion:  { label: 'Illusion',     tail: [6, 4],  orn: +0.20, rev: +0.15, hue: 'glass' },
    necromancy:{ label: 'Necromancy',   tail: [2, -2], tension: +0.25, reg: -7, hue: 'dark' },
  },
  rogue: {
    thief:     { label: 'Thief',            tail: [-2, 0], sync: +0.15, cellMod: +0.10 },
    assassin:  { label: 'Assassin',         tail: [-3, -1], tension: +0.20, dyn: -0.10, attack: 0.70 },
    trickster: { label: 'Arcane Trickster', tail: [2, 0],  orn: +0.20, hue: 'glass' },
  },
  barbarian: {
    berserker: { label: 'Path of the Berserker', tail: [1, -5], dyn: +0.12, rough: 0.15 },
    totem:     { label: 'Path of the Totem',     tail: [3, 0],  hue: 'whistle', orn: +0.15 },
    zealot:    { label: 'Path of the Zealot',    tail: [4, 2],  dyn: +0.10, hue: 'choir' },
  },
  warlock: {
    fiend:     { label: 'The Fiend',        tail: [-4, -2], tension: +0.20, rough: 0.15 },
    archfey:   { label: 'The Archfey',      tail: [1, 3],   orn: +0.25, hue: 'harp', reg: +5 },
    ancientone:{ label: 'The Great Old One', tail: [-1, -5], tension: +0.30, rev: +0.15, hue: 'dark' },
  },
  bard: {
    lore:      { label: 'College of Lore',  tail: [4, 2], orn: +0.20, hue: 'harp' },
    valor:     { label: 'College of Valour', tail: [5, 7], dyn: +0.12, perc: 'martial' },
  },
  ranger: {
    hunter:    { label: 'Hunter',        tail: [4, 2], dyn: +0.10 },
    beast:     { label: 'Beast Master',  tail: [3, 1], hue: 'whistle', orn: +0.15 },
  },
  druid: {
    land:      { label: 'Circle of the Land', tail: [3, 1], rev: +0.12, hue: 'harp' },
    moon:      { label: 'Circle of the Moon', tail: [1, -3], dyn: +0.12, rough: 0.15, perc: 'heavy' },
  },
};

/* WHAT EACH INSTRUMENT IS LIKE, so that instruments can be chosen against each
 * other instead of one at a time.
 *
 * Until now the four voices were picked independently — the class named its
 * lead and its pad, the second class named the counter, the race named its
 * colour — and the only rule between them was "do not repeat the lead". That is
 * a rule about difference, and difference is precisely what makes a band sound
 * like several soloists who happen to share a room.
 *
 * Instruments fuse into one voice when they agree and split into separate tunes
 * when they compete. Two things decide which happens:
 *
 *   bright — where the instrument puts its energy. Whatever is brightest is
 *            heard as the melody. An accompanying part brighter than the lead
 *            takes the top of the mix away from it, and the ear promotes it to
 *            a tune of its own.
 *   bite   — how hard the note starts. Parts that start alike merge into a
 *            blur; parts that start differently stay legible as one line and
 *            its answer without fighting.
 *   cut    — how much the instrument forces itself through everything else.
 *            A bell at half the level of a choir is still louder to the ear.
 *   fam    — how the sound is made. Relatives blend; strangers stack.
 */
const VOICES = {
  brass:   { fam: 'brass',  bright: 0.70, bite: 0.55, cut: 0.90 },
  horn:    { fam: 'brass',  bright: 0.40, bite: 0.40, cut: 0.70 },
  strings: { fam: 'bowed',  bright: 0.55, bite: 0.20, cut: 0.55 },
  fiddle:  { fam: 'bowed',  bright: 0.72, bite: 0.45, cut: 0.75 },
  choir:   { fam: 'vocal',  bright: 0.40, bite: 0.10, cut: 0.45 },
  air:     { fam: 'vocal',  bright: 0.35, bite: 0.05, cut: 0.30 },
  dark:    { fam: 'synth',  bright: 0.15, bite: 0.10, cut: 0.35 },
  pulse:   { fam: 'synth',  bright: 0.68, bite: 0.70, cut: 0.80 },
  organ:   { fam: 'pipe',   bright: 0.50, bite: 0.35, cut: 0.65 },
  flute:   { fam: 'pipe',   bright: 0.62, bite: 0.30, cut: 0.55 },
  whistle: { fam: 'pipe',   bright: 0.48, bite: 0.25, cut: 0.45 },
  glass:   { fam: 'struck', bright: 0.88, bite: 0.35, cut: 0.70 },
  bell:    { fam: 'struck', bright: 0.92, bite: 0.80, cut: 0.95 },
  lute:    { fam: 'pluck',  bright: 0.60, bite: 0.80, cut: 0.70 },
  pizz:    { fam: 'pluck',  bright: 0.58, bite: 0.90, cut: 0.75 },
  harp:    { fam: 'pluck',  bright: 0.66, bite: 0.60, cut: 0.60 },
  /* Outdoor voices. `cut` is deliberately low: they are a place rather than a
     part, and the blend rules must never promote one of them into the tune. */
  wind:    { fam: 'air',    bright: 0.30, bite: 0.05, cut: 0.20 },
  leaves:  { fam: 'air',    bright: 0.80, bite: 0.30, cut: 0.25 },
  birds:   { fam: 'air',    bright: 0.85, bite: 0.45, cut: 0.30 },
};

/* How well a candidate would sit behind a lead that is already chosen. Higher
   is a better fit, and nothing ever returns zero — a poor fit is still a sound,
   and the map should lean rather than forbid. */
function voiceFit(cand, lead) {
  const c = VOICES[cand];
  const l = VOICES[lead];
  if (!c || !l) return 0.5;
  let s = 1;
  /* the one rule that matters most: stay under the melody */
  s -= Math.max(0, c.bright - l.bright) * 1.6;
  /* a different attack is what lets two parts be told apart without either of
     them having to get louder */
  s += Math.min(0.45, Math.abs(c.bite - l.bite)) * 0.8;
  /* a relative of the lead blends into it; that is what an accompaniment is */
  s += c.fam === l.fam ? 0.30 : 0;
  /* and it must not shove as hard as the thing it is accompanying */
  s -= Math.max(0, c.cut - l.cut + 0.10) * 1.2;
  return Math.max(0.05, s);
}

/* Once the instruments are known, each accompanying one is trimmed to fit the
   lead it actually got — not to a fixed number decided in advance. The same
   harp sits differently behind a brass paladin and behind a choir cleric, and
   the fixed levels were a large part of why some pairings read as two pieces of
   music playing at once.
 *
 *   gain — pulled down by however much harder this voice cuts than the lead
 *   tone — a ceiling on its brightness, so nothing shines above the melody */
function blendFor(voice, lead) {
  const c = VOICES[voice];
  const l = VOICES[lead];
  if (!c || !l) return { gain: 1, tone: 0 };
  const over = Math.max(0, c.bright - l.bright);
  return {
    gain: clamp(1 - Math.max(0, c.cut - l.cut) * 0.9, 0.55, 1),
    /* 0 means "no ceiling"; anything brighter than the lead gets one, and the
       further over it is, the lower the ceiling comes down */
    tone: over > 0.02 ? 9000 * Math.pow(0.35, over * 2.2) : 0,
  };
}

/* A seeded draw that leans towards the voices which fit — variety, but only
   among instruments that will actually sit behind this lead. */
function weightedPick(list, lead, seed) {
  const w = list.map((v) => voiceFit(v, lead));
  const total = w.reduce((a, b) => a + b, 0);
  let r = seeded(seed >>> 0)() * total;
  for (let i = 0; i < list.length; i += 1) {
    r -= w[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

/* Race owns the rhythm — and not only which slots are struck, but the shape of
   the bar itself: how many beats it has, how those beats are subdivided, and
   whether the off-beats are pushed late.
 *
 * That last part is what was missing. Twelve races all walking in four-four
 * differ only in their footfalls; a race in three, a race in five and a race in
 * triplets differ in how they *move*. Metre is the coarsest rhythmic difference
 * there is, so it is the one the ear catches first.
 *
 *   beats — beats in a bar (4 = common time, 3 = a broad three, 5 = odd)
 *   cell  — one slot per subdivision: 2 = accent, 1 = note, 0 = rest
 *   swing — how far the off-beats are pushed late, 0 to about 0.4
 *
 * The melody takes its onsets from the cell, the bass plays its accents and the
 * kit plays all of it — one grid, so the parts sound like one band. */
const RACES = {
  human:      { label: 'Human',      beats: 4, cell: [2, 0, 1, 0, 2, 0, 1, 0] },
  elf:        { label: 'Elf', hue: 'flute',       beats: 4, cell: [2, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0],
                reg: +4,  orn: +0.25, legato: 1.40, rev: +0.10 },
  dwarf:      { label: 'Dwarf', hue: 'organ',      beats: 4, swing: 0.18, cell: [2, 0, 0, 2, 0, 0, 1, 0],
                reg: -12, orn: -0.10, dyn: +0.10, drone: true },
  halfling:   { label: 'Halfling', hue: 'fiddle',   beats: 4, swing: 0.33, cell: [2, 0, 1, 1, 0, 1, 0, 1],
                reg: +5,  tempo: +10, legato: 0.65, leap: +0.10 },
  gnome:      { label: 'Gnome', hue: 'glass',      beats: 5, cell: [2, 1, 0, 1, 1, 0, 1, 1, 0, 1],
                reg: +7,  tempo: +12, orn: +0.30, leap: +0.15, legato: 0.70 },
  tiefling:   { label: 'Tiefling', hue: 'whistle',   beats: 5, swing: 0.12, cell: [2, 0, 1, 0, 0, 1, 1, 0, 1, 0],
                tension: +0.25, orn: +0.15, reg: -3 },
  dragonborn: { label: 'Dragonborn', hue: 'brass', beats: 3, cell: [2, 0, 0, 0, 1, 0],
                reg: -5,  tempo: -8, dyn: +0.15 },
  /* Orc is a Player's Handbook species in its own right; Half-Orc and Half-Elf
     are kept because tables that still use the older rules have them. */
  orc:        { label: 'Orc', hue: 'horn',        beats: 4, cell: [2, 0, 1, 0, 2, 1, 0, 1],
                reg: -9,  tempo: +6, dyn: +0.18, orn: -0.20, rough: 0.15 },
  halforc:    { label: 'Half-Orc', hue: 'lute',   beats: 4, cell: [2, 0, 0, 1, 2, 0, 0, 1],
                reg: -7,  tempo: +4, dyn: +0.15, orn: -0.15 },
  halfelf:    { label: 'Half-Elf', hue: 'harp',   beats: 4, cell: [2, 0, 1, 0, 1, 0, 2, 0, 0, 1, 0, 0],
                reg: +3,  orn: +0.12, legato: 1.15 },
  tabaxi:     { label: 'Tabaxi', hue: 'fiddle',     beats: 4, swing: 0.40, cell: [0, 1, 1, 0, 2, 0, 1, 1],
                tempo: +10, sync: +0.20, legato: 0.60, leap: +0.15 },
  goliath:    { label: 'Goliath', hue: 'whistle',    beats: 3, cell: [2, 0, 0, 1, 0, 0],
                reg: -10, tempo: -6, dyn: +0.20 },
  aasimar:    { label: 'Aasimar', hue: 'glass',    beats: 4, cell: [2, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0],
                reg: +5,  rev: +0.20, tension: -0.10 },
};

/* Traits own how the melody behaves: loud or quiet, smooth or jagged, busy or
   sparse. Nothing here changes the instruments — that would fight the class. */
const TRAITS = {
  brave:      { label: 'Brave',       dyn: +0.15, leap: +0.15, rise: +0.30 },
  shy:        { label: 'Shy',         dyn: -0.30, leap: -0.20, cellMod: -0.15, reg: -2, flag: 'hushed' },
  rude:       { label: 'Rude',        dyn: +0.20, leap: +0.20, legato: 0.70, rough: 0.15, flag: 'abrupt' },
  kind:       { label: 'Kind',        dyn: -0.05, legato: 1.25, tension: -0.10 },
  cruel:      { label: 'Cruel',       tension: +0.30, leap: +0.10, legato: 0.75 },
  calm:       { label: 'Calm',        tempo: -8, legato: 1.35, cellMod: -0.15, dyn: -0.10, flag: 'settled' },
  restless:   { label: 'Restless',    tempo: +8, cellMod: +0.20, sync: +0.15 },
  proud:      { label: 'Proud',       dyn: +0.12, reg: -2, cadence: +0.20 },
  humble:     { label: 'Humble',      dyn: -0.15, leap: -0.15, orn: -0.10, flag: 'hushed' },
  cunning:    { label: 'Cunning',     sync: +0.25, orn: +0.15, tension: +0.10, cellMod: -0.05 },
  honest:     { label: 'Honest',      sync: -0.15, orn: -0.15, cadence: +0.25 },
  greedy:     { label: 'Greedy',      tension: +0.15, orn: +0.20, sync: +0.10 },
  loyal:      { label: 'Loyal',       cadence: +0.25, tension: -0.10, legato: 1.15 },
  reckless:   { label: 'Reckless',    tempo: +10, sync: +0.25, leap: +0.20, cadence: -0.25, flag: 'abrupt' },
  curious:    { label: 'Curious',     orn: +0.25, leap: +0.10, cellMod: +0.10 },
  cheerful:   { label: 'Cheerful',    tempo: +6, dyn: +0.08, tension: -0.15, cellMod: +0.10 },
  gloomy:     { label: 'Gloomy',      tempo: -10, tension: +0.15, reg: -5, dyn: -0.10 },
  stubborn:   { label: 'Stubborn',    sync: -0.20, orn: -0.20, dyn: +0.10, cellMod: -0.05 },
  wise:       { label: 'Wise',        tempo: -6, legato: 1.30, orn: -0.05, rev: +0.10, flag: 'settled' },
  hotheaded:  { label: 'Hot-headed',  tempo: +12, dyn: +0.15, sync: +0.20, legato: 0.70, flag: 'abrupt' },
};

/* Looks own timbre and space: how the instrument is played and what room it is
   played in. This is where a photo would eventually plug in. */
const LOOKS = {
  old:        { label: 'Old',        tempo: -10, reg: -7, attack: 1.60, rev: +0.15, flag: 'archaic' },
  young:      { label: 'Young',      tempo: +8,  reg: +5, attack: 0.75 },
  stern:      { label: 'Stern',      attack: 0.60, rev: -0.12, reg: -5, dyn: +0.10 },
  gentle:     { label: 'Gentle',     attack: 1.50, dyn: -0.15, rev: +0.10, flag: 'settled' },
  scarred:    { label: 'Scarred',    rough: 0.30, attack: 0.65, dyn: +0.05, flag: 'brittle' },
  beautiful:  { label: 'Beautiful',  rev: +0.20, tension: -0.10, legato: 1.20 },
  huge:       { label: 'Huge',       reg: -12, tempo: -6, dyn: +0.15, rev: +0.10 },
  /* Not the mirror of `huge`, on purpose. Height and depth are not symmetric to
     the ear: an octave down reads as weight, an octave up reads as shrill long
     before it reads as small. Named by Kenny as the one tag that squeaks. */
  small:      { label: 'Small',      reg: +7,  tempo: +6, dyn: -0.10 },
  weathered:  { label: 'Weathered',  rough: 0.20, reg: -4, tempo: -4, flag: 'archaic' },
  elegant:    { label: 'Elegant',    orn: +0.20, legato: 1.25, dyn: -0.05 },
  filthy:     { label: 'Filthy',     rough: 0.35, rev: -0.10, tension: +0.10, flag: 'brittle' },
  radiant:    { label: 'Radiant',    rev: +0.25, reg: +5, tension: -0.15 },
  gaunt:      { label: 'Gaunt',      dyn: -0.12, rev: +0.10, tension: +0.10, cellMod: -0.10 },
  burly:      { label: 'Burly',      reg: -9, dyn: +0.15, attack: 0.80 },
};

/* Every modifier above is added into this. Clamped at the end so that a
   character with five traits pulling the same way cannot break the engine. */
function baseParams() {
  return {
    tempo: 92,
    reg: 0,          /* semitones away from the default register */
    dyn: 0.62,       /* how loud the lead plays */
    cellMod: 0.00,   /* notes added to, or taken out of, the race's cell */
    leap: 0.30,      /* how wide the motif's steps are stretched */
    orn: 0.15,       /* grace notes on accents */
    sync: 0.20,      /* preference for off-beats when filling the cell */
    tension: 0.15,   /* dissonance allowed in the harmony */
    cadence: 0.75,   /* how firmly phrases land on the tonic */
    legato: 1.00,    /* note length multiplier */
    attack: 1.00,    /* attack time multiplier */
    rough: 0.00,     /* detune / noise in the timbre */
    rev: 0.30,       /* reverb send */
    rise: 0.00,      /* how far later phrases lift the motif */
    drone: false,
  };
}

const ADDITIVE = ['tempo', 'reg', 'dyn', 'cellMod', 'leap', 'orn', 'sync',
                  'tension', 'cadence', 'rough', 'rev', 'rise'];
const MULTIPLIED = ['legato', 'attack'];

function applyEntry(p, entry) {
  if (!entry) return;
  ADDITIVE.forEach((k) => { if (typeof entry[k] === 'number') p[k] += entry[k]; });
  MULTIPLIED.forEach((k) => { if (typeof entry[k] === 'number') p[k] *= entry[k]; });
  if (entry.drone) p.drone = true;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* A character is a plain object:
   { name, cls, second, race, alignment, traits: [], looks: [] } */
function characterToParams(ch) {
  const p = baseParams();
  const cls = CLASSES[ch.cls] || CLASSES.fighter;
  const race = RACES[ch.race] || RACES.human;
  const align = ALIGNMENTS[ch.alignment] || ALIGNMENTS.TN;

  applyEntry(p, cls);
  applyEntry(p, race);
  applyEntry(p, align);

  /* Optional fields only colour what the required three already decided.
     Weighted, so that no single tag can turn a paladin into a bard — but at
     0.85 rather than the old 0.6, because the class was drowning them out.
     A tag also gets to raise a FLAG, which is categorical the way a class is:
     "old" does not merely slow the tempo, it changes the harmony to open
     fifths. Numbers alone could always be out-shouted; a flag cannot. */
  p.flags = {};
  const soft = (entry) => {
    if (!entry) return;
    const part = {};
    ADDITIVE.forEach((k) => { if (typeof entry[k] === 'number') part[k] = entry[k] * 0.85; });
    MULTIPLIED.forEach((k) => {
      if (typeof entry[k] === 'number') part[k] = 1 + (entry[k] - 1) * 0.85;
    });
    applyEntry(p, part);
    if (entry.flag) p.flags[entry.flag] = true;
  };
  (ch.traits || []).slice(0, 5).forEach((t) => soft(TRAITS[t]));
  (ch.looks || []).slice(0, 5).forEach((t) => soft(LOOKS[t]));

  /* A subclass bends the class it belongs to: the head of the motif is kept,
     the tail is replaced, and a few parameters move. Applied before the motif
     is read so that the fork is part of the theme rather than decoration. */
  const sub = ch.sub && SUBCLASSES[ch.cls] ? SUBCLASSES[ch.cls][ch.sub] : null;
  if (sub) applyEntry(p, sub);

  /* The melody is drawn from the class's family using the whole sheet as the
     seed, so two paladins are relatives rather than copies. Cells and voices
     are still chosen outright — averaging two of those gives a third belonging
     to nobody, which is the mush we are avoiding. */
  p.seed = characterSeed(ch);
  p.motif = drawMotif(cls.family, p.seed);
  if (sub && sub.tail) {
    const head = p.motif.slice(0, Math.max(2, p.motif.length - sub.tail.length));
    p.motif = head.concat(sub.tail);
  }
  p.subLabel = sub ? sub.label : null;
  p.cell = race.cell;
  p.beats = race.beats || 4;
  p.swing = race.swing || 0;
  /* The race also brings one instrument of its own — a harp for elves, an
     organ for dwarves — which appears for part of the theme and then leaves.
     Rhythm alone turned out to be too quiet a signal for "which people is
     this": the ear reaches for timbre first. */
  /* the oath speaks louder than the bloodline: a subclass instrument wins */
  p.hue = (sub && sub.hue) || race.hue || null;

  /* A second class brings its own motif in as a fork: a short deviation in a
     second voice, so the multiclass is heard as "and also", not as a blur. */
  const second = ch.second ? CLASSES[ch.second] : null;
  p.lead = cls.lead;
  p.pad = cls.pad;
  p.perc = (sub && sub.perc) || cls.perc || (second && second.perc) || null;
  /* The second class answers in the lead's own instrument, not in one of its
     own. Its own timbre was tried, quietened, and still heard as a second tune
     running beside the first — quietening a voice does not stop it being a
     separate voice, and timbre is what the ear splits streams by. Answering in
     the same instrument keeps the "and also a rogue" as a reply rather than a
     rival. The cost, accepted: a multiclass no longer has a colour of its own.
     Decided by ear on the A/B page, 2026-08-22. */
  p.counter = second ? cls.lead : null;
  p.branchMotif = second ? drawMotif(second.family, (p.seed ^ 0x51ed270b) >>> 0) : null;
  /* A race colour that happens to be the class's own lead adds nothing — a
     dwarf cleric would be organ answered by organ. Fall back to the first
     instrument nobody else in the band is using. */
  const taken = [p.lead, p.counter];
  if (p.hue && taken.includes(p.hue)) {
    /* Picked by seed, not by taking the first free name off a list — that
       version handed a harp to almost everybody and quietly undid the variety
       the colour instrument was added for. Doubling the pad is allowed; only
       answering the lead with the lead itself is pointless.
     *
     * The draw is now weighted by how well each candidate would sit behind
     * this particular lead, so the replacement is still a surprise but never
     * an instrument that will turn into a competing tune. */
    const spare = ['harp', 'flute', 'fiddle', 'glass', 'whistle', 'lute', 'bell',
                   'choir', 'horn', 'organ', 'pizz']
      .filter((v) => !taken.includes(v) && v !== p.pad);
    p.hue = spare.length ? weightedPick(spare, p.lead, p.seed ^ 0x1b873593) : null;
  }
  /* Every accompanying voice is now trimmed against the lead it actually ended
     up with. This is the part that makes an instrument join a band rather than
     stand next to one: it arrives already knowing what is playing. */
  p.blend = {
    counter: blendFor(p.counter || p.lead, p.lead),
    hue: blendFor(p.hue || p.lead, p.lead),
    pad: blendFor(p.pad, p.lead),
  };
  if (second) {
    /* a fraction of the second class's character, so the mix leans primary */
    p.tempo += (second.tempo || 0) * 0.4;
    p.tension += (second.tension || 0) * 0.4;
  }

  /* When a class and a race pull in opposite directions — a broad, slow people
     carrying a quick, driving calling — the theme should show the strain rather
     than average it away. A wide mismatch pushes the tempo further out in the
     class's direction and moves the key a fourth, which the ear reads as the
     same character in a different tuning. Averaging would have produced a
     character who is neither, and sounded like nothing. */
  const clsPull = (cls.tempo || 0) / 12 + (cls.reg || 0) / 12;
  const racePull = (race.tempo || 0) / 12 + (race.reg || 0) / 12;
  p.strain = Math.min(1, Math.abs(clsPull - racePull) / 2.2);
  if (p.strain > 0.45) {
    p.tempo += Math.sign(clsPull - racePull) * 6 * p.strain;
  }

  p.mode = MODES[align.mode].steps;
  p.modeName = align.mode;
  p.colour = MODES[align.mode].colour;

  /* The key itself comes from the name, so two identical builds with different
     names are still distinguishable, but the character stays recognisable. */
  p.root = 45 + (hashString(ch.name || '') % 12);   /* A2 upwards */
  if (p.strain > 0.45) p.root = 45 + ((p.root - 45 + 5) % 12);

  p.tempo = clamp(Math.round(p.tempo), 52, 168);
  p.reg = clamp(Math.round(p.reg), -24, 24);
  p.dyn = clamp(p.dyn, 0.22, 1.00);
  p.cellMod = clamp(p.cellMod, -0.60, 0.60);
  p.leap = clamp(p.leap, 0.05, 0.90);
  p.orn = clamp(p.orn, 0.00, 0.80);
  p.sync = clamp(p.sync, 0.00, 0.70);
  p.tension = clamp(p.tension, 0.00, 0.85);
  p.cadence = clamp(p.cadence, 0.10, 1.00);
  p.legato = clamp(p.legato, 0.45, 1.90);
  p.attack = clamp(p.attack, 0.40, 2.20);
  p.rough = clamp(p.rough, 0.00, 0.70);
  p.rev = clamp(p.rev, 0.05, 0.75);
  p.rise = clamp(p.rise, -0.50, 0.60);

  return p;
}

/* Draws one melody out of a class's family, using the character's own seed.
 *
 * Generate a handful of candidates, score each against the family's contour and
 * reach, keep the best. Scoring rather than rejecting means it always returns
 * something — a family with a strict target never leaves a character silent. */
function drawMotif(family, seed) {
  const rand = seeded(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  let best = null;
  let bestScore = Infinity;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const len = family.len[0]
      + Math.floor(rand() * (family.len[1] - family.len[0] + 1));
    const m = [0];
    for (let i = 1; i < len; i += 1) m.push(m[i - 1] + pick(family.steps));

    const end = m[m.length - 1];
    const peak = Math.max(...m);
    const low = Math.min(...m);
    const [lo, hi] = family.target;
    let score = 0;

    if (family.contour === 'rise') {
      score += Math.max(0, lo - end) + Math.max(0, end - hi);
      if (end <= 0) score += 4;
    } else if (family.contour === 'fall') {
      score += Math.max(0, lo - end) + Math.max(0, end - hi);
      if (end >= 0) score += 4;
    } else if (family.contour === 'arch') {
      score += Math.max(0, lo - peak) + Math.max(0, peak - hi);
      score += Math.abs(end) > 2 ? Math.abs(end) - 2 : 0;
    } else {
      score += Math.max(0, Math.abs(peak - low) - 4);
      score += Math.max(0, lo - end) + Math.max(0, end - hi);
    }
    /* a melody that repeats one note is inside the rules and still no good */
    if (new Set(m).size < Math.min(3, m.length)) score += 3;

    if (score < bestScore) { bestScore = score; best = m; }
    if (score === 0) break;
  }
  return best;
}

/* Same character -> same number -> same theme, on any machine, forever.
   That is what makes a shared link play the tune the sender heard. */
/* A small deterministic generator, kept here so the map can draw a melody
   without depending on the player that comes after it. */
function seeded(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function characterSeed(ch) {
  const parts = [
    ch.name || '', ch.cls || '', ch.second || '', ch.race || '', ch.alignment || '',
    (ch.traits || []).slice().sort().join(','),
    (ch.looks || []).slice().sort().join(','),
  ];
  return hashString(parts.join('|'));
}

window.Mapping = { characterToParams, characterSeed, hashString, SUBCLASSES,
                   CLASSES, RACES, ALIGNMENTS, TRAITS, LOOKS, MODES, VOICES };
