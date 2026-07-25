import { db } from './db.js';
import { hashPin, generateInviteCode } from './auth.js';
import { ROUND_OBJECTIVES, TOTAL_ROUNDS, computeStandings } from '../rules.js';

// ---------- Ætt (space) + miembros + invitados ----------

export function createSpace({ name, memberName, avatar, pin }) {
	const tx = db.transaction(() => {
		let code;
		for (let i = 0; i < 5; i++) {
			code = generateInviteCode();
			if (!db.prepare('SELECT 1 FROM space WHERE invite_code = ?').get(code)) break;
		}
		const space = db
			.prepare('INSERT INTO space (name, invite_code) VALUES (?, ?) RETURNING *')
			.get(name, code);
		const member = db
			.prepare(
				'INSERT INTO member (space_id, display_name, avatar, pin_hash) VALUES (?, ?, ?, ?) RETURNING *'
			)
			.get(space.id, memberName, avatar || null, hashPin(pin));
		return { space, member };
	});
	return tx();
}

export function getSpaceByCode(code) {
	return db
		.prepare('SELECT * FROM space WHERE invite_code = ?')
		.get(String(code || '').toUpperCase().trim());
}

export function getSpace(id) {
	return db.prepare('SELECT * FROM space WHERE id = ?').get(id);
}

export function joinSpace({ code, name, avatar, pin }) {
	const space = getSpaceByCode(code);
	if (!space) return null;
	const member = db
		.prepare(
			'INSERT INTO member (space_id, display_name, avatar, pin_hash) VALUES (?, ?, ?, ?) RETURNING *'
		)
		.get(space.id, name, avatar || null, hashPin(pin));
	return { space, member };
}

export function getMember(id) {
	return db.prepare('SELECT * FROM member WHERE id = ?').get(id);
}

export function listMembers(spaceId) {
	return db
		.prepare('SELECT id, display_name, avatar FROM member WHERE space_id = ? ORDER BY display_name')
		.all(spaceId);
}

export function listGuests(spaceId) {
	return db
		.prepare('SELECT id, display_name, avatar FROM guest WHERE space_id = ? ORDER BY display_name')
		.all(spaceId);
}

/** Para el selector de login: todos los miembros agrupados por Ætt. */
export function listSpacesWithMembers() {
	const spaces = db.prepare('SELECT id, name FROM space ORDER BY name').all();
	return spaces.map((s) => ({ ...s, members: listMembers(s.id) }));
}

export function createGuest(spaceId, { name, avatar }) {
	return db
		.prepare('INSERT INTO guest (space_id, display_name, avatar) VALUES (?, ?, ?) RETURNING *')
		.get(spaceId, name, avatar || null);
}

/** Promociona un invitado a miembro y migra su historial de participaciones. */
export function promoteGuest(guestId, { pin }) {
	const guest = db.prepare('SELECT * FROM guest WHERE id = ?').get(guestId);
	if (!guest) return null;
	const tx = db.transaction(() => {
		const member = db
			.prepare(
				'INSERT INTO member (space_id, display_name, avatar, pin_hash) VALUES (?, ?, ?, ?) RETURNING *'
			)
			.get(guest.space_id, guest.display_name, guest.avatar, hashPin(pin));
		// repunta participaciones históricas del invitado al nuevo miembro
		db.prepare(
			'UPDATE participant SET member_id = ?, guest_id = NULL WHERE guest_id = ?'
		).run(member.id, guestId);
		db.prepare('DELETE FROM guest WHERE id = ?').run(guestId);
		return member;
	});
	return tx();
}

export function setIncludeGuests(spaceId, include) {
	db.prepare('UPDATE space SET include_guests_in_rankings = ? WHERE id = ?').run(
		include ? 1 : 0,
		spaceId
	);
}

// ---------- Partidas ----------

/**
 * Crea una partida ya en curso con sus 8 rondas.
 * participants: [{ memberId }|{ guestId }] en orden de asiento.
 */
export function createGame(spaceId, { participants, singleScorer = false, dealerSeat = 0 }) {
	const tx = db.transaction(() => {
		const game = db
			.prepare(
				`INSERT INTO game (space_id, status, single_scorer, dealer_seat, started_at)
				 VALUES (?, 'in_progress', ?, ?, datetime('now')) RETURNING *`
			)
			.get(spaceId, singleScorer ? 1 : 0, dealerSeat);
		const insP = db.prepare(
			'INSERT INTO participant (game_id, member_id, guest_id, seat) VALUES (?, ?, ?, ?)'
		);
		participants.forEach((p, seat) => {
			insP.run(game.id, p.memberId || null, p.guestId || null, seat);
		});
		const insR = db.prepare(
			'INSERT INTO round (game_id, number, objective) VALUES (?, ?, ?)'
		);
		for (const r of ROUND_OBJECTIVES) insR.run(game.id, r.number, r.objective);
		db.prepare(
			`INSERT INTO event (game_id, type, payload_json) VALUES (?, 'game_started', NULL)`
		).run(game.id);
		return game.id;
	});
	return tx();
}

/** Participantes de una partida con nombre/avatar resueltos. */
export function listParticipants(gameId) {
	return db
		.prepare(
			`SELECT p.id, p.seat, p.member_id, p.guest_id,
			        COALESCE(m.display_name, g.display_name) AS name,
			        COALESCE(m.avatar, g.avatar) AS avatar,
			        (p.guest_id IS NOT NULL) AS is_guest
			 FROM participant p
			 LEFT JOIN member m ON m.id = p.member_id
			 LEFT JOIN guest g ON g.id = p.guest_id
			 WHERE p.game_id = ?
			 ORDER BY p.seat`
		)
		.all(gameId);
}

