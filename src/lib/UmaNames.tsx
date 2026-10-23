// Display name lookups: umas from umavariantnames.json, sparks from umasparknames.json,
// skills from umaskillnames.json and umaskillrarity.json
import cardNames from '../../data/umavariantnames.json'
import sparkNames from '../../data/umasparknames.json'
import skillNames from '../../data/umaskillnames.json'
import skillRarities from '../../data/umaskillrarity.json'

const names = cardNames as Record<string, string>;

export function umaName(u: { variantId?: number }): string {
	return u.variantId !== undefined ? names[u.variantId] ?? 'Unknown' : 'Unknown';
}

// Spark name per base (factor ID without the stars digit). The JSON has one
// entry per star level, but the name is the same for all of them.
export const SPARK_NAMES = new Map(
	Object.entries(sparkNames as Record<string, string>).map(([id, name]) => [Math.floor(Number(id) / 10), name])
);

export function sparkName(base: number): string {
	return SPARK_NAMES.get(base) ?? `#${base}`;
}

export function skillName(id: number): string {
	return (skillNames as Record<string, string>)[id] ?? `#${id}`;
}

export type SkillRarity = 'white' | 'gold' | 'unique';

// umaskillrarity.json (generated from uma-skill-tools' skill_data.json): 1 = white, 2 = gold, 3–5 = unique (by star level), 6 = evolved gold.
// Inherited uniques (9xxxxx) are rarity 1, so they count as white.
export function skillRarity(id: number): SkillRarity {
	const r = (skillRarities as Record<string, number>)[id] ?? 1;
	return r >= 3 && r <= 5 ? 'unique' : r === 1 ? 'white' : 'gold';
}

// Portrait in public/icons. Files are chara_stand_{charaId}_{variantId}.png,
// where the character ID is the card ID without its last two digits.
export function umaIconUrl(u: { variantId?: number }): string | undefined {
	if (u.variantId === undefined) return undefined;
	return `${import.meta.env.BASE_URL}icons/chara_stand_${Math.floor(u.variantId / 100)}_${u.variantId}.png`;
}
