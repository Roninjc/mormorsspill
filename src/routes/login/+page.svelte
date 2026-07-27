<script>
	let { data, form } = $props();
	const next = $derived(form?.next ?? data?.next ?? '');
</script>

<div class="topbar">
	<a class="close-btn" href="/" aria-label="Cerrar">✕</a>
</div>

<div class="center" style="margin: 6px 0 18px">
	<h1 style="font-size: 1.9rem">Iniciar sesión</h1>
</div>

<form method="POST" class="card">
	{#if next}<input type="hidden" name="next" value={next} />{/if}
	<label for="name">Tu nombre</label>
	<input
		id="name"
		name="name"
		type="text"
		autocapitalize="words"
		autocomplete="username"
		value={form?.name || ''}
		autofocus
		required
	/>

	<label for="pin">Tu PIN</label>
	<input
		id="pin"
		name="pin"
		type="password"
		inputmode="numeric"
		maxlength="4"
		autocomplete="current-password"
		style="letter-spacing: 0.4em; font-size: 1.2rem"
		placeholder="····"
		required
	/>

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div style="height: 12px"></div>
	<button class="btn btn-primary" type="submit">Entrar</button>
</form>

<div class="center" style="margin-top: 16px">
	<a class="found" href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>
		¿Primera vez? Crea tu perfil
	</a>
</div>

<style>
	.found {
		color: var(--stone);
		text-decoration: none;
		font-size: 0.95rem;
	}
	.found:hover {
		color: var(--gold);
	}
</style>
