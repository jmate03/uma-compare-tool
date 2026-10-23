// Display name lookups: umas from umavariantnames.json, sparks from umasparknames.json
import cardNames from '../../data/umavariantnames.json'
import sparkNames from '../../data/umasparknames.json'

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

// Portrait in public/icons. Files are chara_stand_{charaId}_{variantId}.png,
// where the character ID is the card ID without its last two digits.
export function umaIconUrl(u: { variantId?: number }): string | undefined {
	if (u.variantId === undefined) return undefined;
	return `${import.meta.env.BASE_URL}icons/chara_stand_${Math.floor(u.variantId / 100)}_${u.variantId}.png`;
}
