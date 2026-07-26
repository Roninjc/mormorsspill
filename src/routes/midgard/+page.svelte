<script>
	import Avatar from '$lib/Avatar.svelte';
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	let { data, form } = $props();

	let editing = $state(false);
	let avatar = $state(data.profile.avatar);
</script>

<div class="topbar">
	<span class="brand">🌳 Midgard</span>
	<form method="POST" action="/logout">
		<button class="pill" type="submit" style="cursor: pointer">Salir</button>
	</form>
</div>

<div class="row between" style="margin-bottom: 16px">
	<div>
		<span class="muted small">Bienvenido de vuelta</span>
		<h1 style="margin: 2px 0 0">{data.profile.display_name}</h1>
	</div>
	<button
		class="avatar-btn"
		onclick={() => (editing = !editing)}
		aria-label="Editar perfil"
		title="Editar perfil"
	>
		<Avatar id={data.profile.avatar} size={56} />
	</button>
</div>

{#if editing}
	<div class="card">
		<h3>Tu perfil</h3>
		<form method="POST" action="?/saveProfile">
			<label for="name">Tu nombre</label>
			<input id="name" name="name" type="text" value={data.profile.display_name} required />
			<label>Tu avatar</label>
			<AvatarPicker bind:value={avatar} />
			{#if form?.error}<p class="error">{form.error}</p>{/if}
			{#if form?.saved}<p class="ok small">Perfil guardado ✓</p>{/if}
			<div style="height: 10px"></div>
			<button class="btn btn-gold" type="submit">Guardar perfil</button>
		</form>

		<div class="divider"></div>

		<form method="POST" action="?/changePin">
			<label for="pin">Cambiar PIN (4 dígitos)</label>
			<input
				id="pin"
				name="pin"
				type="password"
				inputmode="numeric"
				maxlength="4"
				placeholder="····"
			/>
			{#if form?.pinError}<p class="error small">{form.pinError}</p>{/if}
			{#if form?.pinSaved}<p class="ok small">PIN actualizado ✓</p>{/if}
			<div style="height: 8px"></div>
			<button class="btn btn-ghost" type="submit">Actualizar PIN</button>
		</form>
	</div>
{/if}

<h3 style="margin-bottom: 8px">Tus clanes</h3>

{#if data.spaces.length === 0}
	<div class="card center">
		<p class="muted">Todavía no perteneces a ninguna Ætt.</p>
	</div>
{:else}
	{#each data.spaces as s}
		<form method="POST" action="?/enter" class="clan-card">
			<input type="hidden" name="spaceId" value={s.id} />
			<button class="clan-hit" type="submit">
				<div class="clan-crest">⚔</div>
				<div class="clan-body">
					<div class="clan-name">{s.name}</div>
					<div class="muted small">{s.members} {s.members === 1 ? 'miembro' : 'miembros'}</div>
				</div>
				{#if s.activeGame}
					<span class="clan-live"><span class="dot-live"></span> en juego</span>
				{:else}
					<span class="clan-arrow">›</span>
				{/if}
			</button>
		</form>
	{/each}
{/if}

<div class="card">
	<a class="btn btn-gold" href="/new-aett">Fundar una Ætt</a>
	<div style="height: 10px"></div>
	<a class="btn btn-ghost" href="/join">Unirse con un código</a>
</div>

<div class="center small muted" style="margin-top: 14px; opacity: 0.5">Mormorsspill · {__APP_VERSION__}</div>

<style>
	.avatar-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
	}
	.avatar-btn:hover {
		box-shadow: 0 0 0 2px var(--gold);
	}
	.divider {
		height: 1px;
		background: var(--border);
		margin: 18px 0;
	}
	.ok {
		color: var(--good);
	}
	.clan-card {
		margin-bottom: 10px;
	}
	.clan-hit {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: var(--fjord-elev);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
		text-align: left;
		color: var(--frost);
		transition: border-color 0.15s, transform 0.1s;
	}
	.clan-hit:hover {
		border-color: var(--gold);
	}
	.clan-hit:active {
		transform: scale(0.99);
	}
	.clan-crest {
		font-size: 1.5rem;
		color: var(--gold);
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		background: var(--fjord-elev-2);
		border-radius: 10px;
		flex-shrink: 0;
	}
	.clan-body {
		flex: 1;
		min-width: 0;
	}
	.clan-name {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.15rem;
	}
	.clan-arrow {
		font-size: 1.6rem;
		color: var(--stone);
	}
	.clan-live {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-display);
		font-size: 0.8rem;
		color: var(--blood-bright);
		white-space: nowrap;
	}
</style>
