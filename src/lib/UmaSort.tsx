// Sorting for the uma list
import type { StoredUma } from './UmaTypes';
import { sparkTotals } from './UmaFilter';

export type SortKey = 'recent' | 'white' | 'icon' | 'notes';
export type SortDir = 'desc' | 'asc';

export const SORT_OPTIONS: { key: SortKey; label: string; directional: boolean }[] = [
	{ key: 'recent', label: 'Recently obtained', directional: true },
	{ key: 'white', label: 'No. of white sparks', directional: true },
	{ key: 'icon', label: 'Favorite icon', directional: false },
	{ key: 'notes', label: 'Has notes', directional: false },
];

// createdAt is the dump's "YYYY-MM-DD hh:mm:ss" for imports and ISO for manual entries
const obtainedAt = (u: StoredUma) => Date.parse(u.createdAt.replace(' ', 'T')) || 0;

const whiteCount = (u: StoredUma, byId: Map<string, StoredUma>, includeParents: boolean) =>
	sparkTotals(u, byId, includeParents).filter(s => s.category === 'white').length;

// Icons in game order, umas without one (0 or never imported) last
const iconRank = (u: StoredUma) => (u.iconType ? u.iconType : Infinity);

/**
 * Returns a sorted copy. `dir` only applies to the directional keys.
 * Ties fall back to newest first.
 * White spark counts follow includeParents, matching what the cards show.
 */
export function sortUmas(
	umas: StoredUma[],
	key: SortKey,
	dir: SortDir,
	byId: Map<string, StoredUma>,
	includeParents: boolean,
): StoredUma[] {
	const sign = dir === 'desc' ? -1 : 1;
	let primary: (a: StoredUma, b: StoredUma) => number;

	switch (key) {
		case 'recent':
			primary = (a, b) => sign * (obtainedAt(a) - obtainedAt(b));
			break;
		case 'white': {
			const counts = new Map(umas.map(u => [u.id, whiteCount(u, byId, includeParents)]));
			primary = (a, b) => sign * (counts.get(a.id)! - counts.get(b.id)!);
			break;
		}
		case 'icon':
			primary = (a, b) => {
				const ra = iconRank(a), rb = iconRank(b);
				return ra === rb ? 0 : ra < rb ? -1 : 1;
			};
			break;
		case 'notes':
			primary = (a, b) => Number(b.notes.trim() !== '') - Number(a.notes.trim() !== '');
			break;
	}

	return [...umas].sort((a, b) => primary(a, b) || obtainedAt(b) - obtainedAt(a));
}
