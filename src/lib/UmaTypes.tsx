export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type SparkCategory = 'blue' | 'pink' | 'white' | 'green';
export type LegacyParent = {kind: 'saved'; umaId: string} | {kind: 'imported'; variantId?: number; outfitId?: number; sparks: Spark[]}
export type UmaType = 'ace' | 'parent' | 'both';

export interface UmaFormValues {
    name?: string;
    variantId?: number;
    type: UmaType;
    stats: {
        speed: number;
        stamina: number;
        power: number;
        guts: number;
        wit: number;
    }
    track: {turf: Grade; dirt: Grade}
    distance: {sprint: Grade; mile: Grade; medium: Grade; long: Grade }
    style: {front: Grade; pace: Grade; late: Grade; end: Grade}
    sparks: Spark[];
    parents: [LegacyParent, LegacyParent];
    notes: string;
    score?: number;
    skills: Skill[];
}

export const emptyValues: UmaFormValues = {
    name: '',
    variantId: 0,
    type: 'both',
    stats: { speed: 0, stamina: 0, power: 0, guts: 0, wit: 0 },
    track: { turf: 'G', dirt: 'G' },
    distance: { sprint: 'G', mile: 'G', medium: 'G', long: 'G' },
    style: { front: 'G', pace: 'G', late: 'G', end: 'G' },
    sparks: [],
    parents: [{ kind: 'saved', umaId: '' }, { kind: 'saved', umaId: '' }],
    notes: '',
    score: 0,
    skills: [],
};

export interface StoredUma extends UmaFormValues {
	id: string;
	gameId?: number; // trained_chara_id from the dump. undefined for manually entered umas
	iconType?: number; // in-game favorite icon from the dump: 0 = none, 1–13 = icon
	createdAt: string;
	updatedAt: string;
    charId?: number;
    outfitId?: number;
}

export interface Spark {
    factorId: number;
    category: SparkCategory;
    stars: 1 | 2 | 3;
}

export interface Skill {
    skillId: number; // matches the keys of umaskillnames.json
    level: number; // only meaningful for unique skills (unique level)
}
