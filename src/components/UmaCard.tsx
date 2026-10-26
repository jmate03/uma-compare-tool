import { useState, type ReactNode } from 'react';
import type { Grade, StoredUma } from '../lib/UmaTypes';
import { skillName, skillRarity, sparkName, umaIconUrl, umaName, type SkillRarity } from '../lib/UmaNames';
import { isRaceOrScenarioSpark, sparkTotals, type SparkTotal } from '../lib/UmaFilter';
import { sharedSkillKey, sharedSparkKey, type SharedInfo } from '../lib/UmaCompare';

export type CardMode = 'parent' | 'ace';

// Typing past the cap is allowed, but notes over it aren't saved until trimmed
const NOTES_LIMIT = 100;
const NOTES_WARN_AT = 80; // character counter appears past this

export const COMPARE_LIMIT = 4;

// Parent mode shows sparks and parents; ace mode shows stats, aptitudes and skills instead
interface UmaCardProps {
	uma: StoredUma;
	mode: CardMode;
	byId: Map<string, StoredUma>; // to look up parents that are your own saved umas
	includeParents: boolean; // show sparks summed with both parents' sparks
	hideRaceScenario?: boolean; // tuck race/scenario sparks into the collapsible section
	highlighted: Set<number>; // spark bases from the active filters
	onNotesChange: (id: string, notes: string) => void;
	onDelete?: (id: string) => void; // no Delete button when omitted
	// Compare checkbox; shown only when onToggleSelect is given
	selected?: boolean;
	selectDisabled?: boolean; // compare cap reached
	onToggleSelect?: (id: string) => void;
	// Compare view: entries every compared uma has go in a collapsible section (see lib/UmaCompare)
	shared?: SharedProps;
}

interface SharedProps extends SharedInfo {
	open: boolean; // kept in sync across the compared cards
	onToggle: (open: boolean) => void;
}

export function UmaCard({ uma, mode, byId, includeParents, hideRaceScenario = false, highlighted, onNotesChange, onDelete, selected = false, selectDisabled = false, onToggleSelect, shared }: UmaCardProps) {
	const [notes, setNotes] = useState(uma.notes);
	// Pick up notes saved from another card of the same uma (the compare overlay)
	const [savedNotes, setSavedNotes] = useState(uma.notes);
	if (uma.notes !== savedNotes) {
		setSavedNotes(uma.notes);
		setNotes(uma.notes);
	}
	const overLimit = notes.length > NOTES_LIMIT;

	// Names look like "[Outfit] Character"; the outfit goes on its own smaller line
	const fullName = umaName(uma);
	const [, outfit, charaName] = fullName.match(/^\[(.*?)\]\s*(.*)$/) ?? [null, null, fullName];
	const iconUrl = umaIconUrl(uma);

	const parentNames = uma.parents.map(p =>
		p.kind === 'saved' ? umaName(byId.get(p.umaId) ?? {}) : umaName(p)
	);

	function renderSpark(s: SparkTotal) {
		const name = sparkName(s.base);
		// Shared sparks with differing stars: the highest is highlighted, the rest show how far behind they are
		const range = shared?.sparkStars.get(s.base);
		const best = range && range.min < range.max && s.total === range.max;
		const behind = range ? s.total - range.max : 0;
		const className = `spark spark--${s.category}${highlighted.has(s.base) ? ' spark--match' : ''}${best ? ' spark--best' : ''}`;
		const diff = behind < 0 && (
			<span className="spark__diff" aria-label={`${-behind} stars fewer than the best`}>{behind} ★</span>
		);
		return includeParents ? (
			<span
				key={s.base}
				className={className}
				title={s.own ? `${s.own}★ on this uma, ${s.total - s.own}★ from parents` : 'From parents only'}
			>
				{/* Green sparks are one per uma, so a plain marker is enough; others show the uma's own count */}
				{s.own > 0 && s.category === 'green' && <span className="spark__own" aria-label="On this uma">●</span>}
				<span className="spark__stars">{s.total} ★</span> {name}
				{s.own > 0 && s.category !== 'green' && (
					<span className="spark__own-count" aria-label={`${s.own} stars on this uma`}>
						<span className="spark__own">●</span>{s.own} ★
					</span>
				)}
				{diff}
			</span>
		) : (
			<span key={s.base} className={className}>
				<span className="spark__stars">{s.total} ★</span> {name}
				{diff}
			</span>
		);
	}

	return (
		<article className={`uma-card${selected ? ' uma-card--selected' : ''}`}>
			<header className="uma-card__header">
				{iconUrl && (
					<img
						className="uma-card__portrait"
						src={iconUrl}
						alt=""
						width={56}
						height={56}
						loading="lazy"
						decoding="async"
						onError={e => { e.currentTarget.style.display = 'none'; }}
					/>
				)}
				<h2 className="uma-card__name" title={fullName}>
					{outfit && <span className="uma-card__outfit">{outfit}</span>}
					{charaName}
				</h2>
				{uma.score !== undefined && <span className="uma-card__score">{uma.score.toLocaleString()}</span>}
			</header>

			{mode === 'ace' ? <AceDetails uma={uma} shared={shared} /> : (
				<SplitShared
					items={sparkTotals(uma, byId, includeParents)}
					keyOf={sharedSparkKey}
					// Sparks an active filter names stay visible
					isHidden={s => hideRaceScenario && isRaceOrScenarioSpark(s.base) && !highlighted.has(s.base)}
					shared={shared}
					className="uma-card__sparks"
					render={renderSpark}
				/>
			)}

			{/* Saved on blur rather than per keystroke */}
			<div className="uma-card__notes-wrap">
				<textarea
					className={`uma-card__notes${overLimit ? ' uma-card__notes--over' : ''}`}
					placeholder="Uma Notes"
					rows={2}
					value={notes}
					onChange={e => setNotes(e.target.value)}
					onBlur={() => { if (!overLimit && notes !== uma.notes) onNotesChange(uma.id, notes); }}
				/>
				{notes.length > NOTES_WARN_AT && (
					<span className={`uma-card__notes-count${overLimit ? ' uma-card__notes-count--over' : ''}`}>
						{overLimit ? 'Too long, not saved: ' : ''}{notes.length}/{NOTES_LIMIT}
					</span>
				)}
			</div>

			<footer className="uma-card__footer">
				{mode === 'parent' && (
					<span className="uma-card__parents" title={parentNames.join(' × ')}>
						Parents: {parentNames.join(' × ')}
					</span>
				)}
				<div className="uma-card__actions">
					{onToggleSelect && (
						<label
							className="uma-card__compare"
							title={selectDisabled ? `Up to ${COMPARE_LIMIT} umas can be compared at once` : undefined}
						>
							<input
								type="checkbox"
								checked={selected}
								disabled={selectDisabled}
								onChange={() => onToggleSelect(uma.id)}
							/>
							Compare
						</label>
					)}
					{onDelete && <button className="uma-card__delete" onClick={() => onDelete(uma.id)}>Delete</button>}
				</div>
			</footer>
		</article>
	);
}

