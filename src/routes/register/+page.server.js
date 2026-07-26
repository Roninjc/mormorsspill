import { fail, redirect } from '@sveltejs/kit';
import { createUser, getUserByName } from '$lib/server/repo.js';
import { setSession } from '$lib/server/session.js';

export function load({ locals }) {
	if (locals.user) throw redirect(302, '/midgard');
	return {};
}

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const avatar = String(form.get('avatar') || '').trim();
		const pin = String(form.get('pin') || '').trim();
		if (!name) return fail(400, { error: 'Elige un nombre' });
		if (!/^\d{4}$/.test(pin)) return fail(400, { error: 'El PIN debe ser de 4 dígitos', name });
		if (getUserByName(name)) {
			return fail(400, { error: 'Ya existe un perfil con ese nombre. Si es tuyo, inicia sesión.', name });
		}
		const user = createUser({ name, avatar, pin });
		setSession(cookies, user.id);
		throw redirect(303, '/midgard');
	}
};
