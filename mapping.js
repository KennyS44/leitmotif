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
 *   class      -> instruments      (who is playing)
 *   subclass   -> a second voice   (the counter-melody)
 *   race       -> rhythm, register, ornament
 *   alignment  -> mode and harmonic tension
 *   traits     -> how the melody behaves
 *   looks      -> timbre and space
 */

/* Modes, ordered bright to dark. Alignment picks one of them. */
const MODES = {
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  ionian:     [0, 2, 4, 5, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  aeolian:    [0, 2, 3, 5, 7, 8, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
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

/* Class owns the instruments. `lead` carries the tune, `pad` is the bed
   underneath, `perc` is the pulse. A subclass or second class adds `counter`. */
const CLASSES = {
  fighter:    { label: 'Fighter',    lead: 'brass',  pad: 'strings', perc: 'martial', tempo:  +6, dyn: +0.10 },
  paladin:    { label: 'Paladin',    lead: 'brass',  pad: 'choir',   perc: 'martial', tempo:  -4, dyn: +0.10 },
  barbarian:  { label: 'Barbarian',  lead: 'horn',   pad: 'strings', perc: 'heavy',   tempo:  +4, dyn: +0.15, rough: 0.30, reg: -12 },
  cleric:     { label: 'Cleric',     lead: 'strings',pad: 'choir',   perc: null,      tempo:  -8, dyn:  0.00, rev: +0.15 },
  druid:      { label: 'Druid',      lead: 'flute',  pad: 'air',     perc: 'frame',   tempo:  -2, orn: +0.20 },
  ranger:     { label: 'Ranger',     lead: 'flute',  pad: 'strings', perc: 'frame',   tempo:  +2, dens: -0.05 },
  rogue:      { label: 'Rogue',      lead: 'pizz',   pad: 'air',     perc: 'light',   tempo:  +6, sync: +0.20, dens: -0.10 },
  bard:       { label: 'Bard',       lead: 'lute',   pad: 'strings', perc: 'light',   tempo:  +8, orn: +0.20 },
  monk:       { label: 'Monk',       lead: 'flute',  pad: 'air',     perc: 'wood',    tempo:  +4, dens: -0.10 },
  wizard:     { label: 'Wizard',     lead: 'bell',   pad: 'air',     perc: null,      tempo:  -4, rev: +0.15 },
  sorcerer:   { label: 'Sorcerer',   lead: 'bell',   pad: 'air',     perc: 'light',   tempo:  +2, orn: +0.25, rev: +0.10 },
  warlock:    { label: 'Warlock',    lead: 'bell',   pad: 'dark',    perc: null,      tempo:  -6, tension: +0.25, reg: -5 },
  artificer:  { label: 'Artificer',  lead: 'lute',   pad: 'air',     perc: 'wood',    tempo:  +4, sync: +0.20 },
};

/* Race owns rhythm, register and ornament — the cultural accent of the tune. */
const RACES = {
  human:      { label: 'Human' },
  elf:        { label: 'Elf',        reg: +7,  orn: +0.25, legato: 1.40, rev: +0.10 },
  dwarf:      { label: 'Dwarf',      reg: -12, orn: -0.10, dyn: +0.10, drone: true },
  halfling:   { label: 'Halfling',   reg: +5,  tempo: +10, legato: 0.65, dens: +0.15, leap: +0.10 },
  gnome:      { label: 'Gnome',      reg: +7,  tempo: +12, orn: +0.30, leap: +0.15, legato: 0.70 },
  tiefling:   { label: 'Tiefling',   tension: +0.25, orn: +0.15, reg: -3 },
  dragonborn: { label: 'Dragonborn', reg: -5,  tempo: -8, dyn: +0.15, dens: -0.20 },
  halforc:    { label: 'Half-Orc',   reg: -7,  tempo: +4, dyn: +0.15, orn: -0.15 },
  halfelf:    { label: 'Half-Elf',   reg: +3,  orn: +0.12, legato: 1.15 },
  tabaxi:     { label: 'Tabaxi',     tempo: +10, sync: +0.20, legato: 0.60, leap: +0.15 },
  goliath:    { label: 'Goliath',    reg: -10, tempo: -6, dyn: +0.20, dens: -0.15 },
  aasimar:    { label: 'Aasimar',    reg: +5,  rev: +0.20, tension: -0.10 },
};

/* Traits own how the melody behaves: loud or quiet, smooth or jagged, busy or
   sparse. Nothing here changes the instruments — that would fight the class. */
const TRAITS = {
  brave:      { label: 'Brave',       dyn: +0.15, leap: +0.15, rise: +0.30 },
  shy:        { label: 'Shy',         dyn: -0.25, leap: -0.15, dens: -0.15, reg: +5 },
  rude:       { label: 'Rude',        dyn: +0.20, leap: +0.20, legato: 0.70, rough: 0.15 },
  kind:       { label: 'Kind',        dyn: -0.05, legato: 1.25, tension: -0.10 },
  cruel:      { label: 'Cruel',       tension: +0.30, leap: +0.10, legato: 0.75 },
  calm:       { label: 'Calm',        tempo: -8, legato: 1.35, dens: -0.15, dyn: -0.10 },
  restless:   { label: 'Restless',    tempo: +8, dens: +0.20, sync: +0.15 },
  proud:      { label: 'Proud',       dyn: +0.12, reg: -2, cadence: +0.20 },
  humble:     { label: 'Humble',      dyn: -0.15, leap: -0.15, orn: -0.10 },
  cunning:    { label: 'Cunning',     sync: +0.25, orn: +0.15, tension: +0.10, dens: -0.05 },
  honest:     { label: 'Honest',      sync: -0.15, orn: -0.15, cadence: +0.25 },
  greedy:     { label: 'Greedy',      tension: +0.15, orn: +0.20, sync: +0.10 },
  loyal:      { label: 'Loyal',       cadence: +0.25, tension: -0.10, legato: 1.15 },
  reckless:   { label: 'Reckless',    tempo: +10, sync: +0.25, leap: +0.20, cadence: -0.25 },
  curious:    { label: 'Curious',     orn: +0.25, leap: +0.10, dens: +0.10 },
  cheerful:   { label: 'Cheerful',    tempo: +6, dyn: +0.08, tension: -0.15, dens: +0.10 },
  gloomy:     { label: 'Gloomy',      tempo: -10, tension: +0.15, reg: -5, dyn: -0.10 },
  stubborn:   { label: 'Stubborn',    sync: -0.20, orn: -0.20, dyn: +0.10, dens: -0.05 },
  wise:       { label: 'Wise',        tempo: -6, legato: 1.30, orn: -0.05, rev: +0.10 },
  hotheaded:  { label: 'Hot-headed',  tempo: +12, dyn: +0.15, sync: +0.20, legato: 0.70 },
};

/* Looks own timbre and space: how the instrument is played and what room it is
   played in. This is where a photo would eventually plug in. */
const LOOKS = {
  old:        { label: 'Old',        tempo: -10, reg: -7, attack: 1.60, rev: +0.15 },
  young:      { label: 'Young',      tempo: +8,  reg: +5, attack: 0.75 },
  stern:      { label: 'Stern',      attack: 0.60, rev: -0.12, reg: -5, dyn: +0.10 },
  gentle:     { label: 'Gentle',     attack: 1.50, dyn: -0.15, rev: +0.10 },
  scarred:    { label: 'Scarred',    rough: 0.25, attack: 0.70, dyn: +0.05 },
  beautiful:  { label: 'Beautiful',  rev: +0.20, tension: -0.10, legato: 1.20 },
  huge:       { label: 'Huge',       reg: -12, tempo: -6, dyn: +0.15, rev: +0.10 },
  small:      { label: 'Small',      reg: +12, tempo: +6, dyn: -0.10 },
  weathered:  { label: 'Weathered',  rough: 0.20, reg: -4, tempo: -4 },
  elegant:    { label: 'Elegant',    orn: +0.20, legato: 1.25, dyn: -0.05 },
  filthy:     { label: 'Filthy',     rough: 0.35, rev: -0.10, tension: +0.10 },
  radiant:    { label: 'Radiant',    rev: +0.25, reg: +5, tension: -0.15 },
  gaunt:      { label: 'Gaunt',      dyn: -0.12, rev: +0.10, tension: +0.10, dens: -0.10 },
  burly:      { label: 'Burly',      reg: -9, dyn: +0.15, attack: 0.80 },
};

/* Every modifier above is added into this. Clamped at the end so that a
   character with five traits pulling the same way cannot break the engine. */
function baseParams() {
  return {
    tempo: 92,
    reg: 0,          /* semitones away from the default register */
    dyn: 0.62,       /* how loud the lead plays */
    dens: 0.58,      /* how many notes per bar */
    leap: 0.30,      /* how far the melody jumps */
    orn: 0.15,       /* grace notes and runs */
    sync: 0.20,      /* off-beat placement */
    tension: 0.15,   /* dissonance allowed in the harmony */
    cadence: 0.75,   /* how firmly phrases land on the tonic */
    legato: 1.00,    /* note length multiplier */
    attack: 1.00,    /* attack time multiplier */
    rough: 0.00,     /* detune / noise in the timbre */
    rev: 0.30,       /* reverb send */
    rise: 0.00,      /* tilt of the melodic contour */
    drone: false,
  };
}

const ADDITIVE = ['tempo', 'reg', 'dyn', 'dens', 'leap', 'orn', 'sync',
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
     Halved so that no single tag can turn a paladin into a bard. */
  const soft = (entry) => {
    if (!entry) return;
    const half = {};
    ADDITIVE.forEach((k) => { if (typeof entry[k] === 'number') half[k] = entry[k] * 0.6; });
    MULTIPLIED.forEach((k) => {
      if (typeof entry[k] === 'number') half[k] = 1 + (entry[k] - 1) * 0.6;
    });
    applyEntry(p, half);
  };
  (ch.traits || []).slice(0, 5).forEach((t) => soft(TRAITS[t]));
  (ch.looks || []).slice(0, 5).forEach((t) => soft(LOOKS[t]));

  /* Instruments are not blended — they are chosen. A second class brings in a
     counter-melody voice, which is how a multiclass becomes audible. */
  const second = ch.second ? CLASSES[ch.second] : null;
  p.lead = cls.lead;
  p.pad = cls.pad;
  p.perc = cls.perc || (second && second.perc) || null;
  p.counter = second && second.lead !== cls.lead ? second.lead : null;
  if (second) {
    /* half a step of the second class's character, so the mix leans primary */
    p.tempo += (second.tempo || 0) * 0.4;
    p.tension += (second.tension || 0) * 0.4;
  }

  p.mode = MODES[align.mode];
  p.modeName = align.mode;

  /* The key itself comes from the name, so two identical builds with different
     names are still distinguishable, but the character stays recognisable. */
  p.root = 45 + (hashString(ch.name || '') % 12);   /* A2 upwards */

  p.tempo = clamp(Math.round(p.tempo), 52, 168);
  p.reg = clamp(Math.round(p.reg), -24, 24);
  p.dyn = clamp(p.dyn, 0.22, 1.00);
  p.dens = clamp(p.dens, 0.20, 0.95);
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

  p.seed = characterSeed(ch);
  return p;
}

/* Same character -> same number -> same theme, on any machine, forever.
   That is what makes a shared link play the tune the sender heard. */
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

window.Mapping = { characterToParams, characterSeed, hashString,
                   CLASSES, RACES, ALIGNMENTS, TRAITS, LOOKS, MODES };
