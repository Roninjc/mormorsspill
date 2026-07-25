import { redirect } from '@sveltejs/kit';
import { listSpacesWithMembers } from '$lib/server/repo.js';

export function load({ locals }) {
	if (locals.member) throw redirect(302, '/asgard');
	return { spaces: listSpacesWithMembers() };
}
