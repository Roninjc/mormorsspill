import { verifySession } from '$lib/server/auth.js';
import { getMember, getSpace } from '$lib/server/repo.js';

export async function handle({ event, resolve }) {
	const cookie = event.cookies.get('session');
	const memberId = verifySession(cookie);
	if (memberId) {
		const member = getMember(memberId);
		if (member) {
			event.locals.member = member;
			event.locals.space = getSpace(member.space_id);
		}
	}
	return resolve(event);
}
