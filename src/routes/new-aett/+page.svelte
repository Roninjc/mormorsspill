<script>
	import Avatar from '$lib/Avatar.svelte';
	import BackLink from '$lib/BackLink.svelte';
	let { data, form } = $props();
</script>

<div class="topbar">
	<BackLink href="/midgard" label="Midgard" />
</div>

<h1>Fundar un Ætt</h1>
<p class="muted">Tu Ætt. Serás su primer miembro.</p>

<form method="POST" class="card">
	<label for="name">Nombre del Ætt</label>
	<input id="name" name="name" type="text" placeholder="p. ej. Los Bjørn" autofocus required />

	<div class="as-you">
		<Avatar id={data.profile.avatar} size={40} />
		<span class="small">Lo fundas como <strong>{data.profile.display_name}</strong></span>
	</div>

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div style="height: 12px"></div>
	<button class="btn btn-gold" type="submit">Fundar el Ætt</button>
</form>

<style>
	.as-you {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		background: var(--fjord-elev);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		margin: 8px 0 4px;
	}
</style>
