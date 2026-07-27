<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Avatar from '$lib/Avatar.svelte';
	import BackLink from '$lib/BackLink.svelte';
	import { getSocket } from '$lib/socketClient.js';
	import { CARD_VALUES, FAILED_LAYDOWN_PENALTY, ROUND_OBJECTIVES, TOTAL_ROUNDS } from '$lib/rules.js';

	let { data } = $props();

	// Live game state (starts from the SSR snapshot, refreshed via socket).
	let snap = $state({
		game: data.game,
		participants: data.participants,
		rounds: data.rounds,
		scores: data.scores,
		standings: data.standings
	});

	let activeRound = $state(data.game.current_round);
	let cardPoints = $state({});
	let penalty = $state({});
	let winner = $state(null);
	let errorMsg = $state('');
	let watchers = $state(1);
	let editingBy = $state(null); // { name, roundNumber }
	let menu = $state(null); // null | 'menu' | 'finish' | 'discard'
	let scoreWrap; // scoreboard scroll container
	let socket;
	let editTimer;

	const NOTE = Object.fromEntries(ROUND_OBJECTIVES.map((r) => [r.number, r.note]));
	const roundsByNumber = $derived(Object.fromEntries(snap.rounds.map((r) => [r.number, r])));
	const activeRoundObj = $derived(roundsByNumber[activeRound]);
	const allDone = $derived(snap.rounds.every((r) => r.status === 'done'));
	// A round that hasn't started yet (after the current one) can't be scored.
	const locked = $derived(!!activeRoundObj && roundStatus(activeRoundObj) === 'future');

	const scoreMap = $derived.by(() => {
		const m = {};
		for (const s of snap.scores) (m[s.round_id] ??= {})[s.participant_id] = s;
		return m;
	});

	// (Re)initializes the editor when the active round changes or new state arrives.
	$effect(() => {
		activeRound;
		snap;
		const r = roundsByNumber[activeRound];
		const sm = (r && scoreMap[r.id]) || {};
		const cp = {};
		const pen = {};
		for (const p of snap.participants) {
			cp[p.id] = sm[p.id]?.card_points ?? 0;
			pen[p.id] = (sm[p.id]?.penalty ?? 0) > 0;
		}
		cardPoints = cp;
		penalty = pen;
		winner = r?.round_winner_participant_id ?? null;
	});

	// Keep the last completed round column visible in the scoreboard.
	$effect(() => {
		snap;
		requestAnimationFrame(scrollToLastDone);
	});
	function scrollToLastDone() {
		if (!scoreWrap) return;
		const done = snap.rounds.filter((r) => r.status === 'done');
		const last = done.at(-1);
		if (!last) {
			scoreWrap.scrollLeft = 0;
			return;
		}
		const cell = scoreWrap.querySelector(`th[data-round="${last.number}"]`);
		const totalCell = scoreWrap.querySelector('th.col-total');
		if (!cell) return;
		const wrapRect = scoreWrap.getBoundingClientRect();
		const cellRect = cell.getBoundingClientRect();
		const totalW = totalCell ? totalCell.offsetWidth : 0;
		scoreWrap.scrollLeft += cellRect.right - wrapRect.right + totalW;
	}

	function roundStatus(r) {
		if (r.status === 'done') return 'done';
		if (r.number > snap.game.current_round) return 'future';
		return 'current';
	}

	onMount(() => {
		socket = getSocket();
		const join = () => socket.emit('game:join', { gameId: snap.game.id });
		join();
		socket.on('connect', join);
		socket.on('game:state', (s) => {
			if (s?.game?.id === snap.game.id) snap = s;
		});
		socket.on('game:deleted', ({ gameId }) => {
			if (gameId === snap.game.id) goto('/asgard');
		});
		socket.on('presence:game', ({ watchers: w }) => (watchers = w));
		socket.on('editing', ({ name, roundNumber, on }) => {
			if (on) {
				editingBy = { name, roundNumber };
				clearTimeout(editTimer);
				editTimer = setTimeout(() => (editingBy = null), 4000);
			} else if (editingBy?.name === name) {
				editingBy = null;
			}
		});
		return () => {
			socket.off('connect', join);
			socket.off('game:state');
			socket.off('game:deleted');
			socket.off('presence:game');
			socket.off('editing');
			clearTimeout(editTimer);
		};
	});

	// Let others know which round I'm scoring.
	$effect(() => {
		const r = activeRound;
		if (socket && snap.game.status === 'in_progress') {
			socket.emit('editing', {
				gameId: snap.game.id,
				roundNumber: r,
				name: data.member?.display_name,
				on: true
			});
		}
	});

	function addPoints(pid, n) {
		if (winner === pid) return;
		cardPoints = { ...cardPoints, [pid]: (cardPoints[pid] || 0) + n };
	}
	function clearPoints(pid) {
		cardPoints = { ...cardPoints, [pid]: 0 };
	}
	function toggleWinner(pid) {
		if (winner === pid) {
			winner = null;
		} else {
			winner = pid;
			cardPoints = { ...cardPoints, [pid]: 0 };
			penalty = { ...penalty, [pid]: false };
		}
	}
	function togglePenalty(pid) {
		penalty = { ...penalty, [pid]: !penalty[pid] };
	}
	function roundPointsOf(p) {
		return (
			(winner === p.id ? 0 : cardPoints[p.id] || 0) + (penalty[p.id] ? FAILED_LAYDOWN_PENALTY : 0)
		);
	}

	const canSave = $derived(winner != null);

	function saveRound() {
		errorMsg = '';
		const entries = snap.participants.map((p) => ({
			participantId: p.id,
			cardPoints: cardPoints[p.id] || 0,
			penalty: !!penalty[p.id]
		}));
		socket.emit(
			'round:save',
			{ gameId: snap.game.id, roundId: activeRoundObj.id, winnerParticipantId: winner, entries },
			(res) => {
				if (res?.ok) {
					if (res.snap?.game?.id === snap.game.id) snap = res.snap;
					if (activeRound < TOTAL_ROUNDS) activeRound = activeRound + 1;
				} else errorMsg = res?.error || 'No se pudo guardar';
			}
		);
	}
	function finish() {
		socket.emit('game:finish', { gameId: snap.game.id }, (res) => {
			if (res?.ok) goto(`/game/${snap.game.id}/result`);
		});
	}
	function discard() {
		socket.emit('game:delete', { gameId: snap.game.id }, (res) => {
			if (res?.ok) goto('/asgard');
		});
	}

	$effect(() => {
		document.body.style.overflow = menu ? 'hidden' : '';
		return () => (document.body.style.overflow = '');
	});
	function onKey(e) {
		if (e.key === 'Escape') menu = null;
	}

	// Swipe left/right to move between rounds (in addition to the top selector).
	let touchX = 0;
	let touchY = 0;
	let touchTarget = null;
	function onTouchStart(e) {
		const t = e.changedTouches[0];
		touchX = t.clientX;
		touchY = t.clientY;
		touchTarget = e.target;
	}
	function onTouchEnd(e) {
		if (menu) return;
		// Don't hijack a horizontal drag on the scrollable scoreboard.
		if (touchTarget?.closest?.('.score-wrap')) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - touchX;
		const dy = t.clientY - touchY;
		if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		const next = dx < 0 ? activeRound + 1 : activeRound - 1;
		if (next >= 1 && next <= TOTAL_ROUNDS) activeRound = next;
	}
