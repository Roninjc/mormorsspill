import { fail, redirect } from '@sveltejs/kit';
import { joinSpace, getSpaceByCode } from '$lib/server/repo.js';
import { setSession } from '$lib/server/session.js';

export function load({ url }) {
	return { prefillCode: (url.searchParams.get('code') || '').toUpperCase() };
}

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const code = String(form.get('code') || '').trim().toUpperCase();
		const name = String(form.get('name') || '').trim();
		const avatar = String(form.get('avatar') || '').trim();
		const pin = String(form.get('pin') || '').trim();

		if (!getSpaceByCode(code)) return fail(400, { error: 'Código de invitación no válido', code });
		if (!name) return fail(400, { error: 'Falta tu nombre', code });
		if (!/^\d{4}$/.test(pin)) return fail(400, { error: 'El PIN debe ser de 4 dígitos', code });

		const res = joinSpace({ code, name, avatar, pin });
		if (!res) return fail(400, { error: 'No se pudo unir', code });
		setSession(cookies, res.member.id);
		throw redirect(303, '/asgard');
	}
};
