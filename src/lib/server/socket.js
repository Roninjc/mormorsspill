import { Server } from 'socket.io';
import { getGameSnapshot, saveRoundScores, finishGame, getActiveGame } from './repo.js';
import { isValidScore, FAILED_LAYDOWN_PENALTY } from '../rules.js';

let io;

export function injectSocketIO(httpServer) {
	if (io) return io;
	io = new Server(httpServer);

	io.on('connection', (socket) => {
		// --- Space-level presence (Asgard) ---
		socket.on('space:join', ({ spaceId } = {}) => {
			if (!spaceId) return;
			socket.join(`space:${spaceId}`);
			const active = getActiveGame(spaceId);
			socket.emit('presence:update', { activeGameId: active?.id ?? null });
		});

		// --- Game room ---
		socket.on('game:join', ({ gameId } = {}) => {
			if (!gameId) return;
			socket.join(`game:${gameId}`);
			socket.data.gameId = gameId;
			const snap = getGameSnapshot(gameId);
			if (snap) {
				socket.emit('game:state', snap);
				io.to(`space:${snap.game.space_id}`).emit('presence:update', {
					activeGameId: snap.game.status === 'in_progress' ? gameId : null
				});
			}
			emitWatchers(gameId);
		});

		socket.on('round:save', (payload = {}, cb) => {
			const { gameId, roundId, winnerParticipantId, entries = [] } = payload;
			const snap = getGameSnapshot(gameId);
			if (!snap || snap.game.status !== 'in_progress')
				return cb?.({ ok: false, error: 'Partida no editable' });
			if (!winnerParticipantId) return cb?.({ ok: false, error: 'Falta el ganador' });
			for (const e of entries) {
				if (e.participantId !== winnerParticipantId && !isValidScore(e.cardPoints))
					return cb?.({ ok: false, error: 'Los puntos deben ser múltiplo de 5' });
			}
			saveRoundScores({
				gameId,
				roundId,
				winnerParticipantId,
				entries: entries.map((e) => ({
					participantId: e.participantId,
					cardPoints: e.cardPoints || 0,
					penalty: e.penalty ? FAILED_LAYDOWN_PENALTY : 0
				})),
				enteredBy: null
			});
			io.to(`game:${gameId}`).emit('game:state', getGameSnapshot(gameId));
			cb?.({ ok: true });
		});

		socket.on('game:finish', ({ gameId } = {}, cb) => {
			const snap = getGameSnapshot(gameId);
			if (!snap) return cb?.({ ok: false });
			finishGame(gameId);
			io.to(`game:${gameId}`).emit('game:state', getGameSnapshot(gameId));
			io.to(`space:${snap.game.space_id}`).emit('presence:update', { activeGameId: null });
			cb?.({ ok: true });
		});

		// --- Ephemeral "who is scoring" indicator ---
		socket.on('editing', ({ gameId, roundNumber, name, on } = {}) => {
			if (!gameId) return;
			socket.to(`game:${gameId}`).emit('editing', { roundNumber, name, on });
		});

		socket.on('disconnect', () => {
			if (socket.data.gameId) emitWatchers(socket.data.gameId);
		});
	});

	function emitWatchers(gameId) {
		const room = io.sockets.adapter.rooms.get(`game:${gameId}`);
		io.to(`game:${gameId}`).emit('presence:game', { watchers: room ? room.size : 0 });
	}

	return io;
}
