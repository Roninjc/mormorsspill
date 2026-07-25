import { fail, redirect } from '@sveltejs/kit';
import {
	listMembers,
	listGuests,
	createGuest,
	promoteGuest,
	setIncludeGuests,
	getSpace
} from '$lib/server/repo.js';

export function load({ locals, url }) {
	if (!locals.member) throw redirect(302, '/');
	const space = getSpace(locals.space.id);
	return {
		members: listMembers(space.id),
		guests: listGuests(space.id),
		inviteCode: space.invite_code,
		includeGuests: !!space.include_guests_in_rankings,
		origin: url.origin
	};
}

export const actions = {
	addGuest: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, '/');
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const avatar = String(form.get('avatar') || '').trim();
		if (!name) return fail(400, { error: 'Falta el nombre del invitado' });
		createGuest(locals.space.id, { name, avatar });
		return { added: true };
	},

	promote: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, '/');
		const form = await request.formData();
		const guestId = Number(form.get('guestId'));
		const pin = String(form.get('pin') || '').trim();
		if (!/^\d{4}$/.test(pin)) return fail(400, { error: 'El PIN debe ser de 4 dígitos', promoteId: guestId });
		promoteGuest(guestId, { pin });
		return { promoted: true };
	},

	toggleGuests: async ({ locals }) => {
		if (!locals.member) throw redirect(302, '/');
		const space = getSpace(locals.space.id);
		setIncludeGuests(locals.space.id, !space.include_guests_in_rankings);
		return { toggled: true };
	}
};
