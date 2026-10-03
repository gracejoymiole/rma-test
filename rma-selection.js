// Tag-aware question selection, shared by the four grade assessment pages.
//
// The pages previously served the first FIXED_COUNT questions every time and cut
// RANDOM_COUNT more from the tail. Two problems with that:
//
//   1. Every bank question after the fixed block sat in one flat pool, so a
//      student almost never saw items from the later topics.
//   2. Which bank questions appeared was decided by array position, not by the
//      grade/topic tags the blueprint already carries.
//
// Each page already knows the topic of every item through getMathObjective(i + 1),
// so selection can be driven by those tags instead of array order: the fixed
// block is always served, and the random block is spread across the topics that
// exist for that grade, so a student still gets a fair sample of the whole
// syllabus rather than whatever happened to sit at the end of the array.
//
// Selection is a pure function of its inputs. shuffle/rand can be injected so
// the behaviour is testable without Math.random.

(function (global) {
  "use strict";

  // Largest-remainder allocation: split `slots` across groups in proportion to
  // pool size, never handing out more than a group can actually supply.
  function allocate(groups, slots) {
    const names = Object.keys(groups);
    if (!names.length || slots <= 0) return {};

    // Every topic that exists in the pool gets at least one slot, as long as
    // there is room. Without this a topic could be crowded out entirely.
    const base = {};
    let handed = 0;
    names.forEach((n) => {
      if (handed < slots && groups[n].length > 0) {
        base[n] = 1;
        handed++;
      }
    });
    names.forEach((n) => { if (!(n in base)) base[n] = 0; });

    // Then share what is left by pool size.
    let remaining = slots - handed;
    while (remaining > 0) {
      const withRoom = names.filter((n) => base[n] < groups[n].length);
      if (!withRoom.length) break;
      const poolTotal = withRoom.reduce((sum, n) => sum + groups[n].length, 0);
      let best = null;
      let bestScore = -Infinity;
      withRoom.forEach((n) => {
        const exact = (remaining * groups[n].length) / poolTotal;
        const score = exact - base[n];
        if (score > bestScore) { bestScore = score; best = n; }
      });
      base[best]++;
      remaining--;
    }

    return base;
  }

  /**
   * selectByTopic({ length, fixedCount, randomCount, topicOf, shuffle })
   *   length       total number of questions available
   *   fixedCount   leading items that are always served
   *   randomCount  how many more to draw from the remaining pool
   *   topicOf      (index) => topic string
   *   shuffle      (array) => array, in place; defaults to Math.random
   * Returns { indices, byTopic, topicCounts } with indices shuffled for delivery.
   */
  function selectByTopic(opts) {
    const length = Math.max(0, opts.length | 0);
    const fixedCount = Math.min(Math.max(0, opts.fixedCount | 0), length);
    const randomCount = Math.min(Math.max(0, opts.randomCount | 0), length - fixedCount);
    const topicOf = opts.topicOf || (() => "UNKNOWN");
    const shuffle = opts.shuffle || defaultShuffle;

    const fixed = [];
    for (let i = 0; i < fixedCount; i++) fixed.push(i);

    const groups = {};
    for (let i = fixedCount; i < length; i++) {
      const t = topicOf(i) || "UNKNOWN";
      (groups[t] = groups[t] || []).push(i);
    }

    const quota = allocate(groups, randomCount);
    const picked = [];
    const byTopic = {};
    Object.keys(groups).sort().forEach((topic) => {
      const want = Math.min(quota[topic] || 0, groups[topic].length);
      if (want <= 0) { byTopic[topic] = []; return; }
      const bag = groups[topic].slice();
      shuffle(bag);
      const chosen = bag.slice(0, want);
      byTopic[topic] = chosen;
      chosen.forEach((i) => picked.push(i));
    });

    // If rounding left us short, top up from any topic that still has room.
    let spare = picked.slice();
    let guard = 0;
    while (picked.length < fixedCount + randomCount && spare.length && guard++ < 10000) {
      const next = spare.shift();
      if (picked.indexOf(next) === -1) {
        picked.push(next);
        const t = topicOf(next) || "UNKNOWN";
        (byTopic[t] = byTopic[t] || []).push(next);
      }
    }
    if (spare.length && guard >= 10000) {
      // Deterministic last resort: any unused pool index.
      for (let i = fixedCount; i < length && picked.length < fixedCount + randomCount; i++) {
        if (picked.indexOf(i) === -1) picked.push(i);
      }
    }

    const indices = fixed.concat(picked);
    shuffle(indices);

    const topicCounts = {};
    indices.forEach((i) => {
      const t = topicOf(i) || "UNKNOWN";
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });

    return { indices, byTopic, topicCounts };
  }

  function defaultShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = array[i];
      array[i] = array[j];
      array[j] = t;
    }
    return array;
  }

  const api = { selectByTopic, allocate, defaultShuffle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.RMASelection = api;
})(typeof window !== "undefined" ? window : globalThis);