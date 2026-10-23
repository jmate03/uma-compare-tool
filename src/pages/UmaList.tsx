import { useEffect, useMemo, useState } from 'react';
import { umaStore } from '../lib/UmaStorage';
import { importGameDump } from '../lib/UmaImport';
import type { StoredUma } from '../lib/UmaTypes';
import { umaName } from '../lib/UmaNames'
import './UmaListCSS.css'
import { UmaCard } from '../components/UmaCard';
import { SparkFilterBar } from '../components/SparkFilterBar';
import { matchesSparkFilters, type SparkFilter } from '../lib/UmaFilter';
import { SORT_OPTIONS, sortUmas, type SortDir, type SortKey } from '../lib/UmaSort';

export function UmaList() {
	const [umas, setUmas] = useState<StoredUma[]>([]);
	const [search, setSearch] = useState('');
	const [sparkFilters, setSparkFilters] = useState<SparkFilter[]>([]);
	const [includeParents, setIncludeParents] = useState(true);
	const [sortKey, setSortKey] = useState<SortKey>('recent');
	const [sortDir, setSortDir] = useState<SortDir>('desc');
 
	// Load saved umas once when the screen opens
	useEffect(() => {
		umaStore.list().then(setUmas);
	}, []);
 
	async function handleImport(file: File) {
		const raw = JSON.parse(await file.text());
		await umaStore.replaceAll(importGameDump(raw, await umaStore.list()));
		setUmas(await umaStore.list());
	}
 
	async function handleClear() {
		if (!confirm(`Delete all ${umas.length} umas? This also removes your notes and types, and can't be undone.`)) return;
		await umaStore.clear();
		setUmas([]);
	}
 
	async function handleDelete(id: string) {
		await umaStore.remove(id);
		setUmas(await umaStore.list());
	}
 
	async function handleNotesChange(id: string, notes: string) {
		setUmas(prev => prev.map(u => (u.id === id ? { ...u, notes } : u)));
		const uma = umas.find(u => u.id === id);
		if (uma) await umaStore.save({ ...uma, notes }, id);
	}
	// Lookup table so cards can show the names of parents you have saved
	const byId = useMemo(() => new Map(umas.map(u => [u.id, u])), [umas]);
 
	// Sparks to highlight on the cards
	const highlighted = useMemo(() => new Set(sparkFilters.flatMap(f => (f.base === null ? [] : [f.base]))), [sparkFilters]);

	// TODO: add more filters here (type, aptitudes...)
	const visible = useMemo(
		() => sortUmas(
			umas.filter(u =>
				umaName(u).toLowerCase().includes(search.toLowerCase()) &&
				matchesSparkFilters(u, sparkFilters, byId, includeParents)
			),
			sortKey, sortDir, byId, includeParents
		),
		[umas, search, sparkFilters, byId, includeParents, sortKey, sortDir]
	);
	const directional = SORT_OPTIONS.find(o => o.key === sortKey)!.directional;
 
	return (
		<div className="uma-list">
			<header className="uma-list__toolbar">
				<h1 className="uma-list__title">
					uma-compare-tool <span className="uma-list__count">{visible.length}</span>
				</h1>
 
				<input
					className="uma-list__search"
					type="search"
					placeholder="Search by name"
					value={search}
					onChange={e => setSearch(e.target.value)}
				/>
 
				<div className="uma-list__sort">
					<select
						className="uma-list__sort-select"
						aria-label="Sort by"
						value={sortKey}
						onChange={e => setSortKey(e.target.value as SortKey)}
					>
						{SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>Sort: {o.label}</option>)}
					</select>
					{directional && (
						<button
							className="uma-list__sort-dir"
							type="button"
							title={sortDir === 'desc' ? 'Descending (click for ascending)' : 'Ascending (click for descending)'}
							onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
						>
							{sortDir === 'desc' ? '↓' : '↑'}
						</button>
					)}
				</div>

				<label className="uma-list__import">
					Import dump
					<input
						type="file"
						accept=".json"
						hidden
						onChange={e => {
							const file = e.target.files?.[0];
							if (file) handleImport(file);
							e.target.value = ''; // lets you pick the same file again
						}}
					/>
				</label>

				<button
					className="uma-list__clear"
					type="button"
					disabled={umas.length === 0}
					onClick={handleClear}
				>
					Clear all
				</button>
			</header>

			<SparkFilterBar
				filters={sparkFilters}
				onChange={setSparkFilters}
				includeParents={includeParents}
				onIncludeParentsChange={setIncludeParents}
			/>

			{visible.length === 0 ? (
				<p className="uma-list__empty">
					{umas.length === 0 ? 'No umas yet. Import trained_chara_data.json to get started.' : 'No umas match your search and filters.'}
				</p>
			) : (
				<div className="uma-list__grid">
					{visible.map(uma => (
						<UmaCard key={uma.id} uma={uma} byId={byId} includeParents={includeParents} highlighted={highlighted} onNotesChange={handleNotesChange} onDelete={handleDelete} />
					))}
				</div>
			)}
		</div>
	);
}