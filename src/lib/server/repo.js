import { db } from './db.js';
import { hashPin, verifyPin, generateInviteCode } from './auth.js';
import { ROUND_OBJECTIVES, TOTAL_ROUNDS, computeStandings } from '../rules.js';

// ---------- Users (global identity) ----------

export function createUser({ name, avatar, pin }) {
	return db
		.prepare('INSERT INTO user (display_name, avatar, pin_hash) VALUES (?, ?, ?) RETURNING *')
		.get(name, avatar || null, hashPin(pin));
}

export function getUser(id) {
	return db.prepare('SELECT * FROM user WHERE id = ?').get(id);
}

/** For the login picker: every profile on this server. */
export function listUsers() {
	return db.prepare('SELECT id, display_name, avatar FROM user ORDER BY display_name').all();
}

/** Case-insensitive lookup used to keep names unique at registration. */
export function getUserByName(name) {
	return db
		.prepare('SELECT * FROM user WHERE lower(display_name) = lower(?)')
		.get(String(name || '').trim());
}

/** Login by name + PIN. Returns the user only if a name match verifies the PIN. */
export function findUserByCredentials(name, pin) {
	const candidates = db
		.prepare('SELECT * FROM user WHERE lower(display_name) = lower(?)')
		.all(String(name || '').trim());
	for (const u of candidates) {
		if (verifyPin(pin, u.pin_hash)) return u;
	}
	return null;
}

/** Updates the global profile and propagates it to every membership + game history. */
export function updateUserProfile(userId, { name, avatar }) {
	db.transaction(() => {
		db.prepare('UPDATE user SET display_name = ?, avatar = ? WHERE id = ?').run(
			name,
			avatar || null,
			userId
		);
		db.prepare('UPDATE member SET display_name = ?, avatar = ? WHERE user_id = ?').run(
			name,
			avatar || null,
			userId
		);
	})();
	return getUser(userId);
}

export function changeUserPin(userId, pin) {
	db.prepare('UPDATE user SET pin_hash = ? WHERE id = ?').run(hashPin(pin), userId);
}

// ---------- Ætt (space) + memberships + guests ----------

/** Creates a membership row (a user's seat in an Ætt), denormalizing their profile. */
function insertMembership(userId, spaceId) {
	const u = getUser(userId);
	return db
		.prepare(
			"INSERT INTO member (space_id, user_id, display_name, avatar, pin_hash) VALUES (?, ?, ?, ?, '') RETURNING *"
		)
		.get(spaceId, userId, u.display_name, u.avatar || null);
}

export function getMembership(userId, spaceId) {
	return db.prepare('SELECT * FROM member WHERE user_id = ? AND space_id = ?').get(userId, spaceId);
}

/** Aggregate play record across all of a user's Ætts, for the profile card. */
export function getUserStats(userId) {
	const row = db
		.prepare(
			`SELECT
			   COUNT(DISTINCT g.id) AS games,
			   COUNT(DISTINCT CASE WHEN g.winner_participant_id = p.id THEN g.id END) AS wins
			 FROM member m
			 JOIN participant p ON p.member_id = m.id
			 JOIN game g ON g.id = p.game_id AND g.status = 'finished'
			 WHERE m.user_id = ?`
		)
		.get(userId);
	return { games: row?.games || 0, wins: row?.wins || 0 };
}

/** The Ætts a user belongs to, for the Midgard hub. */
export function listUserSpaces(userId) {
	return db
		.prepare(
			`SELECT s.id, s.name, s.invite_code, m.id AS member_id
			 FROM member m JOIN space s ON s.id = m.space_id
			 WHERE m.user_id = ? ORDER BY s.name`
		)
		.all(userId);
}

