import type { Grade, StoredUma } from '../lib/UmaTypes';
import { sparkName, umaName } from '../lib/UmaNames';
import { sparkTotals } from '../lib/UmaFilter';

interface UmaCardProps {
	uma: StoredUma;
	byId: Map<string, StoredUma>; // to look up parents that are your own saved umas
	includeParents: boolean; // show sparks summed with both parents' sparks
	highlighted: Set<number>; // spark bases from the active filters
	onDelete: (id: string) => void;
}

function GradeRow({ label, grades }: { label: string; grades: Record<string, Grade> }) {
	return (
		<div className="uma-card__grade-row">
			<span className="uma-card__grade-label">{label}</span>
			{Object.entries(grades).map(([key, grade]) => (
				<span key={key} className="uma-card__grade">
					<span className="uma-card__grade-key">{key}</span>
					<span className={`grade grade--${grade}`}>{grade}</span>
				</span>
			))}
		</div>
	);
}

export function UmaCard({ uma, byId, includeParents, highlighted, onDelete }: UmaCardProps) {
	const sparks = sparkTotals(uma, byId, includeParents);

	const parentNames = uma.parents.map(p =>
		p.kind === 'saved' ? umaName(byId.get(p.umaId) ?? {}) : umaName(p)
	);

	return (
		<article className="uma-card">
			<header className="uma-card__header">
				<h2 className="uma-card__name">{umaName(uma)}</h2>
				{uma.score !== undefined && <span className="uma-card__score">{uma.score.toLocaleString()}</span>}
			</header>

			<div className="uma-card__stats">
				{Object.entries(uma.stats).map(([stat, value]) => (
					<div key={stat} className="uma-card__stat">
						<span className="uma-card__stat-label">{stat}</span>
						<span className="uma-card__stat-value">{value}</span>
					</div>
				))}
			</div>

			<div className="uma-card__grades">
				<GradeRow label="Track" grades={uma.track} />
				<GradeRow label="Dist" grades={uma.distance} />
				<GradeRow label="Style" grades={uma.style} />
			</div>

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
							{s.own > 0 && <span className="spark__own" aria-label="On this uma">●</span>}
							<span className="spark__stars">{s.total}★</span> {name}
						</span>
					) : (
						<span key={s.base} className={className}>
							{name} <span className="spark__stars">{'★'.repeat(s.total)}</span>
						</span>
					);
				})}
			</div>

			<footer className="uma-card__footer">
				<span className="uma-card__parents" title={parentNames.join(' × ')}>
					Parents: {parentNames.join(' × ')}
				</span>
				{uma.notes && <span className="uma-card__notes">{uma.notes}</span>}
				<button className="uma-card__delete" onClick={() => onDelete(uma.id)}>Delete</button>
			</footer>
		</article>
	);
}