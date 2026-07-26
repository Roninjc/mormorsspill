<script>
	import Avatar from '$lib/Avatar.svelte';
	let { data, form } = $props();
</script>

<div class="topbar">
	<a class="brand" href="/midgard">← Midgard</a>
</div>

<h1>Unirse a una Ætt</h1>
<p class="muted">Pide el código de invitación a un miembro (o escanea su QR).</p>

<form method="POST" class="card">
	<label for="code">Código de invitación</label>
	<input
		id="code"
		name="code"
		type="text"
		autocapitalize="characters"
		style="text-transform: uppercase; letter-spacing: 0.15em; font-family: var(--font-display)"
		placeholder="XXXXXX"
		value={form?.code || data?.prefillCode || ''}
		autofocus
		required
	/>

	<div class="as-you">
		<Avatar id={data.profile.avatar} size={40} />
		<span class="small">Te unes como <strong>{data.profile.display_name}</strong></span>
	</div>

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div style="height: 12px"></div>
	<button class="btn btn-gold" type="submit">Entrar en la Ætt</button>
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
