'use strict';

/* Twelve characters spread as far apart as the map allows — every metre, most
   of the modes, subclasses, a multiclass, and the two register extremes. If any
   two of these sound alike, the mapping is wrong; that is the whole test. */

window.PRESETS = [
  {
    name: 'Ser Aldric Vane',
    cls: 'paladin', sub: 'devotion', race: 'human', alignment: 'LG',
    traits: ['loyal', 'proud', 'stubborn'],
    looks: ['old', 'stern', 'scarred'],
    blurb: 'An old oath-keeper who has buried more friends than he can name.',
  },
  {
    name: 'Dame Ilsabet Cross',
    cls: 'paladin', sub: 'vengeance', race: 'human', alignment: 'LN',
    traits: ['cruel', 'loyal', 'calm'],
    looks: ['stern', 'gaunt'],
    blurb: 'Same oath, opposite ending. Keeps a list and is nearly through it.',
  },
  {
    name: 'Nymeria Sylvarion',
    cls: 'wizard', sub: 'illusion', race: 'elf', alignment: 'NG',
    traits: ['shy', 'curious', 'wise'],
    looks: ['gentle', 'elegant'],
    blurb: 'Speaks to nobody at the table and finishes everyone\'s sentences in her head.',
  },
  {
    name: 'Pip Underbough',
    cls: 'rogue', sub: 'thief', second: 'bard', race: 'halfling', alignment: 'CN',
    traits: ['cunning', 'cheerful', 'reckless'],
    looks: ['small', 'young'],
    blurb: 'Steals the purse, then sells you a song about the thief.',
  },
  {
    name: 'Grukk Skullsplitter',
    cls: 'barbarian', sub: 'berserker', race: 'halforc', alignment: 'CE',
    traits: ['rude', 'hotheaded', 'cruel'],
    looks: ['huge', 'scarred', 'filthy'],
    blurb: 'Has never once been talked out of anything.',
  },
  {
    name: 'Marrow',
    cls: 'warlock', sub: 'ancientone', race: 'tiefling', alignment: 'NE',
    traits: ['gloomy', 'greedy', 'calm'],
    looks: ['gaunt', 'weathered'],
    blurb: 'Signed something long ago and has stopped pretending to regret it.',
  },
  {
    name: 'Thora Ironvein',
    cls: 'cleric', sub: 'life', race: 'dwarf', alignment: 'LN',
    traits: ['honest', 'humble', 'brave'],
    looks: ['burly', 'weathered'],
    blurb: 'Keeps the ledger of the dead and reads it aloud every winter.',
  },
  {
    name: 'Fennick Sparrowquill',
    cls: 'bard', sub: 'lore', race: 'gnome', alignment: 'CG',
    traits: ['curious', 'cheerful', 'restless'],
    looks: ['small', 'elegant'],
    blurb: 'Knows a verse about your grandmother that you would rather he forgot.',
  },
  {
    name: 'Khorvash the Ninth',
    cls: 'fighter', race: 'dragonborn', alignment: 'LE',
    traits: ['proud', 'stubborn', 'brave'],
    looks: ['huge', 'radiant'],
    blurb: 'Counts his ancestors before every fight, out loud, in full.',
  },
  {
    name: 'Ashen Vell',
    cls: 'druid', sub: 'moon', race: 'tabaxi', alignment: 'CN',
    traits: ['restless', 'cunning', 'brave'],
    looks: ['young', 'scarred'],
    blurb: 'Answers questions about last night with a different set of teeth.',
  },
  {
    name: 'Brother Halloway',
    cls: 'monk', race: 'aasimar', alignment: 'TN',
    traits: ['calm', 'humble', 'wise'],
    looks: ['old', 'gentle'],
    blurb: 'Has not raised his voice in thirty years and has not needed to.',
  },
  {
    name: 'Ogrim Stoneback',
    cls: 'artificer', second: 'fighter', race: 'goliath', alignment: 'TN',
    traits: ['stubborn', 'honest', 'calm'],
    looks: ['huge', 'burly', 'weathered'],
    blurb: 'Builds the bridge, tests the bridge by standing on it.',
  },
  /* Ranger and sorcerer were the two classes no preset reached, so two of the
     thirteen could only be heard by rolling strangers until one turned up. That
     is fine for a spot check and useless for walking the classes one after
     another, which is what choosing a genre for each of them needs. */
  {
    name: 'Wrenna Halewood',
    cls: 'ranger', sub: 'hunter', race: 'halfelf', alignment: 'CG',
    traits: ['calm', 'loyal', 'restless'],
    looks: ['weathered', 'gaunt'],
    blurb: 'Knows every path out of the valley and has never had to use one.',
  },
  {
    name: 'Sabbath Ryn',
    cls: 'sorcerer', race: 'tiefling', alignment: 'CN',
    traits: ['reckless', 'hotheaded', 'curious'],
    looks: ['young', 'radiant'],
    blurb: 'The magic arrived first and has never once asked permission.',
  },
];

/* ------------------------------------------------------- rolling a stranger

   The point of the button is not to be a feature. It is the only honest way to
   look at the map: twelve chosen examples show what I decided to show, and a
   character nobody picked shows what the rules actually do. */

const SYLL = {
  head: ['Ael', 'Bran', 'Cor', 'Dun', 'El', 'Fen', 'Gar', 'Hal', 'Il', 'Jor',
         'Kel', 'Lir', 'Mor', 'Nyx', 'Ori', 'Pell', 'Quill', 'Rask', 'Syl',
         'Thal', 'Ur', 'Vor', 'Wyn', 'Zar'],
  tail: ['an', 'eth', 'ic', 'or', 'ia', 'un', 'ash', 'wen', 'dros', 'ik',
         'ara', 'ux', 'iel', 'mir', 'och', 'is'],
  sur: ['Ashdown', 'Blackfen', 'Coldharrow', 'Deepwater', 'Emberlin',
        'Fallowmoor', 'Grimsby', 'Hollowmere', 'Ironvale', 'Kettleworth',
        'Longbarrow', 'Mistvale', 'Nettlebridge', 'Oakenshield', 'Pyreford',
        'Quarrystone', 'Ravensholt', 'Stormcairn', 'Thornwood', 'Windmere'],
};

function rollCharacter() {
  const M = window.Mapping;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const keys = (obj) => Object.keys(obj);
  const some = (obj, n) => {
    const all = keys(obj).slice();
    const out = [];
    while (out.length < n && all.length) {
      out.push(all.splice(Math.floor(Math.random() * all.length), 1)[0]);
    }
    return out;
  };

  const cls = pick(keys(M.CLASSES));
  const subs = M.SUBCLASSES[cls];
  /* a subclass or a second class, not both — they are different statements */
  let sub = null;
  let second;
  const roll = Math.random();
  if (subs && roll < 0.55) sub = pick(keys(subs));
  else if (roll < 0.75) {
    second = pick(keys(M.CLASSES).filter((c) => c !== cls));
  }

  return {
    name: `${pick(SYLL.head)}${pick(SYLL.tail)} ${pick(SYLL.sur)}`,
    cls,
    sub,
    second,
    race: pick(keys(M.RACES)),
    alignment: pick(keys(M.ALIGNMENTS)),
    traits: some(M.TRAITS, 2 + Math.floor(Math.random() * 3)),
    looks: some(M.LOOKS, 1 + Math.floor(Math.random() * 3)),
    blurb: null,
  };
}

window.rollCharacter = rollCharacter;
