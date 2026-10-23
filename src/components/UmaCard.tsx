import { useState } from 'react';
import type { Grade, StoredUma } from '../lib/UmaTypes';
import { skillName, skillRarity, sparkName, umaIconUrl, umaName, type SkillRarity } from '../lib/UmaNames';
import { sparkTotals } from '../lib/UmaFilter';

export type CardMode = 'parent' | 'ace';

// Typing past the cap is allowed, but notes over it aren't saved until trimmed
const NOTES_LIMIT = 100;
const NOTES_WARN_AT = 80; // character counter appears past this

// Parent mode shows sparks and parents; ace mode shows stats, aptitudes and skills instead
interface UmaCardProps {
	uma: StoredUma;
	mode: CardMode;
	byId: Map<string, StoredUma>; // to look up parents that are your own saved umas
	includeParents: boolean; // show sparks summed with both parents' sparks
	highlighted: Set<number>; // spark bases from the active filters
	onNotesChange: (id: string, notes: string) => void;
	onDelete: (id: string) => void;
}

export function UmaCard({ uma, mode, byId, includeParents, highlighted, onNotesChange, onDelete }: UmaCardProps) {
	const [notes, setNotes] = useState(uma.notes);
	const overLimit = notes.length > NOTES_LIMIT;

	// Names look like "[Outfit] Character"; the outfit goes on its own smaller line
	const fullName = umaName(uma);
	const [, outfit, charaName] = fullName.match(/^\[(.*?)\]\s*(.*)$/) ?? [null, null, fullName];
	const iconUrl = umaIconUrl(uma);

	const parentNames = uma.parents.map(p =>
		p.kind === 'saved' ? umaName(byId.get(p.umaId) ?? {}) : umaName(p)
	);

	return (
		<article className="uma-card">
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

			{mode === 'ace' ? <AceDetails uma={uma} /> : (
				<div className="uma-card__sparks">
					{sparkTotals(uma, byId, includeParents).map(s => {
						const name = sparkName(s.base);
						const className = `spark spark--${s.category}${highlighted.has(s.base) ? ' spark--match' : ''}`;
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
							</span>
						) : (
							<span key={s.base} className={className}>
								<span className="spark__stars">{s.total} ★</span> {name}
							</span>
						);
					})}
				</div>
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
				<button className="uma-card__delete" onClick={() => onDelete(uma.id)}>Delete</button>
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

// Skill list order: uniques, then gold, then white (stable, so game order within each)
const RARITY_ORDER: Record<SkillRarity, number> = { unique: 0, gold: 1, white: 2 };

function AceDetails({ uma }: { uma: StoredUma }) {
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

			<div className="uma-card__skills">
				{skills.length === 0 ? (
					<span className="uma-card__skills-empty">No skills (re-import the dump to load them)</span>
				) : skills.map(s => (
					<span key={s.skillId} className={`skill skill--${s.rarity}`}>
						{skillName(s.skillId)}
						{s.rarity === 'unique' && <span className="skill__level">Lv {s.level}</span>}
					</span>
				))}
			</div>
		</>
	);
}
