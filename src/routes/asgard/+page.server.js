import { redirect } from '@sveltejs/kit';
import {
	getRanking,
	listRecentGames,
	listActiveGames,
	getGameSnapshot,
	getSpaceStats
} from '$lib/server/repo.js';
import { TOTAL_ROUNDS } from '$lib/rules.js';

export function load({ locals }) {
	if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
	const spaceId = locals.space.id;

	// Several games can be in progress at once — enrich each with players + round.
	const activeGames = listActiveGames(spaceId).map((g) => {
		const snap = getGameSnapshot(g.id);
		const anyDone = snap.rounds.some((r) => r.status === 'done');
		const leaderRow = anyDone ? snap.standings[0] : null;
		return {
			id: g.id,
			round: g.current_round,
			totalRounds: TOTAL_ROUNDS,
			players: snap.participants.map((p) => ({ name: p.name, avatar: p.avatar })),
			leaderName: leaderRow ? snap.participants.find((p) => p.id === leaderRow.id)?.name : null
		};
	});

	return {
		inviteCode: locals.space.invite_code,
		stats: getSpaceStats(spaceId),
		ranking: getRanking(spaceId),
		recentGames: listRecentGames(spaceId, 8),
		activeGames
	};
}
