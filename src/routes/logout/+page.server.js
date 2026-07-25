import { redirect } from '@sveltejs/kit';
import { clearSession } from '$lib/server/session.js';

export const actions = {
	default: async ({ cookies }) => {
		clearSession(cookies);
		throw redirect(303, '/');
	}
};

export function load() {
	throw redirect(303, '/');
}
