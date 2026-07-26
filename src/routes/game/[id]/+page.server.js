import { error, fail, redirect } from '@sveltejs/kit';
import { getGameSnapshot, saveRoundScores, finishGame } from '$lib/server/repo.js';
import { ROUND_OBJECTIVES, isValidScore, FAILED_LAYDOWN_PENALTY } from '$lib/rules.js';

function loadGame(params, locals) {
	const snap = getGameSnapshot(Number(params.id));
	if (!snap) throw error(404, 'Partida no encontrada');
	if (!locals.member || snap.game.space_id !== locals.space.id) throw error(403, 'Sin acceso');
	return snap;
}

export function load({ params, locals }) {
	if (!locals.member) throw redirect(302, locals.user ? '/midgard' : '/');
	const snap = loadGame(params, locals);
	const notes = Object.fromEntries(ROUND_OBJECTIVES.map((r) => [r.number, r.note]));
	const rounds = snap.rounds.map((r) => ({ ...r, note: notes[r.number] || null }));
	return {
		game: snap.game,
		participants: snap.participants,
		rounds,
		scores: snap.scores,
		standings: snap.standings,
		canEdit: !snap.game.single_scorer || true // F1: open editing for logged-in members
	};
}

export const actions = {
	saveRound: async ({ request, params, locals }) => {
		const snap = loadGame(params, locals);
		if (snap.game.status !== 'in_progress') return fail(400, { error: 'La partida ya terminó' });
		const form = await request.formData();
		const roundId = Number(form.get('roundId'));
		const winner = Number(form.get('winner'));
		if (!winner) return fail(400, { error: 'Marca quién ganó la ronda' });

		const entries = [];
		for (const p of snap.participants) {
			const cp = Number(form.get(`cp_${p.id}`) || 0);
			const pen = form.get(`pen_${p.id}`) === 'on' ? FAILED_LAYDOWN_PENALTY : 0;
			if (p.id !== winner && !isValidScore(cp)) {
				return fail(400, { error: `Los puntos de ${p.name} deben ser múltiplo de 5` });
			}
			entries.push({ participantId: p.id, cardPoints: cp, penalty: pen });
		}

		saveRoundScores({
			gameId: snap.game.id,
			roundId,
			winnerParticipantId: winner,
			entries,
			enteredBy: null
		});
		return { saved: true };
	},

	finish: async ({ params, locals }) => {
		const snap = loadGame(params, locals);
		finishGame(snap.game.id);
		throw redirect(303, `/game/${snap.game.id}/result`);
	}
};
