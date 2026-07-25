<script>
	import { onMount } from 'svelte';
	import Avatar from '$lib/Avatar.svelte';
	import { getSocket } from '$lib/socketClient.js';
	let { data } = $props();
	const medals = ['🥇', '🥈', '🥉'];

	let activeGameId = $state(data.activeGame?.id ?? null);

	onMount(() => {
		const socket = getSocket();
		socket.emit('space:join', { spaceId: data.space?.id });
		const onPresence = ({ activeGameId: id }) => (activeGameId = id);
		socket.on('presence:update', onPresence);
		return () => socket.off('presence:update', onPresence);
	});
</script>

<div class="topbar">
	<span class="brand">⚔ Asgard</span>
	<div class="row">
		<a class="pill" href="/members">👥 Ætt</a>
		<form method="POST" action="/logout">
			<button class="pill" type="submit" style="cursor: pointer">Salir</button>
		</form>
	</div>
</div>

<div class="row between" style="margin-bottom: 12px">
	<div>
		<h1 style="margin-bottom: 2px">{data.space?.name}</h1>
		<span class="muted small">El salón de la Ætt</span>
	</div>
	<Avatar id={data.member?.avatar} />
</div>

{#if activeGameId}
	<div class="banner-live">
		<span class="row" style="gap: 8px">
			<span class="dot-live"></span>
			<strong>Se está jugando ahora</strong>
		</span>
		<a class="btn btn-sm btn-gold" href="/game/{activeGameId}">Ver / anotar</a>
	</div>
{/if}

{#if data.ranking.length > 0}
	{@const leader = data.ranking[0]}
	<div class="card hero">
		<div class="hero-eyebrow">Al frente de la Ætt</div>
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

<div class="card small muted">
	Código de invitación: <strong style="color: var(--gold); letter-spacing: 0.15em">{data.inviteCode}</strong>
	· <a href="/members">gestionar Ætt e invitar</a>
	<div class="small" style="margin-top: 8px; opacity: 0.5">v {data.version}</div>
</div>

<div class="actionbar">
	{#if activeGameId}
		<a class="btn btn-primary" href="/game/{activeGameId}">▶ Continuar partida</a>
	{:else}
		<a class="btn btn-primary" href="/asgard/new-game">▶ Empezar partida</a>
	{/if}
</div>
