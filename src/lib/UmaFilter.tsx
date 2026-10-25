// Spark-based filtering for the uma list
import type { SparkCategory, StoredUma } from './UmaTypes';
import { sparkCategory } from './UmaImport';
import { SPARK_NAMES } from './UmaNames';

// A spark's identity is its factor ID without the last (stars) digit,
// so 2009701/2009702/2009703 are all "Sprint Corners" (base 200970).
export const sparkBase = (factorId: number) => Math.floor(factorId / 10);

export interface SparkOption {
	base: number;
	name: string;
	category: SparkCategory;
}

export const CATEGORY_ORDER: SparkCategory[] = ['blue', 'pink', 'green', 'white'];

// One entry per spark, for the filter picker. Names are unique per base.
// sparkCategory only looks at the ID's magnitude, so base * 10 works for it.
export const SPARK_OPTIONS: SparkOption[] = [...SPARK_NAMES].map(
	([base, name]) => ({ base, name, category: sparkCategory(base * 10) })
).sort((a, b) =>
	CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.name.localeCompare(b.name)
);

export const sparkByBase = new Map(SPARK_OPTIONS.map(o => [o.base, o]));

export const SPARK_OPTIONS_BY_CATEGORY = Object.fromEntries(
	CATEGORY_ORDER.map(c => [c, SPARK_OPTIONS.filter(o => o.category === c)])
) as Record<SparkCategory, SparkOption[]>;

export interface SparkFilter {
	id: string;
	category: SparkCategory;
	base: number | null; // null = any spark of this category
	minStars: number;
	// How this filter combines with the one before it in the same category.
	// Ignored on a category's first filter.
	join: 'and' | 'or';
}

export interface SparkTotal {
	base: number;
	category: SparkCategory;
	own: number;   // stars on the uma itself
	total: number; // own + parents (or just own when parents aren't included)
}

// Stars per spark for an uma, optionally including both parents' sparks.
// Sorted blue → pink → green → white, then by total stars.
export function sparkTotals(uma: StoredUma, byId: Map<string, StoredUma>, includeParents: boolean): SparkTotal[] {
	const totals = new Map<number, SparkTotal>();
	const add = (factorId: number, stars: number, isOwn: boolean) => {
		const base = sparkBase(factorId);
		const t = totals.get(base) ?? { base, category: sparkCategory(factorId), own: 0, total: 0 };
		if (isOwn) t.own += stars;
		t.total += stars;
		totals.set(base, t);
	};

	for (const s of uma.sparks) add(s.factorId, s.stars, true);
	if (includeParents) {
		for (const p of uma.parents) {
			const sparks = p.kind === 'saved' ? byId.get(p.umaId)?.sparks ?? [] : p.sparks;
			for (const s of sparks) add(s.factorId, s.stars, false);
		}
	}

	return [...totals.values()].sort((a, b) =>
		CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || b.total - a.total
	);
}

// Within a category, filters combine in order using their joins, with AND binding tighter than OR:
// "A or B and C" means "A or (B and C)". Categories are then ANDed together.
// An "any" filter matches if some spark of its category is high enough.
export function matchesSparkFilters(
	uma: StoredUma,
	filters: SparkFilter[],
	byId: Map<string, StoredUma>,
	includeParents: boolean
): boolean {
	if (filters.length === 0) return true;
	const totals = sparkTotals(uma, byId, includeParents);
	const byBase = new Map(totals.map(t => [t.base, t.total]));
	const matches = (f: SparkFilter) =>
		f.base === null
			? totals.some(t => t.category === f.category && t.total >= f.minStars)
			: (byBase.get(f.base) ?? 0) >= f.minStars;

	return CATEGORY_ORDER.every(category => {
		const rows = filters.filter(f => f.category === category);
		if (rows.length === 0) return true;
		// Split into OR-separated groups; one group must match in full
		const groups: SparkFilter[][] = [];
		rows.forEach((f, i) => {
			if (i === 0 || f.join === 'or') groups.push([f]);
			else groups[groups.length - 1].push(f);
		});
		return groups.some(g => g.every(matches));
	});
}
