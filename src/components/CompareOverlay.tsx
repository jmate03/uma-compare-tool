import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { StoredUma } from '../lib/UmaTypes';
import { UmaCard, type CardMode } from './UmaCard';
import { sharedKeys } from '../lib/UmaCompare';

// Selected umas side by side, one card per column, in the order they were picked
interface CompareOverlayProps {
	umas: StoredUma[];
	mode: CardMode;
	onModeChange: (mode: CardMode) => void;
	byId: Map<string, StoredUma>;
	includeParents: boolean;
	hideRaceScenario: boolean;
	onHideRaceScenarioChange: (value: boolean) => void;
	highlighted: Set<number>;
	onNotesChange: (id: string, notes: string) => void;
	onRemove: (id: string) => void; // unchecking a card drops it from the comparison
	onClose: () => void;
}

export function CompareOverlay({ umas, mode, onModeChange, byId, includeParents, hideRaceScenario, onHideRaceScenarioChange, highlighted, onNotesChange, onRemove, onClose }: CompareOverlayProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [splitShared, setSplitShared] = useState(true);
	const [sharedOpen, setSharedOpen] = useState(false);
	const shared = sharedKeys(umas, byId, includeParents);

	// A modal <dialog> gives us Esc to close, focus trapping and the backdrop for free
	useEffect(() => {
		dialogRef.current?.showModal();
	}, []);

	return (
		<dialog
			ref={dialogRef}
			className="compare"
			onClose={onClose}
			// Clicks on the backdrop land on the dialog itself
			onClick={e => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="compare__panel">
				<header className="compare__header">
					<h2 className="compare__title">Comparing {umas.length} umas</h2>
					<label className="compare__split">
						<input type="checkbox" checked={splitShared} onChange={e => setSplitShared(e.target.checked)} />
						Group what's in common
					</label>
					{mode === 'parent' && (
						<label className="compare__split">
							<input type="checkbox" checked={hideRaceScenario} onChange={e => onHideRaceScenarioChange(e.target.checked)} />
							Hide race &amp; scenario sparks
						</label>
					)}
					<div className="uma-list__mode" role="group" aria-label="Mode">
						{(['parent', 'ace'] as const).map(m => (
							<button
								key={m}
								type="button"
								className={`uma-list__mode-btn${mode === m ? ' uma-list__mode-btn--active' : ''}`}
								aria-pressed={mode === m}
								onClick={() => onModeChange(m)}
							>
								{m === 'parent' ? 'Parent' : 'Ace'}
							</button>
						))}
					</div>
					<button className="compare__close" type="button" aria-label="Close" onClick={onClose}>×</button>
				</header>

				<div className="compare__columns" style={{ '--cols': umas.length } as CSSProperties}>
					{umas.map(uma => (
						<UmaCard
							key={uma.id}
							uma={uma}
							mode={mode}
							byId={byId}
							includeParents={includeParents}
							hideRaceScenario={hideRaceScenario}
							highlighted={highlighted}
							onNotesChange={onNotesChange}
							selected
							onToggleSelect={onRemove}
							shared={splitShared ? { ...shared, open: sharedOpen, onToggle: setSharedOpen } : undefined}
						/>
					))}
				</div>
			</div>
		</dialog>
	);
}
