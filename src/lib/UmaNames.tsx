// helper function that does display name lookup for umas from umavariantnames.json
import cardNames from '../../data/umavariantnames.json'

const names = cardNames as Record<string, string>;

export function umaName(u: { variantId?: number }): string {
	return u.variantId !== undefined ? names[u.variantId] ?? 'Unknown' : 'Unknown';
}