import type { Preference, UserPrefs, Feeling, Pace, Depth, Era } from '../types';

function majorityValue<T extends string>(values: T[]): T {
  const counts = new Map<T, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = values[0];
  let bestCount = 0;
  for (const [v, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = v;
    }
  }
  return best;
}

export function computeOverlap(prefs: Preference[]): UserPrefs {
  return {
    feeling: majorityValue<Feeling>(prefs.map((p) => p.feeling)),
    pace: majorityValue<Pace>(prefs.map((p) => p.pace)),
    depth: majorityValue<Depth>(prefs.map((p) => p.depth)),
    era: majorityValue<Era>(prefs.map((p) => p.era)),
  };
}
