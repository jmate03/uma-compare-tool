// Collapsible panel of spark filters, one section per category, e.g. "Power ≥ 7★" + "Sprint Corners ≥ 1★"
import { useState } from 'react';
import { CATEGORY_ORDER, SPARK_OPTIONS_BY_CATEGORY, sparkByBase, type SparkFilter } from '../lib/UmaFilter';
import type { SparkCategory } from '../lib/UmaTypes';

const CATEGORY_LABELS: Record<SparkCategory, string> = {
	blue: 'Blue sparks (stats)',
	pink: 'Pink sparks (aptitude)',
	green: 'Green sparks (unique)',
	white: 'White sparks (skills & scenario)',
};

// Blue and pink are short enough for a dropdown; green and white have hundreds, so they get a search box
const SEARCHABLE: Record<SparkCategory, boolean> = { blue: false, pink: false, green: true, white: true };

interface SparkFilterBarProps {
	filters: SparkFilter[];
	onChange: (filters: SparkFilter[]) => void;
	includeParents: boolean;
	onIncludeParentsChange: (value: boolean) => void;
}

export function SparkFilterBar({ filters, onChange, includeParents, onIncludeParentsChange }: SparkFilterBarProps) {
	const [open, setOpen] = useState(true);
	const maxStars = includeParents ? 9 : 3; // 3★ max per uma

	const update = (id: string, changes: Partial<SparkFilter>) =>
		onChange(filters.map(f => (f.id === id ? { ...f, ...changes } : f)));
	const remove = (id: string) => onChange(filters.filter(f => f.id !== id));
	const add = (category: SparkCategory) =>
		onChange([...filters, { id: crypto.randomUUID(), category, base: null, minStars: 1 }]);

	function toggleParents(value: boolean) {
		onIncludeParentsChange(value);
		if (!value) onChange(filters.map(f => ({ ...f, minStars: Math.min(f.minStars, 3) })));
	}

	return (
		<details className="spark-filter" open={open} onToggle={e => setOpen(e.currentTarget.open)}>
			<summary className="spark-filter__summary">
				Spark filters
				{filters.length > 0 && <span className="spark-filter__count">{filters.length}</span>}
			</summary>

			<div className="spark-filter__options">
				<label className="spark-filter__parents">
					<input type="checkbox" checked={includeParents} onChange={e => toggleParents(e.target.checked)} />
					Include parents' sparks
				</label>
				{filters.length > 0 && (
					<button type="button" className="spark-filter__clear" onClick={() => onChange([])}>Clear filters</button>
				)}
			</div>

			<div className="spark-filter__sections">
				{CATEGORY_ORDER.map(category => {
					const rows = filters.filter(f => f.category === category);
					return (
						<section key={category} className={`spark-filter__section spark-filter__section--${category}`}>
							<h3 className="spark-filter__heading">
								{CATEGORY_LABELS[category]}
								{rows.length > 0 && (
									<span className="spark-filter__req">{rows.length} filter{rows.length > 1 ? 's' : ''}</span>
								)}
							</h3>

							{rows.map(f => (
								<SparkFilterRow
									key={f.id}
									filter={f}
									maxStars={maxStars}
									onChange={changes => update(f.id, changes)}
									onRemove={() => remove(f.id)}
								/>
							))}

							<button type="button" className="spark-filter__add" onClick={() => add(category)}>
								+ Add {category} spark
							</button>

							{SEARCHABLE[category] && (
								<datalist id={`spark-options-${category}`}>
									{SPARK_OPTIONS_BY_CATEGORY[category].map(o => <option key={o.base} value={o.name} />)}
								</datalist>
							)}
						</section>
					);
				})}
			</div>
		</details>
	);
}

interface SparkFilterRowProps {
	filter: SparkFilter;
	maxStars: number;
	onChange: (changes: Partial<SparkFilter>) => void;
	onRemove: () => void;
}

function SparkFilterRow({ filter, maxStars, onChange, onRemove }: SparkFilterRowProps) {
	return (
		<div className="spark-filter__row">
			<div className="spark-filter__row-top">
				{SEARCHABLE[filter.category] ? (
					<SparkSearch category={filter.category} base={filter.base} onChange={base => onChange({ base })} />
				) : (
					<select
						className="spark-filter__select"
						value={filter.base ?? ''}
						onChange={e => onChange({ base: e.target.value ? Number(e.target.value) : null })}
					>
						<option value="">Any</option>
						{SPARK_OPTIONS_BY_CATEGORY[filter.category].map(o => (
							<option key={o.base} value={o.base}>{o.name}</option>
						))}
					</select>
				)}
				<button type="button" className="spark-filter__remove" aria-label="Remove filter" onClick={onRemove}>×</button>
			</div>

			<label className="spark-filter__stars">
				<input
					type="range"
					min={1}
					max={maxStars}
					value={filter.minStars}
					onChange={e => onChange({ minStars: Number(e.target.value) })}
				/>
				<span className="spark-filter__stars-value">≥ {filter.minStars}★</span>
			</label>
		</div>
	);
}

interface SparkSearchProps {
	category: SparkCategory;
	base: number | null;
	onChange: (base: number | null) => void;
}

// Text box backed by the section's datalist. Only an exact name match picks a spark;
// empty or unmatched text leaves the filter on "any".
function SparkSearch({ category, base, onChange }: SparkSearchProps) {
	const [text, setText] = useState(base === null ? '' : sparkByBase.get(base)?.name ?? '');
	const unmatched = text.trim() !== '' && base === null;

	return (
		<input
			className={`spark-filter__search${unmatched ? ' spark-filter__search--invalid' : ''}`}
			list={`spark-options-${category}`}
			placeholder="Any (type to search)"
			value={text}
			onChange={e => {
				setText(e.target.value);
				const name = e.target.value.trim().toLowerCase();
				onChange(SPARK_OPTIONS_BY_CATEGORY[category].find(o => o.name.toLowerCase() === name)?.base ?? null);
			}}
		/>
	);
}
