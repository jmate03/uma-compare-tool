import { useState } from 'react';
import type { StoredUma } from '../lib/UmaTypes';
import { sparkName, umaIconUrl, umaName } from '../lib/UmaNames';
import { sparkTotals } from '../lib/UmaFilter';

// Typing past the cap is allowed, but notes over it aren't saved until trimmed
const NOTES_LIMIT = 100;
const NOTES_WARN_AT = 80; // character counter appears past this

// Parent-focused card: stats and aptitudes are left off on purpose (they're for the future Aces view)
interface UmaCardProps {
	uma: StoredUma;
	byId: Map<string, StoredUma>; // to look up parents that are your own saved umas
	includeParents: boolean; // show sparks summed with both parents' sparks
	highlighted: Set<number>; // spark bases from the active filters
	onNotesChange: (id: string, notes: string) => void;
	onDelete: (id: string) => void;
}

export function UmaCard({ uma, byId, includeParents, highlighted, onNotesChange, onDelete }: UmaCardProps) {
	const sparks = sparkTotals(uma, byId, includeParents);
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
						onError={e => { e.currentTarget.style.display = 'none'; }}
					/>
				)}
				<h2 className="uma-card__name" title={fullName}>
					{outfit && <span className="uma-card__outfit">{outfit}</span>}
					{charaName}
				</h2>
				{uma.score !== undefined && <span className="uma-card__score">{uma.score.toLocaleString()}</span>}
			</header>

			<div className="uma-card__sparks">
				{sparks.map(s => {
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
				<span className="uma-card__parents" title={parentNames.join(' × ')}>
					Parents: {parentNames.join(' × ')}
				</span>
				<button className="uma-card__delete" onClick={() => onDelete(uma.id)}>Delete</button>
			</footer>
		</article>
	);
}