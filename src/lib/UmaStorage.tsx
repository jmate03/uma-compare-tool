import type { LegacyParent, StoredUma, UmaFormValues } from './UmaTypes';

// (localStorage now, potentially an API/database later)
export interface UmaStore {
	list(): Promise<StoredUma[]>;
	get(id: string): Promise<StoredUma | undefined>;
	save(values: UmaFormValues, id?: string): Promise<StoredUma>; // id given = update
	remove(id: string): Promise<void>;
	replaceAll(umas: StoredUma[]): Promise<void>; // used by the game dump import
	clear(): Promise<void>; // deletes every uma
}

// ---------- localStorage implementation ----------

const STORAGE_KEY = 'uma-tracker:umas';
const SCHEMA_VERSION = 1; // bump when the shape changes, and handle it in migrate()

interface StoredData {
	version: number;
	umas: StoredUma[];
}

function migrate(data: StoredData): StoredData {
	// Example for later:
	// if (data.version === 1) { data.umas = data.umas.map(u => ({ ...u, skills: [] })); data.version = 2; }
	return data;
}

function readAll(): StoredUma[] {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return [];
	try {
		return migrate(JSON.parse(raw) as StoredData).umas;
	} catch (err) {
		// Don't silently return [] here: the next save would overwrite the corrupted data.
		throw new Error(`Uma data in localStorage could not be read: ${err}`);
	}
}

function writeAll(umas: StoredUma[]) {
	const data: StoredData = { version: SCHEMA_VERSION, umas };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const localUmaStore: UmaStore = {
	async list() {
		return readAll();
	},

	async get(id) {
		return readAll().find(u => u.id === id);
	},

	async save(values, id) {
		const umas = readAll();
		const now = new Date().toISOString();
		const existing = id ? umas.find(u => u.id === id) : undefined;

		const uma: StoredUma = existing
			? { ...existing, ...values, updatedAt: now }
			: { ...values, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

		writeAll(existing ? umas.map(u => (u.id === uma.id ? uma : u)) : [...umas, uma]);
		return uma;
	},

	// Children that point at the deleted uma get a copy of its name and sparks,
	// so they keep their lineage data.
	async remove(id) {
		const umas = readAll();
		const target = umas.find(u => u.id === id);
		if (!target) return;

		const copy: LegacyParent = {
			kind: 'imported',
			variantId: target.variantId,
			sparks: target.sparks,
		};

		writeAll(
			umas
				.filter(u => u.id !== id)
				.map(u => ({
					...u,
					parents: u.parents.map(p =>
						p.kind === 'saved' && p.umaId === id ? copy : p
					) as [LegacyParent, LegacyParent],
				}))
		);
	},

	async replaceAll(umas) {
		writeAll(umas);
	},

	async clear() {
		localStorage.removeItem(STORAGE_KEY);
	},
};

// The rest of the app imports this. Change this one line to switch backends.
export const umaStore: UmaStore = localUmaStore;

// ---------- Backup: export / restore your data (not the game dump) ----------

export async function exportBackup() {
	const data: StoredData = { version: SCHEMA_VERSION, umas: await umaStore.list() };
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `uma-backup-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

// Merges by id: umas in the backup overwrite existing ones with the same id.
export async function restoreBackup(file: File): Promise<number> {
	const data = migrate(JSON.parse(await file.text()) as StoredData);
	const byId = new Map(readAll().map(u => [u.id, u]));
	for (const uma of data.umas) byId.set(uma.id, uma);
	writeAll([...byId.values()]);
	return data.umas.length;
}