import { fail, redirect } from '@sveltejs/kit';
import {
	listUserSpaces,
	listMembers,
	getActiveGame,
	getMembership,
	updateUserProfile,
	changeUserPin
} from '$lib/server/repo.js';
import { setActiveSpace } from '$lib/server/session.js';

export function load({ locals }) {
	if (!locals.user) throw redirect(302, '/');
	const spaces = listUserSpaces(locals.user.id).map((s) => ({
		id: s.id,
		name: s.name,
		members: listMembers(s.id).length,
		activeGame: !!getActiveGame(s.id)
	}));
	return {
		profile: {
			id: locals.user.id,
			display_name: locals.user.display_name,
			avatar: locals.user.avatar
		},
		spaces
	};
}

export const actions = {
	// Choose which Ætt to act in, then drop into its Asgard.
	enter: async ({ request, locals, cookies }) => {
		if (!locals.user) throw redirect(302, '/');
		const form = await request.formData();
		const spaceId = Number(form.get('spaceId'));
		if (!getMembership(locals.user.id, spaceId)) return fail(403, { error: 'No perteneces a esa Ætt' });
		setActiveSpace(cookies, spaceId);
		throw redirect(303, '/asgard');
	},

	saveProfile: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/');
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const avatar = String(form.get('avatar') || '').trim();
		if (!name) return fail(400, { error: 'Falta tu nombre' });
		updateUserProfile(locals.user.id, { name, avatar });
		return { saved: true };
	},

	changePin: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/');
		const form = await request.formData();
		const pin = String(form.get('pin') || '').trim();
		if (!/^\d{4}$/.test(pin)) return fail(400, { pinError: 'El PIN debe ser de 4 dígitos' });
		changeUserPin(locals.user.id, pin);
		return { pinSaved: true };
	}
};
