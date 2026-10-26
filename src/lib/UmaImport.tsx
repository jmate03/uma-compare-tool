// Converts umadump's trained_chara_data.json into StoredUma[].
import type { Grade, LegacyParent, Spark, SparkCategory, StoredUma } from './UmaTypes';

interface DumpFactor { factor_id: number; level: number }

interface DumpParent {
	position_id: number; // 10 / 20 = parents, 11/12/21/22 = grandparents (not passed on, ignored)
	card_id: number;
	factor_info_array: DumpFactor[];
	owner_viewer_id: number; // non-zero = borrowed from another player
}

// matches the fields from the dump json
export interface DumpUma {
	trained_chara_id: number;
	card_id: number;
	speed: number; stamina: number; power: number; guts: number; wiz: number;
	rank_score: number;
	proper_ground_turf: number; proper_ground_dirt: number;
	proper_distance_short: number; proper_distance_mile: number;
	proper_distance_middle: number; proper_distance_long: number;
	proper_running_style_nige: number; proper_running_style_senko: number;
	proper_running_style_sashi: number; proper_running_style_oikomi: number;
	factor_info_array: DumpFactor[];
	skill_array: { skill_id: number; level: number }[];
	succession_chara_array: DumpParent[];
	memo: string;
	icon_type: number;
	create_time: string;
}

// ---------- Decoding helpers ----------

// Game stores aptitudes as 1 = G ... 8 = S
const GRADE_BY_NUMBER: Grade[] = ['G', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];
const grade = (n: number): Grade => GRADE_BY_NUMBER[n] ?? 'G';

// Spark IDs: last digit = stars; the rest identifies the spark.
//   101–503        blue  (1 speed, 2 stamina, 3 power, 4 guts, 5 wit)
//   1101–3403      pink  (11 turf, 12 dirt, 21–24 front/pace/late/end, 31–34 sprint/mile/medium/long)
//   1xxxxxx        white race spark (factor_type 5)
//   2xxxxxx        white skill spark (skill ID + stars, factor_type 4)
//   3xxxxxx        white scenario spark (factor_type 6)
//   10xxxxxx       green unique spark (card ID + stars)
export function sparkCategory(factorId: number): SparkCategory {
	if (factorId < 1000) return 'blue';
	if (factorId < 10000) return 'pink';
	if (factorId >= 10_000_000) return 'green';
	return 'white';
}

function toSpark(f: DumpFactor): Spark {
	return {
		factorId: f.factor_id,
		category: sparkCategory(f.factor_id),
		stars: (f.factor_id % 10) as 1 | 2 | 3,
	};
}

// Identifies a specific uma by character + exact spark set.
// Used to recognize parents that are also your own veterans (the dump's
// succession_trained_chara_id fields are always 0, so can't link by ID).
const signature = (cardId: number, factors: DumpFactor[]) =>
	`${cardId}:${factors.map(f => f.factor_id).sort((a, b) => a - b).join(',')}`;

// ---------- Main conversion ----------

/**
 * Merges a dump into the existing umas.
 * - Matches existing umas by gameId, so re-importing updates instead of duplicating.
 * - Keeps fields (type, notes) on umas that are already stored, everything else refreshed from dump
 * - Links parents to saved umas where possible.
 */
export function importGameDump(raw: unknown, existing: StoredUma[]): StoredUma[] {
	if (!Array.isArray(raw)) throw new Error('Expected trained_chara_data.json (an array of veterans).');
	const dump = raw as DumpUma[];
	const now = new Date().toISOString();

	const byGameId = new Map(existing.filter(u => u.gameId !== undefined).map(u => [u.gameId!, u]));
	const result = new Map(existing.map(u => [u.id, u]));

	// Pass 1: create/update every veteran (parents filled in pass 2)
	const idByGameId = new Map<number, string>();
	for (const d of dump) {
		const prev = byGameId.get(d.trained_chara_id);
		const uma: StoredUma = {
			id: prev?.id ?? crypto.randomUUID(),
			gameId: d.trained_chara_id,
			variantId: d.card_id,
			type: prev?.type ?? 'both',
			notes: prev?.notes || d.memo || '',
			stats: { speed: d.speed, stamina: d.stamina, power: d.power, guts: d.guts, wit: d.wiz },
			track: { turf: grade(d.proper_ground_turf), dirt: grade(d.proper_ground_dirt) },
			distance: {
				sprint: grade(d.proper_distance_short), mile: grade(d.proper_distance_mile),
				medium: grade(d.proper_distance_middle), long: grade(d.proper_distance_long),
			},
			style: {
				front: grade(d.proper_running_style_nige), pace: grade(d.proper_running_style_senko),
				late: grade(d.proper_running_style_sashi), end: grade(d.proper_running_style_oikomi),
			},
			sparks: d.factor_info_array.map(toSpark),
			skills: (d.skill_array ?? []).map(s => ({ skillId: s.skill_id, level: s.level })),
			parents: prev?.parents ?? [
				{ kind: 'imported', sparks: [] },
				{ kind: 'imported', sparks: [] },
			],
			score: d.rank_score,
			iconType: d.icon_type,
			createdAt: prev?.createdAt ?? d.create_time ?? now,
			updatedAt: now,
		};
		result.set(uma.id, uma);
		idByGameId.set(d.trained_chara_id, uma.id);
	}

	// Pass 2: parents. Link to a saved veteran if one matches, otherwise store a copy.
	const idBySignature = new Map(dump.map(d => [signature(d.card_id, d.factor_info_array), idByGameId.get(d.trained_chara_id)!]));

	for (const d of dump) {
		const uma = result.get(idByGameId.get(d.trained_chara_id)!)!;
		const toParent = (positionId: 10 | 20): LegacyParent => {
			const p = d.succession_chara_array.find(s => s.position_id === positionId);
			if (!p) return { kind: 'imported', sparks: [] };
			const savedId = p.owner_viewer_id === 0 ? idBySignature.get(signature(p.card_id, p.factor_info_array)) : undefined;
			return savedId && savedId !== uma.id
				? { kind: 'saved', umaId: savedId }
				: { kind: 'imported', variantId: p.card_id, sparks: p.factor_info_array.map(toSpark) };
		};
		uma.parents = [toParent(10), toParent(20)];
	}

	return [...result.values()];
}