export function createSpace({ name, userId }) {
	const tx = db.transaction(() => {
		let code;
		for (let i = 0; i < 5; i++) {
			code = generateInviteCode();
			if (!db.prepare('SELECT 1 FROM space WHERE invite_code = ?').get(code)) break;
		}
		const space = db
			.prepare('INSERT INTO space (name, invite_code) VALUES (?, ?) RETURNING *')
			.get(name, code);
		const member = insertMembership(userId, space.id);
		return { space, member };
	});
	return tx();
}

/** Member and finished-game counts for the Ætt header. */
export function getSpaceStats(spaceId) {
	const members = db.prepare('SELECT COUNT(*) AS c FROM member WHERE space_id = ?').get(spaceId).c;
	const games = db
		.prepare("SELECT COUNT(*) AS c FROM game WHERE space_id = ? AND status = 'finished'")
		.get(spaceId).c;
	return { members, games };
}

export function getSpaceByCode(code) {
	return db
		.prepare('SELECT * FROM space WHERE invite_code = ?')
		.get(String(code || '').toUpperCase().trim());
}

export function getSpace(id) {
	return db.prepare('SELECT * FROM space WHERE id = ?').get(id);
}

/** Adds a user to the Ætt with the given code (idempotent if already a member). */
export function joinSpace({ code, userId }) {
	const space = getSpaceByCode(code);
	if (!space) return null;
	const member = getMembership(userId, space.id) || insertMembership(userId, space.id);
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

/** Visible (non-hidden) guests — used for game setup and rankings. */
export function listGuests(spaceId) {
	return db
		.prepare(
			'SELECT id, display_name, avatar FROM guest WHERE space_id = ? AND hidden = 0 ORDER BY display_name'
		)
		.all(spaceId);
}

/** Guests with a games-played count, filtered by hidden flag (for settings). */
export function listGuestsDetailed(spaceId, hidden = 0) {
	return db
		.prepare(
			`SELECT g.id, g.display_name, g.avatar,
			        (SELECT COUNT(*) FROM participant p WHERE p.guest_id = g.id) AS games
			 FROM guest g WHERE g.space_id = ? AND g.hidden = ? ORDER BY g.display_name`
		)
		.all(spaceId, hidden ? 1 : 0);
}

/** Hides/unhides a guest: keeps data but removes them from lists and rankings. */
export function setGuestHidden(guestId, spaceId, hidden) {
	db.prepare('UPDATE guest SET hidden = ? WHERE id = ? AND space_id = ?').run(
		hidden ? 1 : 0,
		guestId,
		spaceId
	);
}

export function createGuest(spaceId, { name, avatar }) {
	return db
		.prepare('INSERT INTO guest (space_id, display_name, avatar) VALUES (?, ?, ?) RETURNING *')
		.get(spaceId, name, avatar || null);
}

/** Promotes a guest to a full account (user + membership), keeping their history. */
export function promoteGuest(guestId, { pin }) {
	const guest = db.prepare('SELECT * FROM guest WHERE id = ?').get(guestId);
	if (!guest) return null;
	const tx = db.transaction(() => {
		const user = db
			.prepare('INSERT INTO user (display_name, avatar, pin_hash) VALUES (?, ?, ?) RETURNING *')
			.get(guest.display_name, guest.avatar, hashPin(pin));
		const member = insertMembership(user.id, guest.space_id);
		// repoint the guest's historical participations to the new membership
		db.prepare('UPDATE participant SET member_id = ?, guest_id = NULL WHERE guest_id = ?').run(
			member.id,
			guestId
		);
		db.prepare('DELETE FROM guest WHERE id = ?').run(guestId);
		return member;
	});
	return tx();
}

/**
 * Permanently deletes an Ætt and everything under it (games, rounds, scores,
 * events, memberships, guests). Users are kept — they may belong to other Ætts;
 * only their membership rows for this space are removed.
 */
export function deleteSpace(spaceId) {
	const tx = db.transaction(() => {
		const games = db.prepare('SELECT id FROM game WHERE space_id = ?').all(spaceId).map((g) => g.id);
		if (games.length) {
			const ph = games.map(() => '?').join(',');
			db.prepare(
				`DELETE FROM score WHERE round_id IN (SELECT id FROM round WHERE game_id IN (${ph}))`
			).run(...games);
			db.prepare(`DELETE FROM round WHERE game_id IN (${ph})`).run(...games);
			db.prepare(`DELETE FROM participant WHERE game_id IN (${ph})`).run(...games);
			db.prepare(`DELETE FROM event WHERE game_id IN (${ph})`).run(...games);
			db.prepare('DELETE FROM game WHERE space_id = ?').run(spaceId);
		}
		db.prepare('DELETE FROM member WHERE space_id = ?').run(spaceId);
		db.prepare('DELETE FROM guest WHERE space_id = ?').run(spaceId);
		db.prepare('DELETE FROM space WHERE id = ?').run(spaceId);
	});
	tx();
}

/**
 * Merges a guest into an existing member (same person). The guest's game history
 * is repointed to the member and the guest is deleted. Deliberate action taken
 * from settings — never auto-inferred from a name match.
 */
export function unifyGuestIntoMember(guestId, memberId, spaceId) {
	const guest = db.prepare('SELECT * FROM guest WHERE id = ? AND space_id = ?').get(guestId, spaceId);
	const member = db
		.prepare('SELECT * FROM member WHERE id = ? AND space_id = ?')
		.get(memberId, spaceId);
	if (!guest || !member) return null;
	const tx = db.transaction(() => {
		db.prepare('UPDATE participant SET member_id = ?, guest_id = NULL WHERE guest_id = ?').run(
			memberId,
			guestId
		);
		db.prepare('DELETE FROM guest WHERE id = ?').run(guestId);
	});
	tx();
	return member;
}

/**
 * Deletes a guest. Refuses if the guest already played games (would corrupt
 * history) — those should be unified into a member instead.
 */
export function deleteGuest(guestId, spaceId) {
	const guest = db.prepare('SELECT * FROM guest WHERE id = ? AND space_id = ?').get(guestId, spaceId);
	if (!guest) return { ok: false, reason: 'not_found' };
	const plays = db.prepare('SELECT COUNT(*) AS c FROM participant WHERE guest_id = ?').get(guestId).c;
	if (plays > 0) return { ok: false, reason: 'has_games' };
	db.prepare('DELETE FROM guest WHERE id = ?').run(guestId);
	return { ok: true };
}

export function setIncludeGuests(spaceId, include) {
	db.prepare('UPDATE space SET include_guests_in_rankings = ? WHERE id = ?').run(
		include ? 1 : 0,
		spaceId
	);
}

// ---------- Games ----------

/**
 * Creates an in-progress game with its 8 rounds.
 * participants: [{ memberId }|{ guestId }] in seat order.
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

/** A game's participants with name/avatar resolved. */
export function listParticipants(gameId) {
	return db
		.prepare(
			`SELECT p.id, p.seat, p.member_id, p.guest_id,
			        COALESCE(m.display_name, g.display_name) AS name,
			        COALESCE(m.avatar, g.avatar) AS avatar,
			        (p.guest_id IS NOT NULL) AS is_guest,
			        g.hidden AS guest_hidden
			 FROM participant p
			 LEFT JOIN member m ON m.id = p.member_id
			 LEFT JOIN guest g ON g.id = p.guest_id
			 WHERE p.game_id = ?
			 ORDER BY p.seat`
		)
		.all(gameId);
}

/** Full snapshot of a game for the scoring / spectator screen. */
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
 * Saves a full round transactionally: everyone's scores, winner set to 0,
 * marks the round done and advances the current round (forward only).
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

// ---------- Stats (Asgard) ----------

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

/** Member ranking: games, wins, average points. Guests per the toggle. */
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
			// Hidden guests never count; other guests only if the toggle is on.
			if (p.is_guest && (p.guest_hidden || !includeGuests)) continue;
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
