import { error, fail, redirect } from '@sveltejs/kit';
import { getMember, getSpace } from '$lib/server/repo.js';
import { verifyPin } from '$lib/server/auth.js';
import { setSession } from '$lib/server/session.js';

export function load({ params }) {
	const member = getMember(Number(params.memberId));
	if (!member) throw error(404, 'Miembro no encontrado');
	const space = getSpace(member.space_id);
	return {
		m: { id: member.id, display_name: member.display_name, avatar: member.avatar },
		spaceName: space?.name
	};
}

export const actions = {
	default: async ({ request, params, cookies }) => {
		const member = getMember(Number(params.memberId));
		if (!member) return fail(404, { error: 'Miembro no encontrado' });
		const form = await request.formData();
		const pin = String(form.get('pin') || '').trim();
		if (!verifyPin(pin, member.pin_hash)) return fail(401, { error: 'PIN incorrecto' });
		setSession(cookies, member.id);
		throw redirect(303, '/asgard');
	}
};
