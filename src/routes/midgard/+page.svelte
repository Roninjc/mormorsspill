<script>
	import { enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Avatar from '$lib/Avatar.svelte';
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	import { avatarOr } from '$lib/avatars.js';
	let { data, form } = $props();

	let editing = $state(false);
	// Preselect the current avatar (falling back for legacy emoji avatars).
	let avatar = $state(avatarOr(data.profile.avatar));
	let pin = $state('');

	function onKey(e) {
		if (e.key === 'Escape') editing = false;
	}

	// Lock background scroll while the modal is open.
	$effect(() => {
		document.body.style.overflow = editing ? 'hidden' : '';
		return () => (document.body.style.overflow = '');
	});
</script>

<svelte:window onkeydown={onKey} />

<div class="topbar" style="justify-content: flex-end">
	<form method="POST" action="/logout">
		<button class="pill" type="submit" style="cursor: pointer">Salir</button>
	</form>
</div>

<div class="hub-eyebrow">· Midgard ·</div>

<button class="hero-profile" onclick={() => (editing = true)} aria-label="Editar tu perfil">
	<span class="hp-edit" aria-hidden="true">✎</span>
	<div class="hp-avatar"><Avatar id={data.profile.avatar} size={78} /></div>
	<div class="hp-name">{data.profile.display_name}</div>
	<div class="hp-stats">
		<div class="hp-stat">
			<span class="hp-num">{data.stats.aetter}</span>
			<span class="hp-label">Ætter</span>
		</div>
		<span class="hp-sep"></span>
		<div class="hp-stat">
			<span class="hp-num">{data.stats.games}</span>
			<span class="hp-label">Partidas</span>
		</div>
		<span class="hp-sep"></span>
		<div class="hp-stat">
			<span class="hp-num">{data.stats.wins}</span>
			<span class="hp-label">Victorias</span>
		</div>
	</div>
</button>

<h3 class="section-title">Tus Ætter</h3>

{#if data.spaces.length === 0}
	<div class="card center">
		<p class="muted">Todavía no perteneces a ningún Ætt.</p>
	</div>
{:else}
	{#each data.spaces as s}
		<form method="POST" action="?/enter" class="aett-card">
			<input type="hidden" name="spaceId" value={s.id} />
			<button class="aett-hit" type="submit">
				<div class="aett-crest">⚔</div>
				<div class="aett-body">
					<div class="aett-name">{s.name}</div>
					<div class="muted small">{s.members} {s.members === 1 ? 'miembro' : 'miembros'}</div>
				</div>
				{#if s.activeGame}
					<span class="aett-live"><span class="dot-live"></span> en juego</span>
				{:else}
					<span class="aett-arrow">›</span>
				{/if}
			</button>
		</form>
	{/each}
{/if}

<div class="center small muted version">Mormorsspill · {__APP_VERSION__}</div>

{#if editing}
	<div class="modal-backdrop">
		<button
			class="backdrop-close"
			aria-label="Cerrar"
			onclick={() => (editing = false)}
			transition:fade={{ duration: 250 }}
		></button>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-label="Editar tu perfil"
			transition:fly={{ y: 32, duration: 320, easing: cubicOut }}
		>
			<div class="modal-handle" aria-hidden="true"></div>
			<div class="modal-head">
				<h3 style="margin: 0">Tu perfil</h3>
				<button class="close-btn" onclick={() => (editing = false)} aria-label="Cerrar">✕</button>
			</div>

			<form
				method="POST"
				action="?/saveProfile"
				use:enhance={() => async ({ update, result }) => {
					await update({ reset: false });
					if (result.type === 'success') pin = '';
				}}
			>
				<label for="name">Tu nombre</label>
				<input id="name" name="name" type="text" value={data.profile.display_name} required />

				<label>Tu avatar</label>
				<AvatarPicker bind:value={avatar} />

				<label for="pin">Nuevo PIN <span class="muted">(opcional)</span></label>
				<input
					id="pin"
					name="pin"
					type="password"
					inputmode="numeric"
					maxlength="4"
					placeholder="····"
					bind:value={pin}
				/>

				{#if form?.error}<p class="error">{form.error}</p>{/if}
				{#if form?.saved}<p class="ok small">Perfil guardado ✓</p>{/if}

				<div style="height: 14px"></div>
				<button class="btn btn-gold" type="submit">Guardar</button>
			</form>
		</div>
	</div>
{/if}

<div class="actionbar">
	<div class="hub-actions">
		<a class="btn btn-gold" href="/new-aett">Fundar un Ætt</a>
		<a class="btn btn-ghost" href="/join">Unirse a un Ætt</a>
	</div>
</div>

<style>
	.hub-eyebrow {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.34em;
		font-size: 0.8rem;
		color: var(--gold-soft);
		text-align: center;
		margin: 2px 0 14px;
	}

	/* Player card: your viking identity, jersey-style. Tap to edit. */
	.hero-profile {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 28px 18px 22px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(130% 90% at 50% -10%, rgba(228, 179, 74, 0.16), transparent 58%),
			linear-gradient(180deg, var(--fjord-elev-2), var(--fjord-elev));
		color: var(--frost);
		cursor: pointer;
		overflow: hidden;
		margin-bottom: 24px;
		transition: border-color 0.15s;
	}
	.hero-profile:hover {
		border-color: var(--gold);
	}
	.hero-profile::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--gold), transparent);
		opacity: 0.7;
	}
	.hp-edit {
		position: absolute;
		top: 12px;
		right: 15px;
		font-size: 0.95rem;
		color: var(--stone);
		opacity: 0.5;
		transition: opacity 0.15s, color 0.15s;
	}
	.hero-profile:hover .hp-edit {
		opacity: 1;
		color: var(--gold);
	}
	.hp-avatar {
		border-radius: 50%;
		box-shadow: 0 0 30px rgba(228, 179, 74, 0.32);
	}
	.hp-name {
		font-family: var(--font-jersey);
		font-size: clamp(1.7rem, 8vw, 2.35rem);
		line-height: 1;
		text-align: center;
		letter-spacing: 0.01em;
		margin-top: 6px;
	}
	.hp-stats {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 12px;
	}
	.hp-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 54px;
	}
	.hp-num {
		font-family: var(--font-jersey);
		font-size: 1.5rem;
		line-height: 1;
		color: var(--gold-soft);
	}
	.hp-label {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.66rem;
		color: var(--stone);
		margin-top: 5px;
	}
	.hp-sep {
		width: 1px;
		height: 30px;
		background: var(--border);
	}

	.ok {
		color: var(--good);
	}

	.section-title {
		margin: 0 0 10px;
	}

	.aett-card {
		margin-bottom: 10px;
	}
	.aett-hit {
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
	.aett-hit:hover {
		border-color: var(--gold);
	}
	.aett-hit:active {
		transform: scale(0.99);
	}
	.aett-crest {
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
	.aett-body {
		flex: 1;
		min-width: 0;
	}
	.aett-name {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.15rem;
	}
	.aett-arrow {
		font-size: 1.6rem;
		color: var(--stone);
	}
	.aett-live {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-display);
		font-size: 0.8rem;
		color: var(--blood-bright);
		white-space: nowrap;
	}

	.version {
		margin-top: 18px;
		opacity: 0.45;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 16px;
	}
	.backdrop-close {
		position: absolute;
		inset: 0;
		border: none;
		cursor: default;
		background: rgba(6, 12, 18, 0.62);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}
	.modal {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 460px;
		max-height: 88dvh;
		overflow-y: auto;
		padding: 16px 18px 20px;
		border-radius: var(--radius-lg);
		/* Frosted glass panel */
		background: linear-gradient(180deg, rgba(30, 47, 61, 0.72), rgba(18, 29, 39, 0.74));
		backdrop-filter: blur(22px) saturate(150%);
		-webkit-backdrop-filter: blur(22px) saturate(150%);
		border: 1px solid rgba(233, 240, 247, 0.1);
		box-shadow:
			0 24px 60px rgba(0, 0, 0, 0.55),
			inset 0 1px 0 rgba(233, 240, 247, 0.06);
	}
	.modal-handle {
		width: 42px;
		height: 4px;
		border-radius: 3px;
		background: rgba(233, 240, 247, 0.2);
		margin: 0 auto 12px;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	@media (min-width: 540px) {
		.modal-backdrop {
			align-items: center;
		}
		.modal-handle {
			display: none;
		}
	}

	.hub-actions {
		display: flex;
		gap: 10px;
	}
	.hub-actions .btn {
		flex: 1;
	}
</style>
