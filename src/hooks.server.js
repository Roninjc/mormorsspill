import { verifySession } from '$lib/server/auth.js';
import { getUser, getMembership, getSpace } from '$lib/server/repo.js';

export async function handle({ event, resolve }) {
	const userId = verifySession(event.cookies.get('session'));
	if (userId) {
		const user = getUser(userId);
		if (user) {
			event.locals.user = user;
			// Resolve the active Ætt (if any) into the same member/space shape the
			// rest of the app already relies on.
			const spaceId = Number(event.cookies.get('active_space')) || null;
			if (spaceId) {
				const membership = getMembership(userId, spaceId);
				if (membership) {
					event.locals.member = membership;
					event.locals.space = getSpace(spaceId);
				}
			}
		}
	}
	return resolve(event);
}