/** Snapshot completo de una partida para la pantalla de anotación / espectador. */
export function getGameSnapshot(gameId) {
	const game = db.prepare('SELECT * FROM game WHERE id = ?').get(gameId);
	if (!game) return null;
	const participants = listParticipants(gameId);
	const rounds = db
		.prepare('SELECT * FROM round WHERE game_id = ? ORDER BY number').all(gameId);
	const roundIds = rounds.map((r) => r.id);
	const scores = roundIds.length
		? db
				.prepare(
					`SELECT * FROM score WHERE round_id IN (${roundIds.map(() => '?').join(',')})`
				)
				.all(...roundIds)
		: [];
	const standings = computeStandings(participants, scores, rounds);
	return { game, participants, rounds, scores, standings };
}

export function setScore({ roundId, participantId, cardPoints, penalty, enteredBy }) {
	db.prepare(
		`INSERT INTO score (round_id, participant_id, card_points, penalty, entered_by_participant_id, updated_at)
		 VALUES (?, ?, ?, ?, ?, datetime('now'))
		 ON CONFLICT(round_id, participant_id)
		 DO UPDATE SET card_points = excluded.card_points,
		               penalty = excluded.penalty,
		               entered_by_participant_id = excluded.entered_by_participant_id,
		               updated_at = datetime('now')`
	).run(roundId, participantId, cardPoints, penalty, enteredBy || null);
}

/**
 * Guarda una ronda completa de forma transaccional: puntuaciones de todos,
 * ganador a 0, marca la ronda como done y avanza la ronda actual (solo hacia delante).
 * entries: [{ participantId, cardPoints, penalty }]
 */
export function saveRoundScores({ gameId, roundId, winnerParticipantId, entries, enteredBy }) {
	const tx = db.transaction(() => {
		const round = db.prepare('SELECT * FROM round WHERE id = ?').get(roundId);
		if (!round) return;
		for (const e of entries) {
			const isWinner = e.participantId === winnerParticipantId;
			setScore({
				roundId,
				participantId: e.participantId,
				cardPoints: isWinner ? 0 : e.cardPoints,
				penalty: isWinner ? 0 : e.penalty,
				enteredBy
			});
		}
		db.prepare(
			`UPDATE round SET status = 'done', round_winner_participant_id = ? WHERE id = ?`
		).run(winnerParticipantId, roundId);
		if (round.number < TOTAL_ROUNDS) {
			db.prepare(
				'UPDATE game SET current_round = ? WHERE id = ? AND current_round < ?'
			).run(round.number + 1, gameId, round.number + 1);
		}
		db.prepare(
			`INSERT INTO event (game_id, type, payload_json) VALUES (?, 'round_closed', ?)`
		).run(gameId, JSON.stringify({ round: round.number, winner: winnerParticipantId }));
	});
	tx();
}

export function finishGame(gameId) {
	const snap = getGameSnapshot(gameId);
	if (!snap) return null;
	const winnerId = snap.standings[0]?.id || null;
	db.prepare(
		`UPDATE game SET status = 'finished', finished_at = datetime('now'), winner_participant_id = ?
		 WHERE id = ?`
	).run(winnerId, gameId);
	db.prepare(
		`INSERT INTO event (game_id, type, payload_json) VALUES (?, 'game_finished', ?)`
	).run(gameId, JSON.stringify({ winner: winnerId }));
	return winnerId;
}

export function getActiveGame(spaceId) {
	return db
		.prepare(
			`SELECT * FROM game WHERE space_id = ? AND status = 'in_progress'
			 ORDER BY started_at DESC LIMIT 1`
		)
		.get(spaceId);
}

// ---------- Estadísticas (Asgard) ----------

export function listRecentGames(spaceId, limit = 10) {
	const games = db
		.prepare(
			`SELECT * FROM game WHERE space_id = ? AND status = 'finished'
			 ORDER BY finished_at DESC LIMIT ?`
		)
		.all(spaceId, limit);
	return games.map((g) => {
		const parts = listParticipants(g.id);
		const winner = parts.find((p) => p.id === g.winner_participant_id);
		return { ...g, participants: parts, winnerName: winner?.name || null };
	});
}

/** Ranking de miembros: partidas, victorias, media de puntos. Invitados según toggle. */
export function getRanking(spaceId) {
	const space = getSpace(spaceId);
	const includeGuests = !!space?.include_guests_in_rankings;
	const games = db
		.prepare(`SELECT id, winner_participant_id FROM game WHERE space_id = ? AND status = 'finished'`)
		.all(spaceId);
	const agg = new Map(); // key: `m:{id}` | `g:{id}`
	for (const g of games) {
		const snap = getGameSnapshot(g.id);
		if (!snap) continue;
		for (const row of snap.standings) {
			const p = snap.participants.find((x) => x.id === row.id);
			if (!p) continue;
			if (p.is_guest && !includeGuests) continue;
			const key = p.member_id ? `m:${p.member_id}` : `g:${p.guest_id}`;
			if (!agg.has(key)) {
				agg.set(key, {
					key,
					name: p.name,
					avatar: p.avatar,
					isGuest: !!p.is_guest,
					games: 0,
					wins: 0,
					totalPoints: 0
				});
			}
			const a = agg.get(key);
			a.games += 1;
			a.totalPoints += row.total;
			if (g.winner_participant_id === row.id) a.wins += 1;
		}
	}
	const rows = [...agg.values()].map((a) => ({
		...a,
		winRate: a.games ? Math.round((a.wins / a.games) * 100) : 0,
		avgPoints: a.games ? Math.round(a.totalPoints / a.games) : 0
	}));
	rows.sort((a, b) => b.wins - a.wins || a.avgPoints - b.avgPoints);
	return rows;
}
