import { fail, redirect } from '@sveltejs/kit';
import { joinSpace, getSpaceByCode } from '$lib/server/repo.js';
import { setActiveSpace } from '$lib/server/session.js';

export function load({ locals, url }) {
	if (!locals.user) throw redirect(302, '/login');
	return {
		prefillCode: (url.searchParams.get('code') || '').toUpperCase(),
		profile: { display_name: locals.user.display_name, avatar: locals.user.avatar }
	};
}

export const actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) throw redirect(302, '/login');
		const form = await request.formData();
		const code = String(form.get('code') || '').trim().toUpperCase();
		if (!getSpaceByCode(code)) return fail(400, { error: 'Código de invitación no válido', code });

		const res = joinSpace({ code, userId: locals.user.id });
		if (!res) return fail(400, { error: 'No se pudo unir', code });
		setActiveSpace(cookies, res.space.id);
		throw redirect(303, '/asgard');
	}
};
