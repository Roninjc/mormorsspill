import { error, redirect } from '@sveltejs/kit';
import { getGameSnapshot } from '$lib/server/repo.js';

export function load({ params, locals }) {
	if (!locals.member) throw redirect(302, '/');
	const snap = getGameSnapshot(Number(params.id));
	if (!snap) throw error(404, 'Partida no encontrada');
	if (snap.game.space_id !== locals.space.id) throw error(403, 'Sin acceso');
	return { game: snap.game, standings: snap.standings, rounds: snap.rounds };
}
