// An uma's family tree (itself, both parents, four grandparents) for the lineage overlay
import type { Ancestor, LegacyParent, StoredUma } from './UmaTypes';
import { sumSparks, type SparkTotal } from './UmaFilter';

export type LineageSlot = 'combined' | 'self' | 'a' | 'a1' | 'a2' | 'b' | 'b1' | 'b2';

export interface LineageView {
	slot: LineageSlot;
	label: string;
	variantId?: number; // for the name and portrait
	totals: SparkTotal[] | null; // null = not known (no parent recorded, or grandparents not imported yet)
	combined: boolean; // totals include the parents' sparks, so own counts are worth showing
}

// Saved parents are looked up in byId; an imported parent with nothing in it means the dump had none
function resolveParent(p: LegacyParent, byId: Map<string, StoredUma>): StoredUma | Ancestor | undefined {
	if (p.kind === 'saved') return byId.get(p.umaId);
	if (p.variantId === undefined && p.sparks.length === 0) return undefined;
	return { variantId: p.variantId ?? 0, sparks: p.sparks };
}

export function lineageViews(uma: StoredUma, byId: Map<string, StoredUma>): LineageView[] {
	const parents = uma.parents.map(p => resolveParent(p, byId));
	const inherited = parents.flatMap(p => p?.sparks ?? []);

	// Grandparents come from the dump. For umas imported before they were stored,
	// a saved parent's own parents are the same umas, so fall back to those.
	const grandparents = [0, 1].map(side => {
		const stored = uma.grandparents?.[side];
		if (stored) return stored;
		const parent = parents[side];
		return parent && 'parents' in parent ? parent.parents.map(p => resolveParent(p, byId) ?? null) : [null, null];
	});

	const view = (slot: LineageSlot, label: string, member: StoredUma | Ancestor | null | undefined): LineageView => ({
		slot, label, variantId: member?.variantId, totals: member ? sumSparks(member.sparks) : null, combined: false,
	});

	return [
		{ slot: 'combined', label: 'Combined', variantId: uma.variantId, totals: sumSparks(uma.sparks, inherited), combined: true },
		view('self', 'Self', uma),
		view('a', 'Parent A1', parents[0]),
		view('a1', 'GP A1', grandparents[0][0]),
		view('a2', 'GP A2', grandparents[0][1]),
		view('b', 'Parent B1', parents[1]),
		view('b1', 'GP B1', grandparents[1][0]),
		view('b2', 'GP B2', grandparents[1][1]),
	];
}

// ---------- Loops ----------
// A white spark is fully looped when the uma and both parents all have it. Grandparents don't count.

export const LOOP_SLOTS = ['self', 'a', 'b'] as const;

export interface LoopRow {
	base: number;
	stars: (number | null)[]; // per LOOP_SLOTS: stars, 0 = doesn't have it, null = member unknown
	count: number; // how many of the three have it
}

export function loopRow(views: Map<LineageSlot, LineageView>, base: number): LoopRow {
	const stars = LOOP_SLOTS.map(slot => {
		const totals = views.get(slot)?.totals;
		return totals ? totals.find(t => t.base === base)?.total ?? 0 : null;
	});
	return { base, stars, count: stars.filter(s => s).length };
}

// White sparks at least `min` of the three have, most looped first
export function loopCandidates(views: Map<LineageSlot, LineageView>, min: number): number[] {
	const whites = views.get('combined')!.totals!.filter(t => t.category === 'white').map(t => t.base);
	return whites.map(b => loopRow(views, b)).filter(r => r.count >= min).sort((a, b) => b.count - a.count).map(r => r.base);
}
