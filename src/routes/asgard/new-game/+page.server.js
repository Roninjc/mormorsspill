import { fail, redirect } from '@sveltejs/kit';
import { listMembers, listGuests, createGame } from '$lib/server/repo.js';

export function load({ locals }) {
	if (!locals.member) throw redirect(302, '/');
	return {
		members: listMembers(locals.space.id),
		guests: listGuests(locals.space.id)
	};
}

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.member) throw redirect(302, '/');
		const form = await request.formData();
		const selected = form.getAll('p').map(String);
		const singleScorer = form.get('singleScorer') === 'on';

		const participants = selected.map((s) => {
			const [kind, id] = s.split(':');
			return kind === 'm' ? { memberId: Number(id) } : { guestId: Number(id) };
		});

		if (participants.length < 2) return fail(400, { error: 'Elige al menos 2 jugadores' });

		const gameId = createGame(locals.space.id, { participants, singleScorer });
		throw redirect(303, `/game/${gameId}`);
	}
};
