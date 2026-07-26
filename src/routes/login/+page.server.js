import { fail, redirect } from '@sveltejs/kit';
import { findUserByCredentials } from '$lib/server/repo.js';
import { setSession } from '$lib/server/session.js';

/** Only allow local same-site redirect targets (avoid open redirects). */
function safeNext(v) {
	return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : null;
}

export function load({ locals, url }) {
	if (locals.user) throw redirect(302, '/midgard');
	return { next: safeNext(url.searchParams.get('next')) };
}

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const pin = String(form.get('pin') || '').trim();
		const next = safeNext(String(form.get('next') || ''));
		if (!name || !pin) return fail(400, { error: 'Escribe tu nombre y tu PIN', name, next });
		const user = findUserByCredentials(name, pin);
		if (!user) return fail(401, { error: 'Nombre o PIN incorrecto', name, next });
		setSession(cookies, user.id);
		throw redirect(303, next || '/midgard');
	}
};
