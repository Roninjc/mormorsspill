import { redirect } from '@sveltejs/kit';
import { getRanking, listRecentGames, getActiveGame } from '$lib/server/repo.js';

export function load({ locals }) {
	if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
	const spaceId = locals.space.id;
	return {
		inviteCode: locals.space.invite_code,
		ranking: getRanking(spaceId),
		recentGames: listRecentGames(spaceId, 8),
		activeGame: getActiveGame(spaceId)
	};
}
