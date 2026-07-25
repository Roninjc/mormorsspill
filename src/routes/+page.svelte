<script>
	import Avatar from '$lib/Avatar.svelte';
	let { data } = $props();
</script>

<div class="topbar">
	<span class="brand">⚔ Mormorsspill</span>
</div>

<div class="center" style="margin: 8px 0 20px">
	<h1 style="font-size: 2rem">Bienvenido a Asgard</h1>
	<p class="muted">Elige tu perfil para entrar</p>
</div>

{#if data.spaces.length === 0}
	<div class="card center">
		<p class="muted">Aún no hay ninguna Ætt. Crea la primera.</p>
	</div>
{:else}
	{#each data.spaces as space}
		<div class="card">
			<h3>{space.name}</h3>
			{#if space.members.length === 0}
				<p class="muted small">Sin miembros todavía.</p>
			{:else}
				{#each space.members as m}
					<a class="list-item" href="/login/{m.id}">
						<Avatar id={m.avatar} />
						<span>{m.display_name}</span>
					</a>
				{/each}
			{/if}
		</div>
	{/each}
{/if}

<div class="card">
	<a class="btn btn-gold" href="/new-aett">Crear una Ætt</a>
	<div style="height: 10px"></div>
	<a class="btn btn-ghost" href="/join">Unirse con un código</a>
</div>
