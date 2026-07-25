import { fail, redirect } from '@sveltejs/kit';
import { createSpace } from '$lib/server/repo.js';
import { setSession } from '$lib/server/session.js';

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const memberName = String(form.get('memberName') || '').trim();
		const avatar = String(form.get('avatar') || '').trim();
		const pin = String(form.get('pin') || '').trim();

		if (!name || !memberName) return fail(400, { error: 'Faltan nombres' });
		if (!/^\d{4}$/.test(pin)) return fail(400, { error: 'El PIN debe ser de 4 dígitos' });

		const { member } = createSpace({ name, memberName, avatar, pin });
		setSession(cookies, member.id);
		throw redirect(303, '/asgard');
	}
};
