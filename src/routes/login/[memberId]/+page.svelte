<script>
	import Avatar from '$lib/Avatar.svelte';
	let { data, form } = $props();
</script>

<div class="topbar">
	<a class="brand" href="/">← Volver</a>
</div>

<div class="card center">
	<div style="display: flex; justify-content: center"><Avatar id={data.m.avatar} size={72} /></div>
	<h2 style="margin-top: 10px">{data.m.display_name}</h2>
	<p class="muted small">{data.spaceName}</p>

	<form method="POST">
		<label for="pin" class="center">Introduce tu PIN</label>
		<input
			id="pin"
			name="pin"
			type="password"
			inputmode="numeric"
			maxlength="4"
			autofocus
			style="text-align: center; letter-spacing: 0.5em; font-size: 1.4rem"
			placeholder="····"
			required
		/>
		{#if form?.error}<p class="error center">{form.error}</p>{/if}
		<div style="height: 12px"></div>
		<button class="btn btn-primary" type="submit">Entrar</button>
	</form>
</div>
