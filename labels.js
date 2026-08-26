'use strict';

/* Reading a character sheet out in words, and the language it is read in.
 *
 * Three pages need this now, and the language had been a variable inside one of
 * them — which is how two pages end up disagreeing about what language the site
 * is in. It lives here instead, with the dictionary lookup that goes with it.
 *
 * English is not a table: it is already in mapping.js as the label on every
 * class, race and tag, and the dictionaries only override it. A missing entry
 * therefore shows up as an English word rather than as a blank. */

(function labels() {

const { characterToParams, CLASSES, RACES, ALIGNMENTS, TRAITS, LOOKS } = window.Mapping;

let current = localStorage.getItem('leitmotif.lang') || 'en';

const dict = () => (current === 'ru' ? window.I18N.ru : null);

function label(kind, key, fallback) {
  const table = dict() && dict()[kind];
  return (table && table[key]) || fallback || key;
}

/* "Halfling Rogue / Bard, Thief · Chaotic Neutral" */
function line(ch, params) {
  const p = params || characterToParams(ch);
  const one = (k) => label('classes', k, CLASSES[k].label);
  const cls = one(ch.cls) + (ch.second ? ` / ${one(ch.second)}` : '');
  const oath = p.subLabel ? `, ${label('subclasses', ch.sub, p.subLabel)}` : '';
  return `${label('races', ch.race, RACES[ch.race].label)} ${cls}${oath}`
    + ` · ${label('alignments', ch.alignment, ALIGNMENTS[ch.alignment].label)}`;
}

function tags(ch) {
  const out = [];
  (ch.traits || []).forEach((t) => TRAITS[t] && out.push(label('traits', t, TRAITS[t].label)));
  (ch.looks || []).forEach((t) => LOOKS[t] && out.push(label('looks', t, LOOKS[t].label)));
  return out;
}

window.Sheet = {
  get lang() { return current; },
  set(next) {
    current = next;
    localStorage.setItem('leitmotif.lang', next);
    document.documentElement.lang = next;
  },
  /* Same, but without writing it down. The workbench reads in Russian whatever
     language the site is set to, and it must not change that setting on the way
     past — a page that silently rewrites a setting it only wanted to borrow is
     a page you stop trusting. */
  use(next) {
    current = next;
    document.documentElement.lang = next;
  },
  dict,
  label,
  line,
  tags,
};

}());
