// Lets the user build a list of spark filters, e.g. "Power ≥ 7★" + "Sprint Corners ≥ 1★"
import { useState } from 'react';
import { SPARK_OPTIONS, sparkByBase, sparkByName, type SparkFilter } from '../lib/UmaFilter';

interface SparkFilterBarProps {
	filters: SparkFilter[];
	onChange: (filters: SparkFilter[]) => void;
	includeParents: boolean;
	onIncludeParentsChange: (value: boolean) => void;
}

export function SparkFilterBar({ filters, onChange, includeParents, onIncludeParentsChange }: SparkFilterBarProps) {
	const [name, setName] = useState('');
	const [minStars, setMinStars] = useState(1);

	const picked = sparkByName.get(name.trim().toLowerCase());
	const maxStars = includeParents ? 9 : 3; // 3★ max per uma

	function add() {
		if (!picked) return;
		// Re-adding a spark replaces its old threshold
		onChange([...filters.filter(f => f.base !== picked.base), { base: picked.base, minStars }]);
		setName('');
		setMinStars(1);
	}

	return (
		<div className="spark-filter">
			<form
				className="spark-filter__add"
				onSubmit={e => {
					e.preventDefault();
					add();
				}}
			>
				<input
					className="spark-filter__name"
					list="spark-options"
					placeholder="Filter by spark"
					value={name}
					onChange={e => setName(e.target.value)}
				/>
				<datalist id="spark-options">
					{SPARK_OPTIONS.map(o => (
						<option key={o.base} value={o.name} label={o.category} />
					))}
				</datalist>

				<label className="spark-filter__stars">
					≥
					<input
						type="number"
						min={1}
						max={maxStars}
						value={minStars}
						onChange={e => setMinStars(Math.min(maxStars, Math.max(1, Number(e.target.value) || 1)))}
					/>
					★
				</label>

				<button type="submit" className="spark-filter__button" disabled={!picked}>Add</button>

				<label className="spark-filter__parents">
					<input
						type="checkbox"
						checked={includeParents}
						onChange={e => onIncludeParentsChange(e.target.checked)}
					/>
					Include parents' sparks
				</label>
			</form>

			{filters.length > 0 && (
				<div className="spark-filter__chips">
					{filters.map(f => {
						const opt = sparkByBase.get(f.base);
						return (
							<span key={f.base} className={`spark spark--${opt?.category ?? 'white'} spark-filter__chip`}>
								{opt?.name ?? `#${f.base}`} ≥ {f.minStars}<span className="spark__stars">★</span>
								<button
									className="spark-filter__remove"
									aria-label="Remove filter"
									onClick={() => onChange(filters.filter(x => x.base !== f.base))}
								>
									×
								</button>
							</span>
						);
					})}
					<button className="spark-filter__clear" onClick={() => onChange([])}>Clear all</button>
				</div>
			)}
		</div>
	);
}
