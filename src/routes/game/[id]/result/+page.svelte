<script>
	import Avatar from '$lib/Avatar.svelte';
	let { data } = $props();
	const medals = ['🥇', '🥈', '🥉'];
	const champ = data.standings[0];
</script>

<div class="topbar">
	<a class="brand" href="/asgard">← Asgard</a>
</div>

<div class="card hero center">
	<div class="hero-eyebrow">Vencedor de la saga</div>
	<div style="display: flex; justify-content: center; margin: 10px 0 6px">
		<Avatar id={champ?.avatar} size={92} />
	</div>
	<div class="hero-name">{champ?.name}</div>
	<div class="hero-score">{champ?.total}</div>
	<div class="muted small" style="letter-spacing: 0.08em; text-transform: uppercase">
		puntos · {champ?.roundsWon} rondas ganadas
	</div>
</div>

<div class="card">
	<h3>Clasificación final</h3>
	{#each data.standings as row}
		<div class="row between" style="padding: 10px 0; border-bottom: 1px solid var(--border)">
			<span class="row" style="gap: 10px">
				<span class="jersey" style="width: 26px; text-align: center; font-size: 1.2rem; color: var(--stone)">{medals[row.position - 1] || row.position}</span>
				<Avatar id={row.avatar} />
				<span>{row.name}</span>
			</span>
			<span class="row" style="gap: 8px">
				<strong class="total-cell">{row.total}</strong>
				<span class="muted small">{row.roundsWon}🏆</span>
			</span>
		</div>
	{/each}
</div>

<div class="actionbar">
	<a class="btn btn-primary" href="/asgard/new-game">▶ Otra partida</a>
</div>
