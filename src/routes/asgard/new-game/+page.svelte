<script>
	import Avatar from '$lib/Avatar.svelte';
	let { data, form } = $props();

	let selected = $state(new Set());
	function toggle(key) {
		if (selected.has(key)) selected.delete(key);
		else selected.add(key);
		selected = new Set(selected);
	}
</script>

<div class="topbar">
	<a class="brand" href="/asgard">← Asgard</a>
</div>

<h1>Nueva partida</h1>
<p class="muted">Elige quién juega (mínimo 2). El orden de selección será el orden en la mesa.</p>

<form method="POST">
	<div class="card">
		<h3>Miembros</h3>
		{#if data.members.length === 0}
			<p class="muted small">No hay miembros.</p>
		{/if}
		{#each data.members as m}
			{@const key = `m:${m.id}`}
			<button
				type="button"
				class="list-item"
				style:border-color={selected.has(key) ? 'var(--gold)' : 'var(--border)'}
				onclick={() => toggle(key)}
			>
				<Avatar id={m.avatar} />
				<span style="flex: 1">{m.display_name}</span>
				<span>{selected.has(key) ? '✅' : '➕'}</span>
			</button>
			{#if selected.has(key)}<input type="hidden" name="p" value={key} />{/if}
		{/each}
	</div>

	<div class="card">
		<h3>Invitados</h3>
		{#if data.guests.length === 0}
			<p class="muted small">Ninguno. <a href="/members">Añadir invitado</a></p>
		{/if}
		{#each data.guests as g}
			{@const key = `g:${g.id}`}
			<button
				type="button"
				class="list-item"
				style:border-color={selected.has(key) ? 'var(--gold)' : 'var(--border)'}
				onclick={() => toggle(key)}
			>
				<Avatar id={g.avatar} />
				<span style="flex: 1">{g.display_name} <span class="pill pill-guest">invitado</span></span>
				<span>{selected.has(key) ? '✅' : '➕'}</span>
			</button>
			{#if selected.has(key)}<input type="hidden" name="p" value={key} />{/if}
		{/each}
	</div>

	<div class="card">
		<label class="row" style="gap: 10px; margin: 0">
			<input type="checkbox" name="singleScorer" style="width: auto" />
			<span>Anotador único (solo una persona edita las puntuaciones)</span>
		</label>
		<p class="muted small" style="margin-top: 8px">
			Por defecto, cualquiera puede anotar los puntos de cualquiera (útil si no todos tienen el móvil a mano).
		</p>
	</div>

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div class="actionbar">
		<button class="btn btn-primary" type="submit" disabled={selected.size < 2}>
			▶ Empezar ({selected.size})
		</button>
	</div>
</form>
