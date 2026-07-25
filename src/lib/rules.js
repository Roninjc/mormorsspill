// Reglas de Mormorsspill compartidas entre cliente y servidor.
// La app es un marcador: no valida melds, solo puntúa. Ver DESIGN.md §2/§3.

/** Los 8 contratos fijos, en orden de juego. */
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

/** Valores de carta para sumar cartas sobrantes. */
export const CARD_VALUES = [
	{ label: '2–9', points: 5 },
	{ label: 'Figuras y 10', points: 10 },
	{ label: 'As', points: 20 },
	{ label: 'Comodín', points: 50 }
];

export const FAILED_LAYDOWN_PENALTY = 100;

/** Toda puntuación válida es múltiplo de 5. */
export function isValidScore(n) {
	return Number.isInteger(n) && n >= 0 && n % 5 === 0;
}

/**
 * Calcula la tabla final a partir de participantes y sus puntuaciones por ronda.
 * Menor total gana; desempate por más rondas ganadas.
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
	// posición con empates compartidos (mismo total y mismas rondas ganadas)
	let pos = 0;
	rows.forEach((row, i) => {
		const prev = rows[i - 1];
		if (!prev || prev.total !== row.total || prev.roundsWon !== row.roundsWon) pos = i + 1;
		row.position = pos;
	});
	return rows;
}
