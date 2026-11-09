import { useEffect, useRef, useState } from 'react';
import type { StoredUma } from '../lib/UmaTypes';
import { sparkName, umaIconUrl, umaName } from '../lib/UmaNames';
import { LOOP_SLOTS, lineageViews, loopCandidates, loopRow, type LineageSlot, type LineageView } from '../lib/UmaLineage';
import { SparkList } from './UmaCard';

// One uma's sparks, switchable between the combined total, itself, its parents and its grandparents
interface LineageOverlayProps {
	uma: StoredUma;
	byId: Map<string, StoredUma>;
	hideRaceScenario: boolean;
	onHideRaceScenarioChange: (value: boolean) => void;
	highlighted: Set<number>;
	onClose: () => void;
}

// Button rows: the uma itself, then each side of the family
const GROUPS: LineageSlot[][] = [['combined', 'self'], ['a', 'a1', 'a2'], ['b', 'b1', 'b2']];

export function LineageOverlay({ uma, byId, hideRaceScenario, onHideRaceScenarioChange, highlighted, onClose }: LineageOverlayProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [slot, setSlot] = useState<LineageSlot>('combined');
	const views = new Map(lineageViews(uma, byId).map(v => [v.slot, v]));
	const current = views.get(slot)!;
	const [loopBases, setLoopBases] = useState<number[]>([]); // white sparks in the loops table, in pick order
	const picked = new Set(loopBases);
	const togglePick = (base: number) =>
		setLoopBases(prev => (prev.includes(base) ? prev.filter(b => b !== base) : [...prev, base]));
	const nearLoops = loopCandidates(views, 2).filter(b => !picked.has(b));

	useEffect(() => {
		dialogRef.current?.showModal();
	}, []);

	const fullName = umaName(uma);
	const [, outfit, charaName] = fullName.match(/^\[(.*?)\]\s*(.*)$/) ?? [null, null, fullName];
	const iconUrl = umaIconUrl(uma);

	return (
		<dialog
			ref={dialogRef}
			className="compare lineage"
			onClose={onClose}
			onClick={e => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="compare__panel">
				<header className="compare__header">
					{iconUrl && (
						<img
							className="uma-card__portrait"
							src={iconUrl}
							alt=""
							width={56}
							height={56}
							onError={e => { e.currentTarget.style.display = 'none'; }}
						/>
					)}
					<h2 className="compare__title uma-card__name" title={fullName}>
						{outfit && <span className="uma-card__outfit">{outfit}</span>}
						{charaName}
					</h2>
					{uma.score !== undefined && <span className="uma-card__score">{uma.score.toLocaleString()}</span>}
					<button className="compare__close" type="button" aria-label="Close" onClick={onClose}>×</button>
				</header>

				<label className="compare__split">
					<input type="checkbox" checked={hideRaceScenario} onChange={e => onHideRaceScenarioChange(e.target.checked)} />
					Hide race &amp; scenario sparks
				</label>

				<section className="uma-card lineage__card" aria-live="polite">
					<h3 className="lineage__heading">
						{current.label}
						{current.slot !== 'combined' && current.slot !== 'self' && current.variantId !== undefined && (
							<span className="lineage__heading-name">{umaName(current)}</span>
						)}
					</h3>
					{/* Unknown members can't be picked, so totals is only null here in theory */}
					{!current.totals?.length ? (
						<p className="lineage__empty">No sparks.</p>
					) : (
						<SparkList
							totals={current.totals}
							combined={current.combined}
							hideRaceScenario={hideRaceScenario}
							highlighted={highlighted}
							// The combined list has every spark the three loop members have
							{...(slot === 'combined' && { picked, onPick: togglePick })}
						/>
					)}
				</section>

				<section className="lineage__loops" aria-label="Loops">
					<div className="lineage__loops-header">
						<h3 className="lineage__heading">Loops</h3>
						{nearLoops.length > 0 && (
							<button
								className="lineage__loops-btn"
								type="button"
								title="Add every white spark that at least two of self, Parent A1 and Parent B1 have"
								onClick={() => setLoopBases(prev => [...prev, ...nearLoops])}
							>
								Add 2/3+ ({nearLoops.length})
							</button>
						)}
						{loopBases.length > 0 && (
							<button className="lineage__loops-btn" type="button" onClick={() => setLoopBases([])}>
								Clear
							</button>
						)}
					</div>
					{loopBases.length === 0 ? (
						<p className="lineage__empty">
							{slot === 'combined'
								? 'Click white sparks above to check whether self and both parents have them.'
								: <>Switch to <button className="lineage__link" type="button" onClick={() => setSlot('combined')}>Combined</button> and click white sparks to check whether self and both parents have them.</>}
						</p>
					) : (
						<table className="lineage__loops-table">
							<thead>
								<tr>
									<th scope="col">Spark</th>
									{LOOP_SLOTS.map(s => <th key={s} scope="col">{views.get(s)!.label}</th>)}
									<th scope="col">Loop</th>
									<th scope="col"><span className="visually-hidden">Remove</span></th>
								</tr>
							</thead>
							<tbody>
								{loopBases.map(base => {
									const row = loopRow(views, base);
									return (
										<tr key={base} className={row.count === 3 ? 'lineage__loop--full' : undefined}>
											<th scope="row">{sparkName(base)}</th>
											{row.stars.map((stars, i) => (
												<td key={LOOP_SLOTS[i]} className={stars ? 'lineage__loop-has' : 'lineage__loop-missing'}>
													{stars === null ? '?' : stars ? `${stars} ★` : '–'}
												</td>
											))}
											<td className="lineage__loop-count">{row.count}/3</td>
											<td>
												<button
													className="lineage__loop-remove"
													type="button"
													aria-label={`Remove ${sparkName(base)}`}
													onClick={() => togglePick(base)}
												>
													×
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</section>

				<div className="lineage__picker" role="group" aria-label="Show sparks of">
					{GROUPS.map((group, i) => (
						<div key={i} className="lineage__group">
							{group.map(s => (
								<LineageButton
									key={s}
									view={views.get(s)!}
									active={s === slot}
									// Grandparents are only stored by imports made after they were added
									missingHint={uma.grandparents || i === 0 || s === 'a' || s === 'b'
										? 'Not in the dump'
										: 'Re-import your dump to load grandparents'}
									onSelect={() => setSlot(s)}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</dialog>
	);
}

interface LineageButtonProps {
	view: LineageView;
	active: boolean;
	missingHint: string; // tooltip when the member isn't known
	onSelect: () => void;
}

function LineageButton({ view, active, missingHint, onSelect }: LineageButtonProps) {
	const iconUrl = view.variantId !== undefined ? umaIconUrl(view) : undefined;
	const name = view.variantId !== undefined ? umaName(view) : undefined;
	return (
		<button
			type="button"
			className={`lineage__btn${active ? ' lineage__btn--active' : ''}`}
			aria-pressed={active}
			disabled={view.totals === null}
			title={view.totals === null ? missingHint : name}
			onClick={onSelect}
		>
			<span className="lineage__btn-img">
				{iconUrl && (
					<img
						src={iconUrl}
						alt=""
						width={48}
						height={48}
						loading="lazy"
						onError={e => { e.currentTarget.style.display = 'none'; }}
					/>
				)}
			</span>
			<span className="lineage__btn-label">{view.label}</span>
		</button>
	);
}
