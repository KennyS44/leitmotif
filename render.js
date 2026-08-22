'use strict';

/* Sheet → audio buffer, in one place, because two pages now need it and an A/B
   comparison is worthless if the two sides are not produced identically.
 *
 * A variant is an optional pair of hooks used by the comparison page: one to
 * bend the parameters before the score is written, one to bend the score before
 * it is played. Everything else — the synthesiser, the levelling — stays the
 * same on both sides, so what is heard is the change and nothing else. */

(function renderer() {

const { characterToParams } = window.Mapping;
const { composeScore, renderScore } = window.Music;

/* Every theme leaves at the same height. A quiet character should sound quiet
   in its own shape — soft attacks, a thinner band — not by arriving at a lower
   volume than the file before it, which just reads as a worse recording.
 *
 * On the comparison page this matters twice over: of two versions of the same
 * edit, the louder one is preferred by the ear regardless of which is better. */
function levelled(buffer) {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i += 1) {
      const v = Math.abs(d[i]);
      if (v > peak) peak = v;
    }
  }
  if (peak < 0.0001) return buffer;
  const gain = Math.min(4, 0.89 / peak);
  if (Math.abs(gain - 1) < 0.02) return buffer;
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i += 1) d[i] *= gain;
  }
  return buffer;
}

function scoreFor(ch, variant) {
  const p = characterToParams(ch);
  if (variant && variant.params) variant.params(p, ch);
  const score = composeScore(p);
  if (variant && variant.score) variant.score(score, p, ch);
  return { p, score };
}

async function renderTheme(ch, variant) {
  const { p, score } = scoreFor(ch, variant);
  const rate = 44100;
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtx(2, Math.ceil(rate * score.duration), rate);
  renderScore(ctx, score, p, 0);
  return levelled(await ctx.startRendering());
}

window.Render = { renderTheme, scoreFor, levelled };

}());