</script>

<svelte:window onkeydown={onKey} ontouchstart={onTouchStart} ontouchend={onTouchEnd} />

<div class="topbar">
	<BackLink href="/asgard" label="Asgard" />
	<div class="row" style="gap: 14px">
		<span class="watchers" title="Espectadores">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
			{watchers}
		</span>
		{#if snap.game.status === 'in_progress'}
			<button class="close-btn" type="button" aria-label="Opciones de la partida" onclick={() => (menu = 'menu')}>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<circle cx="5" cy="12" r="1.7" />
					<circle cx="12" cy="12" r="1.7" />
					<circle cx="19" cy="12" r="1.7" />
				</svg>
			</button>
		{/if}
	</div>
</div>

{#if editingBy}
	<p class="notice">✍️ {editingBy.name} está anotando la ronda {editingBy.roundNumber}</p>
{/if}

<div class="round-selector">
	{#each snap.rounds as r}
		<button
			class="rsel rsel-{roundStatus(r)}"
			class:sel={r.number === activeRound}
			class:special={NOTE[r.number]}
			type="button"
			onclick={() => (activeRound = r.number)}
			title={NOTE[r.number] ? `Ronda especial: ${NOTE[r.number]}` : ''}
		>
			{r.number}
		</button>
	{/each}
</div>

{#if activeRoundObj}
	<div class="round-head" class:special={NOTE[activeRoundObj.number]}>
		<div class="rh-eyebrow">
			Ronda {activeRoundObj.number}{#if activeRoundObj.status === 'done'} · cerrada{/if}
		</div>
		<div class="rh-objective">{activeRoundObj.objective}</div>
		{#if NOTE[activeRoundObj.number]}<div class="rh-note">⚑ {NOTE[activeRoundObj.number]}</div>{/if}
	</div>
{/if}

<!-- Scoreboard (on top) -->
<div class="card">
	<h3>Marcador</h3>
	<div class="score-wrap" bind:this={scoreWrap}>
		<table class="score">
			<thead>
				<tr>
					<th class="col-name">Jugador</th>
					{#each snap.rounds as r}<th class="col-round" data-round={r.number}>{r.number}</th>{/each}
					<th class="col-total">Σ</th>
				</tr>
			</thead>
			<tbody>
				{#each snap.standings as row}
					<tr>
						<td class="col-name">{row.name}</td>
						{#each snap.rounds as r}<td class="col-round">{row.perRound[r.id] ?? '·'}</td>{/each}
						<td class="col-total">{row.total}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Scoring (below, near the thumbs) -->
{#if snap.game.status === 'in_progress' && activeRoundObj}
	<div class="card">
		<h3>Anotación</h3>

		<div class="players" class:locked>
			{#each snap.participants as p}
				{@const isWinner = winner === p.id}
				<div class="score-player" class:win={isWinner}>
				<div class="sp-head">
					<span class="row" style="gap: 10px; min-width: 0">
						<Avatar id={p.avatar} />
						<span class="sp-name">
							{p.name}{#if p.is_guest}<span class="pill pill-guest" style="margin-left: 6px">inv.</span>{/if}
						</span>
					</span>
					<div class="sp-right">
						<button class="crown" class:on={isWinner} type="button" onclick={() => toggleWinner(p.id)} aria-pressed={isWinner} title="Marcar como ganador de la ronda" aria-label="Ganador de la ronda">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
								<path d="M17 5h2a2 2 0 0 1 0 4h-2" />
								<path d="M7 5H5a2 2 0 0 0 0 4h2" />
								<path d="M12 14v3" />
								<path d="M8 21h8" />
								<path d="M9.5 21a2.5 2.5 0 0 1 5 0" />
							</svg>
						</button>
						<span class="sp-total">{roundPointsOf(p)}</span>
					</div>
				</div>

				{#if isWinner}
					<div class="sp-won" transition:slide={{ duration: 220, easing: cubicOut }}>Ganó la ronda · 0 puntos</div>
				{:else}
					<div class="sp-body" transition:slide={{ duration: 220, easing: cubicOut }}>
					<div class="sp-adds">
						{#each CARD_VALUES as c}
							<button class="add-btn" type="button" onclick={() => addPoints(p.id, c.points)}>+{c.points}</button>
						{/each}
						<button class="add-btn clear" type="button" onclick={() => clearPoints(p.id)} aria-label="Borrar puntos" title="Borrar">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
								<line x1="18" y1="9" x2="12" y2="15" />
								<line x1="12" y1="9" x2="18" y2="15" />
							</svg>
						</button>
					</div>
					<button class="penalty-toggle" class:on={penalty[p.id]} type="button" onclick={() => togglePenalty(p.id)} aria-pressed={penalty[p.id]}>
						Penalización +100
					</button>
					</div>
				{/if}
			</div>
		{/each}

		</div>
		{#if errorMsg}<p class="error">{errorMsg}</p>{/if}
	</div>
{/if}

<div class="actionbar">
	{#if snap.game.status !== 'in_progress'}
		<a class="btn btn-gold" href="/game/{snap.game.id}/result">Ver resultado</a>
	{:else if allDone}
		<button class="btn btn-gold" type="button" onclick={finish}>🏆 Finalizar y ver ganador</button>
	{:else}
		<button class="btn btn-gold" type="button" onclick={saveRound} disabled={!canSave || locked}>
			Guardar ronda {activeRound}
		</button>
	{/if}
</div>

{#if menu}
	<div class="modal-backdrop">
		<button class="backdrop-close" aria-label="Cerrar" onclick={() => (menu = null)} transition:fade={{ duration: 250 }}></button>
		<div class="sheet glass" role="dialog" aria-modal="true" aria-label="Opciones de la partida" transition:fly={{ y: 32, duration: 320, easing: cubicOut }}>
			{#if menu === 'menu'}
				<div class="modal-head">
					<h3 style="margin: 0">Opciones de la partida</h3>
					<button class="close-btn" type="button" aria-label="Cerrar" onclick={() => (menu = null)}>✕</button>
				</div>
				<button class="menu-item good" type="button" onclick={() => (menu = 'finish')}>
					<span class="mi-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<circle cx="12" cy="8" r="7" />
							<polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
						</svg>
					</span>
					<span class="mi-text"><strong>Terminar ahora</strong><small>Cierra la partida con las puntuaciones actuales</small></span>
				</button>
				<button class="menu-item danger" type="button" onclick={() => (menu = 'discard')}>
					<span class="mi-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
						</svg>
					</span>
					<span class="mi-text"><strong>Descartar partida</strong><small>La elimina sin dejar resultado</small></span>
				</button>
			{:else if menu === 'finish'}
				<div class="modal-head">
					<h3 style="margin: 0">Terminar ahora</h3>
					<button class="close-btn" type="button" aria-label="Cerrar" onclick={() => (menu = null)}>✕</button>
				</div>
				<p class="muted small">
					Se cerrará la partida con las puntuaciones actuales y se calculará el ganador, aunque no se
					hayan jugado las {TOTAL_ROUNDS} rondas.
				</p>
				<div style="height: 10px"></div>
				<button class="btn btn-gold" type="button" onclick={finish}>Terminar y ver ganador</button>
			{:else}
				<div class="modal-head">
					<h3 style="margin: 0">Descartar partida</h3>
					<button class="close-btn" type="button" aria-label="Cerrar" onclick={() => (menu = null)}>✕</button>
				</div>
				<p class="muted small">
					La partida se eliminará por completo y no dejará resultado. Esta acción no se puede
					deshacer.
				</p>
				<div style="height: 10px"></div>
				<button class="btn btn-danger" type="button" onclick={discard}>Descartar definitivamente</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.watchers {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: var(--stone);
		font-family: var(--font-display);
		font-size: 0.85rem;
	}
	.watchers svg {
		width: 16px;
		height: 16px;
	}
	.close-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Round selector */
	.round-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 12px;
	}
	.rsel {
		position: relative;
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--fjord-elev-2);
		color: var(--frost);
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s, opacity 0.12s;
	}
	/* Special rounds (with a rule) get a distinct violet marker. */
	.rsel.special::after {
		content: '';
		position: absolute;
		top: 4px;
		right: 4px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--special);
	}
	.rsel-done {
		border-color: var(--good);
	}
	.rsel-future {
		opacity: 0.45;
	}
	.rsel.sel {
		opacity: 1;
	}
	.rsel.sel.rsel-done {
		background: var(--good);
		border-color: var(--good);
		color: #04150e;
	}
	.rsel.sel.rsel-current {
		background: var(--gold);
		border-color: var(--gold);
		color: #0b1622;
	}
	.rsel.sel.rsel-future {
		background: rgba(228, 179, 74, 0.28);
		border-color: rgba(228, 179, 74, 0.5);
		color: var(--frost);
	}

	/* Round header card */
	.round-head {
		position: relative;
		text-align: center;
		padding: 16px;
		margin-bottom: 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background:
			radial-gradient(130% 90% at 50% -10%, rgba(228, 179, 74, 0.12), transparent 58%),
			linear-gradient(180deg, var(--fjord-elev-2), var(--fjord-elev));
	}
	.round-head::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--gold), transparent);
		opacity: 0.7;
	}
	/* Special rounds: violet lighting instead of gold. */
	.round-head.special {
		background:
			radial-gradient(130% 90% at 50% -10%, rgba(167, 139, 250, 0.16), transparent 58%),
			linear-gradient(180deg, var(--fjord-elev-2), var(--fjord-elev));
	}
	.round-head.special::before {
		background: linear-gradient(90deg, transparent, var(--special), transparent);
	}
	.round-head.special .rh-eyebrow {
		color: var(--special);
	}
	.rh-eyebrow {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.2em;
		font-size: 0.72rem;
		color: var(--gold-soft);
	}
	.rh-objective {
		font-family: var(--font-jersey);
		font-size: clamp(1.5rem, 6vw, 2rem);
		line-height: 1.05;
		margin-top: 4px;
	}
	.rh-note {
		display: inline-block;
		margin-top: 8px;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.8rem;
		color: var(--special);
		background: rgba(167, 139, 250, 0.14);
		border: 1px solid rgba(167, 139, 250, 0.3);
	}

	/* Scoreboard with sticky name + total columns */
	.score-wrap {
		overflow-x: auto;
	}
	.score {
		border-collapse: collapse;
		width: max-content;
		/* Center the table when it's narrower than its card; scroll when wider. */
		margin: 0 auto;
		font-size: 0.9rem;
	}
	.score th,
	.score td {
		padding: 8px 10px;
		text-align: center;
		white-space: nowrap;
	}
	.score thead th {
		color: var(--stone);
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.78rem;
		border-bottom: 1px solid var(--border);
	}
	.score tbody td {
		border-top: 1px solid var(--border);
	}
	.col-name {
		position: sticky;
		left: 0;
		z-index: 2;
		text-align: left;
		background: var(--fjord-elev);
	}
	.col-total {
		position: sticky;
		right: 0;
		z-index: 2;
		background: var(--fjord-elev);
		font-family: var(--font-jersey);
		color: var(--gold);
	}
	thead .col-name,
	thead .col-total {
		z-index: 3;
	}
	.col-round {
		min-width: 30px;
		color: var(--stone);
	}

	/* Scoring cards */
	.players.locked {
		opacity: 0.45;
		pointer-events: none;
	}
	.score-player {
		padding: 12px;
		margin-bottom: 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--fjord-elev-2);
		transition: border-color 0.15s;
	}
	.score-player.win {
		border-color: var(--good);
	}
	.sp-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.sp-name {
		font-size: 1.2rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sp-right {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}
	.crown {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 40px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--fjord-elev);
		color: var(--stone);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.08s;
	}
	.crown svg {
		width: 20px;
		height: 20px;
	}
	.crown:hover {
		border-color: var(--gold);
		background: var(--fjord-elev-2);
		color: var(--gold);
	}
	.crown:active {
		transform: scale(0.95);
	}
	.crown.on {
		background: rgba(70, 185, 138, 0.2);
		border-color: var(--good);
		color: var(--good);
	}
	.sp-total {
		font-family: var(--font-jersey);
		font-size: 1.6rem;
		color: var(--gold);
		min-width: 28px;
		text-align: right;
	}
	.sp-adds {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 12px;
	}
	.add-btn {
		flex: 1;
		min-width: 48px;
		padding: 11px 4px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--fjord-elev);
		color: var(--frost);
		font-family: var(--font-display);
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.12s, transform 0.08s;
	}
	.add-btn:hover {
		border-color: var(--gold);
	}
	.add-btn:active {
		transform: scale(0.96);
	}
	.add-btn.clear {
		flex: 0 0 auto;
		color: var(--stone);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.add-btn.clear svg {
		width: 18px;
		height: 18px;
		display: block;
	}
	.penalty-toggle {
		width: 100%;
		margin-top: 8px;
		padding: 10px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--stone);
		font-family: var(--font-display);
		font-size: 0.85rem;
		letter-spacing: 0.03em;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}
	.penalty-toggle.on {
		background: rgba(193, 53, 46, 0.18);
		border-color: var(--blood);
		color: var(--blood-bright);
	}
	.sp-won {
		margin-top: 10px;
		text-align: center;
		font-family: var(--font-display);
		font-size: 0.9rem;
		color: var(--good);
	}

	/* Modal (options menu) */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}
	.backdrop-close {
		position: absolute;
		inset: 0;
		border: none;
		cursor: default;
		background: rgba(6, 12, 18, 0.78);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}
	.glass {
		background: linear-gradient(180deg, rgba(30, 47, 61, 0.72), rgba(18, 29, 39, 0.74));
		backdrop-filter: blur(22px) saturate(150%);
		-webkit-backdrop-filter: blur(22px) saturate(150%);
		border: 1px solid rgba(233, 240, 247, 0.1);
		box-shadow:
			0 24px 60px rgba(0, 0, 0, 0.55),
			inset 0 1px 0 rgba(233, 240, 247, 0.06);
	}
	.sheet {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 420px;
		max-height: 88dvh;
		overflow-y: auto;
		padding: 18px;
		border-radius: var(--radius-lg);
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.menu-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 13px;
		margin-top: 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--fjord-elev-2);
		color: var(--frost);
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s;
	}
	.menu-item:hover {
		border-color: var(--gold);
	}
	.menu-item.danger:hover {
		border-color: var(--blood);
	}
	.mi-icon {
		display: inline-flex;
		font-size: 1.2rem;
		color: var(--stone);
	}
	.mi-icon svg {
		width: 20px;
		height: 20px;
	}
	.menu-item.danger .mi-icon {
		color: var(--blood-bright);
	}
	.menu-item.good .mi-icon {
		color: var(--gold);
	}
	.menu-item.good:hover {
		border-color: var(--gold);
	}
	.mi-text strong {
		display: block;
		font-family: var(--font-display);
		font-weight: 600;
	}
	.mi-text small {
		display: block;
		color: var(--stone);
		font-size: 0.8rem;
		margin-top: 2px;
	}
</style>
