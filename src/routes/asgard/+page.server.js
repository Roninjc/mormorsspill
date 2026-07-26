import { redirect } from '@sveltejs/kit';
import {
	getRanking,
	listRecentGames,
	getActiveGame,
	getGameSnapshot,
	getSpaceStats
} from '$lib/server/repo.js';
import { TOTAL_ROUNDS } from '$lib/rules.js';

export function load({ locals }) {
	if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
	const spaceId = locals.space.id;

	// Enrich the in-progress game with players + round for a richer card.
	const active = getActiveGame(spaceId);
	let activeGame = null;
	if (active) {
		const snap = getGameSnapshot(active.id);
		const anyDone = snap.rounds.some((r) => r.status === 'done');
		const leaderRow = anyDone ? snap.standings[0] : null;
		activeGame = {
			id: active.id,
			round: active.current_round,
			totalRounds: TOTAL_ROUNDS,
			players: snap.participants.map((p) => ({ name: p.name, avatar: p.avatar })),
			leaderName: leaderRow ? snap.participants.find((p) => p.id === leaderRow.id)?.name : null
		};
	}

	return {
		inviteCode: locals.space.invite_code,
		stats: getSpaceStats(spaceId),
		ranking: getRanking(spaceId),
		recentGames: listRecentGames(spaceId, 8),
		activeGame
	};
}
