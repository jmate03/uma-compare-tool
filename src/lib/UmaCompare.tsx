import type { StoredUma } from './UmaTypes';
import { skillRarity } from './UmaNames';
import { sparkTotals, type SparkTotal } from './UmaFilter';

// Keys for spark and skill entries that can be shared across compared umas.
// Blue/pink/green sparks and the uma's own unique always count as differences, so they get no key.

// White sparks count as shared by name; differing star counts are shown on the cards instead
export function sharedSparkKey(s: SparkTotal): string | null {
	return s.category === 'white' ? `spark:${s.base}` : null;
}

export function sharedSkillKey(skillId: number): string | null {
	return skillRarity(skillId) === 'unique' ? null : `skill:${skillId}`;
}

export interface StarRange {
	min: number;
	max: number;
}

export interface SharedInfo {
	keys: Set<string>; // keys that every one of the umas has
	sparkStars: Map<number, StarRange>; // spark base → range of total stars, for the shared sparks
}

export function sharedKeys(umas: StoredUma[], byId: Map<string, StoredUma>, includeParents: boolean): SharedInfo {
	const sparks = umas.map(u => sparkTotals(u, byId, includeParents));
	const keySets = umas.map((u, i) => new Set([
		...sparks[i].map(sharedSparkKey),
		...u.skills.map(s => sharedSkillKey(s.skillId)),
	].filter(k => k !== null)));
	const keys = keySets.reduce((acc, ks) => new Set([...acc].filter(k => ks.has(k))));

	const sparkStars = new Map<number, StarRange>();
	for (const s of sparks.flat()) {
		const key = sharedSparkKey(s);
		if (key === null || !keys.has(key)) continue;
		const r = sparkStars.get(s.base);
		sparkStars.set(s.base, r ? { min: Math.min(r.min, s.total), max: Math.max(r.max, s.total) } : { min: s.total, max: s.total });
	}
	return { keys, sparkStars };
}
