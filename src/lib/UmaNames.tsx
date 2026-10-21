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
