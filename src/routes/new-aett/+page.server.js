import { fail, redirect } from '@sveltejs/kit';
import { createSpace } from '$lib/server/repo.js';
import { setActiveSpace } from '$lib/server/session.js';

export function load({ locals }) {
	if (!locals.user) throw redirect(302, '/login');
	return { profile: { display_name: locals.user.display_name, avatar: locals.user.avatar } };
}

export const actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) throw redirect(302, '/login');
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		if (!name) return fail(400, { error: 'Falta el nombre del Ætt' });

		const { space } = createSpace({ name, userId: locals.user.id });
		setActiveSpace(cookies, space.id);
		throw redirect(303, '/asgard');
	}
};
