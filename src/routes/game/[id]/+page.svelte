<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Avatar from '$lib/Avatar.svelte';
	import { getSocket } from '$lib/socketClient.js';
	import { CARD_VALUES, isValidScore, FAILED_LAYDOWN_PENALTY, ROUND_OBJECTIVES } from '$lib/rules.js';

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
	let focused = $state(null);
	let errorMsg = $state('');
	let watchers = $state(1);
	let editingBy = $state(null); // { name, roundNumber }
	let socket;
	let editTimer;

	const NOTE = Object.fromEntries(ROUND_OBJECTIVES.map((r) => [r.number, r.note]));

	const roundsByNumber = $derived(Object.fromEntries(snap.rounds.map((r) => [r.number, r])));
	const activeRoundObj = $derived(roundsByNumber[activeRound]);
	const allDone = $derived(snap.rounds.every((r) => r.status === 'done'));

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
		focused = null;
	});

	onMount(() => {
		socket = getSocket();
		socket.emit('game:join', { gameId: snap.game.id });
		socket.on('game:state', (s) => {
			if (s?.game?.id === snap.game.id) snap = s;
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
			socket.off('game:state');
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
		focused = pid;
		cardPoints = { ...cardPoints, [pid]: (cardPoints[pid] || 0) + n };
	}
	function clearPoints(pid) {
		cardPoints = { ...cardPoints, [pid]: 0 };
	}
	function setWinner(pid) {
		winner = pid;
		cardPoints = { ...cardPoints, [pid]: 0 };
		penalty = { ...penalty, [pid]: false };
	}
	function roundPointsOf(p) {
		return (
			(winner === p.id ? 0 : cardPoints[p.id] || 0) + (penalty[p.id] ? FAILED_LAYDOWN_PENALTY : 0)
		);
	}

	const canSave = $derived(
		winner != null &&
			snap.participants.every((p) => p.id === winner || isValidScore(cardPoints[p.id] || 0))
	);

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
					if (activeRound < 8) activeRound = activeRound + 1;
				} else errorMsg = res?.error || 'No se pudo guardar';
			}
		);
	}

	function finish() {
		socket.emit('game:finish', { gameId: snap.game.id }, (res) => {
			if (res?.ok) goto(`/game/${snap.game.id}/result`);
		});
	}
</script>