const STATS = [
	['speed', 'Speed'], ['stamina', 'Stamina'], ['power', 'Power'], ['guts', 'Guts'], ['wit', 'Wit'],
] as const;

const APTITUDE_ROWS = [
	{ label: 'Track', key: 'track', cols: [['turf', 'Turf'], ['dirt', 'Dirt']] },
	{ label: 'Distance', key: 'distance', cols: [['sprint', 'Sprint'], ['mile', 'Mile'], ['medium', 'Medium'], ['long', 'Long']] },
	{ label: 'Style', key: 'style', cols: [['front', 'Front'], ['pace', 'Pace'], ['late', 'Late'], ['end', 'End']] },
] as const;

// Skill list order: uniques, then inherited uniques, then gold, then white (stable, so game order within each)
const RARITY_ORDER: Record<SkillRarity, number> = { unique: 0, inherited: 1, gold: 2, white: 3 };

function AceDetails({ uma, shared }: { uma: StoredUma; shared?: SharedProps }) {
	const skills = uma.skills
		.map(s => ({ ...s, rarity: skillRarity(s.skillId) }))
		.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

	return (
		<>
			<div className="uma-card__stats">
				{STATS.map(([key, label]) => (
					<div key={key} className={`uma-card__stat uma-card__stat--${key}`}>
						<span className="uma-card__stat-label">{label}</span>
						<span className="uma-card__stat-value">{uma.stats[key]}</span>
					</div>
				))}
			</div>

			<div className="uma-card__aptitudes">
				{APTITUDE_ROWS.map(row => (
					<div key={row.key} className="uma-card__apt-row">
						<span className="uma-card__apt-label">{row.label}</span>
						{row.cols.map(([key, label]) => {
							const g = (uma[row.key] as Record<string, Grade>)[key];
							return (
								<span key={key} className="uma-card__apt">
									{label} <span className={`grade grade--${g}`}>{g}</span>
								</span>
							);
						})}
					</div>
				))}
			</div>

			{skills.length === 0 ? (
				<div className="uma-card__skills">
					<span className="uma-card__skills-empty">No skills (re-import the dump to load them)</span>
				</div>
			) : (
				<SplitShared
					items={skills}
					keyOf={s => sharedSkillKey(s.skillId)}
					shared={shared}
					className="uma-card__skills"
					render={s => (
						<span key={s.skillId} className={`skill skill--${s.rarity}`}>
							{skillName(s.skillId)}
							{s.rarity === 'unique' && <span className="skill__level">Lv {s.level}</span>}
						</span>
					)}
				/>
			)}
		</>
	);
}

interface SplitSharedProps<T> {
	items: T[];
	keyOf: (item: T) => string | null;
	isHidden?: (item: T) => boolean;
	shared?: SharedProps;
	className: string;
	render: (item: T) => ReactNode;
}

// Lists the items, moving the ones every compared uma has and the hidden ones into a collapsible section below.
// Shared items stay in the common group even if they'd be hidden.
function SplitShared<T>({ items, keyOf, isHidden = () => false, shared, className, render }: SplitSharedProps<T>) {
	// Outside the compare view there's nothing to sync the open state with
	const [localOpen, setLocalOpen] = useState(false);
	const open = shared ? shared.open : localOpen;
	const setOpen = shared ? shared.onToggle : setLocalOpen;

	const isShared = (item: T) => {
		const key = keyOf(item);
		return key !== null && !!shared?.keys.has(key);
	};
	const common = items.filter(isShared);
	const hidden = items.filter(i => !isShared(i) && isHidden(i));
	const own = items.filter(i => !isShared(i) && !isHidden(i));

	const summary = [
		common.length > 0 && `${common.length} in common`,
		hidden.length > 0 && `${hidden.length} hidden`,
	].filter(Boolean).join(', ');

	return (
		<>
			{own.length > 0 && <div className={className}>{own.map(render)}</div>}
			{summary && (
				<details
					className="uma-card__shared"
					open={open}
					onToggle={e => setOpen(e.currentTarget.open)}
				>
					<summary className="uma-card__shared-summary">{summary}</summary>
					{common.length > 0 && <div className={className}>{common.map(render)}</div>}
					{hidden.length > 0 && (
						<div className={`${className} uma-card__hidden-group`}>{hidden.map(render)}</div>
					)}
				</details>
			)}
		</>
	);
}
