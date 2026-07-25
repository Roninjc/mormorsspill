<script>
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	let { data, form } = $props();
</script>

<div class="topbar">
	<a class="brand" href="/">← Mormorsspill</a>
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
		required
	/>

	<label for="name">Tu nombre</label>
	<input id="name" name="name" type="text" placeholder="Tu nombre" required />

	<label>Tu avatar</label>
	<AvatarPicker />

	<label for="pin">Elige tu PIN (4 dígitos)</label>
	<input id="pin" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="****" required />

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div style="height: 12px"></div>
	<button class="btn btn-gold" type="submit">Entrar en la Ætt</button>
</form>
