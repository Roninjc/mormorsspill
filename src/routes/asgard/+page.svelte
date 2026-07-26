<script>
	import { onMount } from 'svelte';
	import Avatar from '$lib/Avatar.svelte';
	import BackLink from '$lib/BackLink.svelte';
	import { getSocket } from '$lib/socketClient.js';
	let { data } = $props();
	const medals = ['🥇', '🥈', '🥉'];

	let activeGameId = $state(data.activeGame?.id ?? null);

	onMount(() => {
		const socket = getSocket();
		const joinSpace = () => socket.emit('space:join', { spaceId: data.space?.id });
		joinSpace();
		socket.on('connect', joinSpace); // re-join after any reconnect
		const onPresence = ({ activeGameId: id }) => (activeGameId = id);
		socket.on('presence:update', onPresence);
		return () => {
			socket.off('connect', joinSpace);
			socket.off('presence:update', onPresence);
		};
	});
</script>

<div class="topbar">
	<BackLink href="/midgard" label="Midgard" />
	<a class="close-btn" href="/members" aria-label="Ajustes del Ætt" title="Ajustes del Ætt">
		<svg
			width="17"
			height="17"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="3"></circle>
			<path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z"
			></path>
		</svg>
	</a>
</div>

<div class="page-eyebrow">· Asgard ·</div>

<div class="aett-header">
	<h1 class="aett-title">{data.space?.name}</h1>
	<div class="aett-meta">
		{data.stats.members}
		{data.stats.members === 1 ? 'miembro' : 'miembros'} · {data.stats.games}
		{data.stats.games === 1 ? 'partida' : 'partidas'}
	</div>
</div>

{#if activeGameId}
	<a class="live-game" href="/game/{activeGameId}">
		<div class="lg-top">
			<span class="lg-live"><span class="dot-live"></span> En juego</span>
			{#if data.activeGame && data.activeGame.id === activeGameId}
				<span class="lg-round">Ronda {data.activeGame.round} / {data.activeGame.totalRounds}</span>
			{:else}
				<span class="lg-go">Continuar →</span>
			{/if}
		</div>
		{#if data.activeGame && data.activeGame.id === activeGameId}
			<div class="lg-players">
				{#each data.activeGame.players as p}
					<div class="lg-player">
						<Avatar id={p.avatar} size={46} />
						<span class="lg-player-name">{p.name}</span>
					</div>
				{/each}
			</div>
			<div class="lg-cta">
				{#if data.activeGame.leaderName}
					<span class="lg-leader">Al frente: <strong>{data.activeGame.leaderName}</strong></span>
				{:else}
					<span class="lg-leader">{data.activeGame.players.length} jugadores</span>
				{/if}
				<span class="lg-go">Continuar →</span>
			</div>
		{/if}
	</a>
{/if}

{#if data.ranking.length > 0}
	{@const leader = data.ranking[0]}
	<div class="card hero">
		<div class="hero-eyebrow">Al frente del Ætt</div>
		<div class="row between" style="margin-top: 8px">
			<div class="row" style="gap: 14px">
				<Avatar id={leader.avatar} size={60} />
				<div>
					<div class="hero-name" style="font-size: 1.9rem">{leader.name}</div>
					<div class="muted small">{leader.games} part. · media {leader.avgPoints}</div>
				</div>
			</div>
			<div class="center">
				<div class="hero-score" style="font-size: 2.4rem">{leader.wins}</div>
				<div class="hero-eyebrow">victorias</div>
			</div>
		</div>
	</div>
{/if}

<div class="card">
	<h3>Ranking</h3>
	{#if data.ranking.length === 0}
		<p class="muted small">Aún no hay partidas terminadas. ¡Jugad la primera!</p>
	{:else}
		{#each data.ranking as r, i}
			<div class="row between" style="padding: 8px 0; border-bottom: 1px solid var(--border)">
				<span class="row" style="gap: 10px">
					<span class="jersey" style="width: 26px; text-align: center; font-size: 1.2rem; color: var(--stone)">{medals[i] || i + 1}</span>
					<Avatar id={r.avatar} />
					<span>{r.name}{#if r.isGuest}<span class="pill pill-guest" style="margin-left: 6px">invitado</span>{/if}</span>
				</span>
				<span class="muted small">{r.wins} 🏆 · {r.games} part. · media {r.avgPoints}</span>
			</div>
		{/each}
	{/if}
</div>

<div class="card">
	<h3>📜 Últimas partidas</h3>
	{#if data.recentGames.length === 0}
		<p class="muted small">Todavía ninguna.</p>
	{:else}
		{#each data.recentGames as g}
			<div class="row between" style="padding: 6px 0">
				<span class="small">{g.participants.map((p) => p.name).join(', ')}</span>
				<span class="pill pill-note">🏆 {g.winnerName}</span>
			</div>
		{/each}
	{/if}
</div>

<div class="center small muted version">Mormorsspill · {__APP_VERSION__}</div>

<div class="actionbar">
	{#if activeGameId}
		<a class="btn btn-primary" href="/game/{activeGameId}">▶ Continuar partida</a>
	{:else}
		<a class="btn btn-primary" href="/asgard/new-game">▶ Empezar partida</a>
	{/if}
</div>

<style>
	.page-eyebrow {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.34em;
		font-size: 0.8rem;
		color: var(--gold-soft);
		text-align: center;
		margin: 2px 0 14px;
	}

	.aett-header {
		position: relative;
		text-align: center;
		padding: 22px 16px;
		margin-bottom: 16px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background:
			radial-gradient(130% 90% at 50% -10%, rgba(228, 179, 74, 0.14), transparent 58%),
			linear-gradient(180deg, var(--fjord-elev-2), var(--fjord-elev));
	}
	.aett-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--gold), transparent);
		opacity: 0.7;
	}
	.aett-title {
		font-family: var(--font-jersey);
		font-size: clamp(2rem, 9vw, 2.6rem);
		line-height: 1;
		margin: 0 0 6px;
	}
	.aett-meta {
		color: var(--stone);
		font-size: 0.9rem;
	}

	/* In-progress game: a live, tappable card */
	.live-game {
		display: block;
		position: relative;
		overflow: hidden;
		padding: 15px 16px;
		margin-bottom: 16px;
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--frost);
		border: 1px solid rgba(224, 71, 63, 0.4);
		background:
			radial-gradient(120% 140% at 100% 0%, rgba(224, 71, 63, 0.2), transparent 55%),
			linear-gradient(180deg, var(--fjord-elev-2), var(--fjord-elev));
		transition: transform 0.1s, border-color 0.15s;
	}
	.live-game:hover {
		border-color: var(--blood-bright);
	}
	.live-game:active {
		transform: scale(0.99);
	}
	.lg-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.lg-live {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-display);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.75rem;
		color: var(--blood-bright);
	}
	.lg-round {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.78rem;
		color: var(--stone);
	}
	.lg-players {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		margin: 16px 0;
	}
	.lg-player {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		width: 60px;
	}
	.lg-player-name {
		font-size: 0.72rem;
		color: var(--stone);
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.lg-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.lg-leader {
		font-size: 0.82rem;
		color: var(--stone);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.lg-leader strong {
		color: var(--frost);
	}
	.lg-go {
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--gold);
		white-space: nowrap;
	}

	.version {
		margin-top: 16px;
		opacity: 0.45;
	}
</style>
