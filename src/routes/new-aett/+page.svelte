<script>
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	let { form } = $props();
</script>

<div class="topbar">
	<a class="brand" href="/">← Mormorsspill</a>
</div>

<h1>Crear una Ætt</h1>
<p class="muted">Tu clan. Tú serás el primer miembro.</p>

<form method="POST" class="card">
	<label for="name">Nombre de la Ætt</label>
	<input id="name" name="name" type="text" placeholder="p. ej. Los Bjørn" required />

	<label for="memberName">Tu nombre</label>
	<input id="memberName" name="memberName" type="text" placeholder="Tu nombre" required />

	<label>Tu avatar</label>
	<AvatarPicker />

	<label for="pin">Tu PIN (4 dígitos)</label>
	<input id="pin" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="****" required />

	{#if form?.error}<p class="error">{form.error}</p>{/if}

	<div style="height: 12px"></div>
	<button class="btn btn-gold" type="submit">Fundar la Ætt</button>
</form>
