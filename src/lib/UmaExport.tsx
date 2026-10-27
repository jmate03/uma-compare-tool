// Converts a stored uma into the JSON alpha123's umalator accepts as an uma.
import type { Grade, StoredUma } from './UmaTypes';
import { skillRarity } from './UmaNames';

type Strategy = 'Oonige' | 'Nige' | 'Senkou' | 'Sasi' | 'Oikomi';

// Oonige (runaway) has no aptitude of its own: it's a front runner with this skill, graded by the front aptitude
const RUNAWAY_SKILL_ID = 202051;

const GRADE_ORDER = 'SABCDEFG';
const best = <T,>(entries: [T, Grade][]) =>
	entries.reduce((a, b) => (GRADE_ORDER.indexOf(b[1]) < GRADE_ORDER.indexOf(a[1]) ? b : a));

// The umalator has no race context here, so the single-value fields use the uma's best aptitude.
// `aptitudes` order: sprint mile medium long, front pace late end, turf dirt (surface last).
export function umalatorJson(uma: StoredUma): string {
	const { distance: d, style: s, track: t } = uma;
	const [bestStyle, strategyAptitude] = best<Strategy>([
		['Nige', s.front], ['Senkou', s.pace], ['Sasi', s.late], ['Oikomi', s.end],
	]);
	const strategy = bestStyle === 'Nige' && uma.skills.some(sk => sk.skillId === RUNAWAY_SKILL_ID) ? 'Oonige' : bestStyle;
	const unique = uma.skills.find(sk => skillRarity(sk.skillId) === 'unique');

	return JSON.stringify({
		mood: 2,
		popularity: 1,
		starCount: 3,
		uniqueLv: unique?.level ?? 1,
		outfitId: uma.variantId ? String(uma.variantId) : '',
		speed: uma.stats.speed,
		stamina: uma.stats.stamina,
		power: uma.stats.power,
		guts: uma.stats.guts,
		wisdom: uma.stats.wit,
		strategy,
		distanceAptitude: best([['', d.sprint], ['', d.mile], ['', d.medium], ['', d.long]])[1],
		surfaceAptitude: best([['', t.turf], ['', t.dirt]])[1],
		strategyAptitude,
		aptitudes: [d.sprint, d.mile, d.medium, d.long, s.front, s.pace, s.late, s.end, t.turf, t.dirt],
		skills: uma.skills.map(sk => String(sk.skillId)),
	});
}