<div class="topbar">
	<a class="brand" href="/asgard">← Asgard</a>
	<div class="row" style="gap: 8px">
		<span class="pill">👁 {watchers}</span>
		{#if snap.game.status === 'in_progress'}
			<span class="pill"><span class="dot-live"></span> en juego</span>
		{:else}
			<span class="pill pill-note">terminada</span>
		{/if}
	</div>
</div>

{#if editingBy}
	<p class="notice">✍️ {editingBy.name} está anotando la ronda {editingBy.roundNumber}</p>
{/if}

<!-- Round selector -->
<div class="row wrap" style="gap: 6px; margin-bottom: 12px">
	{#each snap.rounds as r}
		<button
			class="btn btn-sm"
			style:background={r.number === activeRound ? 'var(--blood)' : 'var(--fjord-elev-2)'}
			style:color={r.number === activeRound ? '#fff' : 'var(--text)'}
			style:border-color={r.status === 'done' ? 'var(--good)' : 'var(--border)'}
			onclick={() => (activeRound = r.number)}
		>
			{r.number}{r.status === 'done' ? ' ✓' : ''}
		</button>
	{/each}
</div>

{#if activeRoundObj}
	<div class="card">
		<div class="row between">
			<h2 style="margin: 0">Ronda {activeRoundObj.number}</h2>
			{#if activeRoundObj.status === 'done'}<span class="pill" style="border-color: var(--good); color: var(--good)">cerrada</span>{/if}
		</div>
		<p style="margin: 4px 0 0; font-family: var(--font-display); text-transform: uppercase; color: var(--gold)">
			{activeRoundObj.objective}
		</p>
		{#if NOTE[activeRoundObj.number]}<p class="pill pill-note" style="margin-top: 8px">⚑ {NOTE[activeRoundObj.number]}</p>{/if}
	</div>

	<div class="card">
		<p class="muted small">Marca al 🏆 ganador (se queda a 0) y suma las cartas del resto. Toca un jugador y usa los botones, o escribe el número.</p>

		{#each snap.participants as p}
			{@const isWinner = winner === p.id}
			{@const invalid = !isWinner && !isValidScore(cardPoints[p.id] || 0)}
			<div
				class="list-item"
				style="display: block; cursor: default"
				style:border-color={focused === p.id ? 'var(--gold)' : isWinner ? 'var(--good)' : 'var(--border)'}
			>
				<div class="row between">
					<span class="row" style="gap: 10px" onclick={() => (focused = p.id)} role="button" tabindex="0" onkeydown={() => {}}>
						<Avatar id={p.avatar} />
						<span>{p.name}{#if p.is_guest}<span class="pill pill-guest" style="margin-left: 6px">inv.</span>{/if}</span>
					</span>
					<button
						class="btn btn-sm"
						type="button"
						style:background={isWinner ? 'var(--good)' : 'var(--fjord-elev-2)'}
						style:color={isWinner ? '#04150e' : 'var(--text)'}
						onclick={() => setWinner(p.id)}
					>
						🏆 Ganó
					</button>
				</div>

				{#if !isWinner}
					<div class="row wrap" style="gap: 6px; margin-top: 10px">
						{#each CARD_VALUES as c}
							<button class="btn btn-sm" type="button" onclick={() => addPoints(p.id, c.points)}>+{c.points}</button>
						{/each}
						<input
							type="number"
							inputmode="numeric"
							step="5"
							min="0"
							style="width: 90px; padding: 6px 8px"
							value={cardPoints[p.id] || 0}
							oninput={(e) => (cardPoints = { ...cardPoints, [p.id]: Number(e.currentTarget.value) })}
						/>
						<button class="btn btn-sm btn-ghost" type="button" onclick={() => clearPoints(p.id)}>0</button>
						<label class="row small" style="gap: 6px; margin: 0">
							<input type="checkbox" style="width: auto" checked={penalty[p.id]} onchange={(e) => (penalty = { ...penalty, [p.id]: e.currentTarget.checked })} />
							+100
						</label>
					</div>
					{#if invalid}<p class="error" style="margin: 6px 0 0">Debe ser múltiplo de 5</p>{/if}
				{/if}

				<div class="row between" style="margin-top: 8px">
					<span class="muted small">Puntos ronda</span>
					<strong class="total-cell">{roundPointsOf(p)}</strong>
				</div>
			</div>
		{/each}

		{#if errorMsg}<p class="error">{errorMsg}</p>{/if}
	</div>
{/if}

<!-- Cumulative scoreboard -->
<div class="card">
	<h3>Marcador</h3>
	<div style="overflow-x: auto">
		<table class="score">
			<thead>
				<tr>
					<th>Jugador</th>
					{#each snap.rounds as r}<th>{r.number}</th>{/each}
					<th>Σ</th>
				</tr>
			</thead>
			<tbody>
				{#each snap.standings as row}
					<tr>
						<td>{row.name}</td>
						{#each snap.rounds as r}
							<td class="muted">{row.perRound[r.id] ?? '·'}</td>
						{/each}
						<td class="total-cell">{row.total}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="muted small" style="margin-top: 8px">Menor total gana · desempate por rondas ganadas.</p>
</div>

<div class="actionbar">
	{#if snap.game.status !== 'in_progress'}
		<a class="btn btn-gold" href="/game/{snap.game.id}/result">Ver resultado</a>
	{:else if allDone}
		<button class="btn btn-gold" type="button" onclick={finish}>🏆 Finalizar y ver ganador</button>
	{:else}
		<button class="btn btn-primary" type="button" onclick={saveRound} disabled={!canSave}>
			Guardar ronda {activeRound}
		</button>
	{/if}
</div>
