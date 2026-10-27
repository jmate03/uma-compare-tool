import { useRef, useState } from 'react';

interface DataMenuProps {
	hasUmas: boolean;
	onBackup: () => void;
	onRestore: (file: File) => void;
	onClear: () => void;
	onDemo?: () => void; // omitted while the demo is already showing
}

// Backup / restore of the app's own data (notes included), plus the last-resort delete
export function DataMenu({ hasUmas, onBackup, onRestore, onClear, onDemo }: DataMenuProps) {
	const [open, setOpen] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	function pick(action: () => void) {
		setOpen(false);
		action();
	}

	return (
		<div
			className="data-menu"
			// Close when focus leaves the menu (click elsewhere, tab away)
			onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
			onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
		>
			<button
				className="data-menu__btn"
				type="button"
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={() => setOpen(o => !o)}
			>
				Data ▾
			</button>
			{open && (
				<div className="data-menu__list" role="menu">
					<button role="menuitem" type="button" disabled={!hasUmas} onClick={() => pick(onBackup)}>
						Back up data
					</button>
					<button role="menuitem" type="button" onClick={() => pick(() => fileInput.current?.click())}>
						Restore backup…
					</button>
					{onDemo && (
						<button role="menuitem" type="button" onClick={() => pick(onDemo)}>
							Try demo data
						</button>
					)}
					<hr className="data-menu__sep" />
					<button
						className="data-menu__danger"
						role="menuitem"
						type="button"
						disabled={!hasUmas}
						onClick={() => pick(onClear)}
					>
						Delete all data…
					</button>
				</div>
			)}
			{/* Outside the menu so it survives the menu closing */}
			<input
				ref={fileInput}
				type="file"
				accept=".json"
				hidden
				onChange={e => {
					const file = e.target.files?.[0];
					if (file) onRestore(file);
					e.target.value = ''; // lets you pick the same file again
				}}
			/>
		</div>
	);
}
