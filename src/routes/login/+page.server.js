import { fail, redirect } from '@sveltejs/kit';
import { findUserByCredentials } from '$lib/server/repo.js';
import { setSession } from '$lib/server/session.js';

export function load({ locals }) {
	if (locals.user) throw redirect(302, '/midgard');
	return {};
}

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const pin = String(form.get('pin') || '').trim();
		if (!name || !pin) return fail(400, { error: 'Escribe tu nombre y tu PIN', name });
		const user = findUserByCredentials(name, pin);
		if (!user) return fail(401, { error: 'Nombre o PIN incorrecto', name });
		setSession(cookies, user.id);
		throw redirect(303, '/midgard');
	}
};
