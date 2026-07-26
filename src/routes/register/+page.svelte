<script>
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	import BackLink from '$lib/BackLink.svelte';
	let { form } = $props();
</script>

<div class="topbar">
	<BackLink href="/login" label="Entrar" />
	<a class="close-btn" href="/" aria-label="Cerrar">✕</a>
</div>

<div class="center" style="margin: 6px 0 14px">
	<h1 style="font-size: 1.9rem">Crea tu perfil</h1>
	<p class="muted small">Tu identidad en todas tus Ætts</p>
</div>

<form method="POST" class="card">
	<label for="name">Tu nombre</label>
	<input
		id="name"
		name="name"
		type="text"
		autocapitalize="words"
		value={form?.name || ''}
		placeholder="Tu nombre"
		autofocus
		required
	/>

	<label>Tu avatar</label>
	<AvatarPicker />

	<label for="pin">Elige tu PIN (4 dígitos)</label>
	<input
		id="pin"
		name="pin"
		type="password"
		inputmode="numeric"
		maxlength="4"
		placeholder="····"
		required
	/>

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div style="height: 12px"></div>
	<button class="btn btn-gold" type="submit">Crear perfil</button>
</form>
