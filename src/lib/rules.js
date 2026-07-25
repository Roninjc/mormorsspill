// Mormorsspill rules shared between client and server.
// The app is a scorekeeper: it does not validate melds, only scores. See DESIGN.md §2/§3.

/** The 8 fixed contracts, in play order. */
export const ROUND_OBJECTIVES = [
	{ number: 1, objective: '2 tríos', note: null },
	{ number: 2, objective: '1 trío + 1 escalera', note: null },
	{ number: 3, objective: '2 escaleras', note: null },
	{ number: 4, objective: '3 tríos', note: null },
	{ number: 5, objective: '2 tríos + 1 escalera', note: null },
	{ number: 6, objective: '1 trío + 2 escaleras', note: 'La perfecta: no se puede pedir' },
	{ number: 7, objective: '4 tríos', note: null },
	{ number: 8, objective: '3 escaleras', note: 'Solo se puede pedir una vez' }
];

export const TOTAL_ROUNDS = ROUND_OBJECTIVES.length;

/** Card values for tallying leftover cards. */
export const CARD_VALUES = [
	{ label: '2–9', points: 5 },
	{ label: 'Figuras y 10', points: 10 },
	{ label: 'As', points: 20 },
	{ label: 'Comodín', points: 50 }
];

export const FAILED_LAYDOWN_PENALTY = 100;

/** Every valid score is a multiple of 5. */
export function isValidScore(n) {
	return Number.isInteger(n) && n >= 0 && n % 5 === 0;
}

/**
 * Computes the final standings from participants and their per-round scores.
 * Lowest total wins; tie-break by most rounds won.
 * @param {{id:number,name:string}[]} participants
 * @param {{participant_id:number, card_points:number, penalty:number}[]} scores
 * @param {{round_winner_participant_id:number|null}[]} rounds
 */
export function computeStandings(participants, scores, rounds) {
	const byPart = new Map(
		participants.map((p) => [p.id, { ...p, total: 0, roundsWon: 0, perRound: {} }])
	);
	for (const s of scores) {
		const row = byPart.get(s.participant_id);
		if (!row) continue;
		const pts = (s.card_points || 0) + (s.penalty || 0);
		row.total += pts;
		row.perRound[s.round_id] = pts;
	}
	for (const r of rounds) {
		if (r.round_winner_participant_id && byPart.has(r.round_winner_participant_id)) {
			byPart.get(r.round_winner_participant_id).roundsWon += 1;
		}
	}
	const rows = [...byPart.values()].sort(
		(a, b) => a.total - b.total || b.roundsWon - a.roundsWon
	);
	// shared position for ties (same total and same rounds won)
	let pos = 0;
	rows.forEach((row, i) => {
		const prev = rows[i - 1];
		if (!prev || prev.total !== row.total || prev.roundsWon !== row.roundsWon) pos = i + 1;
		row.position = pos;
	});
	return rows;
}
