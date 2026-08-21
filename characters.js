'use strict';

/* Six characters chosen to be far apart on every axis the mapping uses.
   If two of these sound alike, the mapping is wrong — that is the whole test. */

window.PRESETS = [
  {
    name: 'Ser Aldric Vane',
    cls: 'paladin', second: null, race: 'human', alignment: 'LG',
    traits: ['loyal', 'proud', 'stubborn'],
    looks: ['old', 'stern', 'scarred'],
    blurb: 'An old oath-keeper who has buried more friends than he can name.',
  },
  {
    name: 'Nymeria Sylvarion',
    cls: 'wizard', second: null, race: 'elf', alignment: 'NG',
    traits: ['shy', 'curious', 'wise'],
    looks: ['gentle', 'elegant'],
    blurb: 'Speaks to nobody at the table and finishes everyone\'s sentences in her head.',
  },
  {
    name: 'Pip Underbough',
    cls: 'rogue', second: 'bard', race: 'halfling', alignment: 'CN',
    traits: ['cunning', 'cheerful', 'reckless'],
    looks: ['small', 'young'],
    blurb: 'Steals the purse, then sells you a song about the thief.',
  },
  {
    name: 'Grukk Skullsplitter',
    cls: 'barbarian', second: null, race: 'halforc', alignment: 'CE',
    traits: ['rude', 'hotheaded', 'cruel'],
    looks: ['huge', 'scarred', 'filthy'],
    blurb: 'Has never once been talked out of anything.',
  },
  {
    name: 'Marrow',
    cls: 'warlock', second: null, race: 'tiefling', alignment: 'NE',
    traits: ['gloomy', 'greedy', 'calm'],
    looks: ['gaunt', 'weathered'],
    blurb: 'Signed something long ago and has stopped pretending to regret it.',
  },
  {
    name: 'Thora Ironvein',
    cls: 'cleric', second: null, race: 'dwarf', alignment: 'LN',
    traits: ['honest', 'humble', 'brave'],
    looks: ['burly', 'weathered'],
    blurb: 'Keeps the ledger of the dead and reads it aloud every winter.',
  },
];
