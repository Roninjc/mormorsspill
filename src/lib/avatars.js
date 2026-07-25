// Crestas de clan: glifos vikingos + runas, dibujados en SVG (ver Avatar.svelte).
export const AVATARS = [
	'helm',
	'axe',
	'hammer',
	'ship',
	'fehu',
	'uruz',
	'thurisaz',
	'ansuz',
	'algiz',
	'raidho'
];

export function avatarOr(id) {
	return AVATARS.includes(id) ? id : 'helm';
}
