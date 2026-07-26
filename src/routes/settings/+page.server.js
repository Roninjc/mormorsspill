import { fail, redirect } from '@sveltejs/kit';
import {
	listMembers,
	listGuestsDetailed,
	createGuest,
	promoteGuest,
	unifyGuestIntoMember,
	deleteGuest,
	setGuestHidden,
	setIncludeGuests,
	getSpace,
	deleteSpace
} from '$lib/server/repo.js';
import { clearActiveSpace } from '$lib/server/session.js';

export function load({ locals, url }) {
	if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
	const space = getSpace(locals.space.id);
	return {
		members: listMembers(space.id),
		guests: listGuestsDetailed(space.id, 0),
		hiddenGuests: listGuestsDetailed(space.id, 1),
		inviteCode: space.invite_code,
		includeGuests: !!space.include_guests_in_rankings,
		origin: url.origin
	};
}

export const actions = {
	addGuest: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const avatar = String(form.get('avatar') || '').trim();
		if (!name) return fail(400, { error: 'Falta el nombre del invitado', addGuest: true });
		createGuest(locals.space.id, { name, avatar });
		return { added: true };
	},

	removeGuest: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const form = await request.formData();
		const guestId = Number(form.get('guestId'));
		const res = deleteGuest(guestId, locals.space.id);
		if (!res.ok) {
			const msg =
				res.reason === 'has_games'
					? 'Ha jugado partidas; no se puede eliminar (únelo con un miembro).'
					: 'No se pudo eliminar';
			return fail(400, { error: msg, removeId: guestId });
		}
		return { removed: true };
	},

	promote: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const form = await request.formData();
		const guestId = Number(form.get('guestId'));
		const pin = String(form.get('pin') || '').trim();
		if (!/^\d{4}$/.test(pin)) return fail(400, { error: 'El PIN debe ser de 4 dígitos', promoteId: guestId });
		promoteGuest(guestId, { pin });
		return { promoted: true };
	},

	unify: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const form = await request.formData();
		const guestId = Number(form.get('guestId'));
		const memberId = Number(form.get('memberId'));
		if (!memberId) return fail(400, { error: 'Elige un miembro', unifyId: guestId });
		unifyGuestIntoMember(guestId, memberId, locals.space.id);
		return { unified: true };
	},

	hideGuest: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const form = await request.formData();
		setGuestHidden(Number(form.get('guestId')), locals.space.id, true);
		return { hidden: true };
	},

	unhideGuest: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const form = await request.formData();
		setGuestHidden(Number(form.get('guestId')), locals.space.id, false);
		return { unhidden: true };
	},

	toggleGuests: async ({ locals }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const space = getSpace(locals.space.id);
		setIncludeGuests(locals.space.id, !space.include_guests_in_rankings);
		return { toggled: true };
	},

	deleteSpace: async ({ request, locals, cookies }) => {
		if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
		const space = getSpace(locals.space.id);
		const form = await request.formData();
		const confirm = String(form.get('confirm') || '').trim();
		// GitHub-style: require typing the exact Ætt name.
		if (confirm !== space.name) {
			return fail(400, { deleteError: 'El nombre no coincide. Escríbelo tal cual para confirmar.' });
		}
		deleteSpace(space.id);
		clearActiveSpace(cookies);
		throw redirect(303, '/midgard');
	}
};
