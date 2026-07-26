<script>
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	import Avatar from '$lib/Avatar.svelte';
	import BackLink from '$lib/BackLink.svelte';
	let { data, form } = $props();

	let confirmingDelete = $state(false);
	let showQr = $state(false);
	let showAddGuest = $state(false);
	let showHidden = $state(false);
	let shareMsg = $state('');

	// The guest action open in a modal: { guest, kind: 'promote'|'unify'|'hide'|'delete' }
	let guestAction = $state(null);
	const openAction = (guest, kind) => (guestAction = { guest, kind });
	const closeAction = () => (guestAction = null);

	const joinUrl = $derived(`${data.origin}/join?code=${data.inviteCode}`);
	let qrDataUrl = $state('');

	onMount(async () => {
		const QRCode = (await import('qrcode')).default;
		qrDataUrl = await QRCode.toDataURL(joinUrl, {
			margin: 1,
			width: 512,
			color: { dark: '#0b1622', light: '#ffffff' } // high contrast for scanning
		});
	});

	async function share() {
		shareMsg = '';
		const shareData = {
			title: `Únete a "${data.space?.name}" en Mormorsspill`,
			text: `Únete a mi Ætt "${data.space?.name}" (código ${data.inviteCode})`,
			url: joinUrl
		};
		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else if (navigator.clipboard) {
				await navigator.clipboard.writeText(joinUrl);
				shareMsg = 'Enlace copiado al portapapeles ✓';
			} else {
				shareMsg = joinUrl;
			}
		} catch {
			// share cancelled by the user — ignore
		}
	}

	function onKey(e) {
		if (e.key === 'Escape') {
			showQr = false;
			showAddGuest = false;
			guestAction = null;
		}
	}

	$effect(() => {
		const open = showQr || showAddGuest || guestAction;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => (document.body.style.overflow = '');
	});
</script>

<svelte:window onkeydown={onKey} />

<div class="topbar">
	<BackLink href="/asgard" label="Asgard" />
</div>

<div class="page-eyebrow">· Ajustes del Ætt ·</div>
<h1 class="settings-title">{data.space?.name}</h1>

<div class="card center">
	<div class="invite-head">
		<h3 style="margin: 0">Invitar al Ætt</h3>
		<button class="icon-share" type="button" onclick={share} aria-label="Compartir invitación" title="Compartir">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M12 15V3" />
				<path d="M8 7l4-4 4 4" />
				<path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
			</svg>
		</button>
	</div>
	{#if qrDataUrl}
		<button class="qr-btn" type="button" onclick={() => (showQr = true)} aria-label="Ampliar el QR">
			<img src={qrDataUrl} alt="Código QR de invitación" width="180" height="180" />
		</button>
	{/if}
	<div class="jersey code">{data.inviteCode}</div>
	{#if shareMsg}<p class="muted small" style="margin: 10px 0 0">{shareMsg}</p>{/if}
</div>

{#if showQr}
	<div class="modal-backdrop">
		<button
			class="backdrop-close"
			aria-label="Cerrar"
			onclick={() => (showQr = false)}
			transition:fade={{ duration: 250 }}
		></button>
		<div
			class="qr-modal glass"
			role="dialog"
			aria-modal="true"
			aria-label="Código QR de invitación"
			transition:fly={{ y: 32, duration: 320, easing: cubicOut }}
		>
			<button class="close-btn qr-close" aria-label="Cerrar" onclick={() => (showQr = false)}>✕</button>
			<div class="qr-white"><img src={qrDataUrl} alt="Código QR de invitación" /></div>
			<div class="jersey qr-modal-code">{data.inviteCode}</div>
		</div>
	</div>
{/if}

{#if showAddGuest}
	<div class="modal-backdrop">
		<button
			class="backdrop-close"
			aria-label="Cerrar"
			onclick={() => (showAddGuest = false)}
			transition:fade={{ duration: 250 }}
		></button>
		<div
			class="add-modal glass"
			role="dialog"
			aria-modal="true"
			aria-label="Añadir invitado"
			transition:fly={{ y: 32, duration: 320, easing: cubicOut }}
		>
			<div class="modal-head">
				<h3 style="margin: 0">Añadir invitado</h3>
				<button class="close-btn" type="button" aria-label="Cerrar" onclick={() => (showAddGuest = false)}>✕</button>
			</div>
			<form
				method="POST"
				action="?/addGuest"
				use:enhance={() => async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') showAddGuest = false;
				}}
			>
				<label for="gname">Nombre</label>
				<input id="gname" name="name" type="text" placeholder="Nombre del invitado" autocomplete="off" required />
				<label>Avatar</label>
				<AvatarPicker />
				{#if form?.error && form?.addGuest}<p class="error">{form.error}</p>{/if}
				<div style="height: 14px"></div>
				<button class="btn btn-gold" type="submit">Añadir invitado</button>
			</form>
		</div>
	</div>
{/if}

{#if guestAction}
	{@const g = guestAction.guest}
	<div class="modal-backdrop">
		<button
			class="backdrop-close"
			aria-label="Cerrar"
			onclick={closeAction}
			transition:fade={{ duration: 250 }}
		></button>
		<div
			class="add-modal glass"
			role="dialog"
			aria-modal="true"
			aria-label="Acción sobre invitado"
			transition:fly={{ y: 32, duration: 320, easing: cubicOut }}
		>
			<div class="modal-head">
				<h3 style="margin: 0">
					{#if guestAction.kind === 'promote'}Hacer miembro{:else if guestAction.kind === 'unify'}Unificar invitado{:else if guestAction.kind === 'hide'}Ocultar invitado{:else}Eliminar invitado{/if}
				</h3>
				<button class="close-btn" type="button" aria-label="Cerrar" onclick={closeAction}>✕</button>
			</div>

			{#if guestAction.kind === 'promote'}
				<p class="muted small">
					Crea una cuenta para <strong>{g.display_name}</strong>: conservará su historial y podrá
					entrar con su nombre y un PIN.
				</p>
				<form
					method="POST"
					action="?/promote"
					use:enhance={() => async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') closeAction();
					}}
				>
					<input type="hidden" name="guestId" value={g.id} />
					<label for="mpin">PIN de 4 dígitos</label>
					<input id="mpin" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="····" autocomplete="off" required />
					{#if form?.error && form?.promoteId === g.id}<p class="error">{form.error}</p>{/if}
					<div style="height: 14px"></div>
					<button class="btn btn-gold" type="submit">Hacer miembro</button>
				</form>
			{:else if guestAction.kind === 'unify'}
				<p class="muted small">
					Si <strong>{g.display_name}</strong> ya está como miembro, une su historial con él. Se
					borrará el invitado. No se puede deshacer.
				</p>
				<form
					method="POST"
					action="?/unify"
					use:enhance={() => async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') closeAction();
					}}
				>
					<input type="hidden" name="guestId" value={g.id} />
					<label for="munify">Miembro</label>
					<select id="munify" name="memberId" required>
						<option value="">Elegir miembro…</option>
						{#each data.members as m}<option value={m.id}>{m.display_name}</option>{/each}
					</select>
					{#if form?.error && form?.unifyId === g.id}<p class="error">{form.error}</p>{/if}
					<div style="height: 14px"></div>
					<button class="btn btn-gold" type="submit">Unificar</button>
				</form>
			{:else if guestAction.kind === 'hide'}
				<p class="muted small">
					<strong>{g.display_name}</strong> ya ha jugado partidas, así que no se puede borrar sin perder
					ese historial. Ocultarlo lo saca de la lista y del ranking, pero conserva sus datos. Podrás
					volver a mostrarlo cuando quieras.
				</p>
				<form
					method="POST"
					action="?/hideGuest"
					use:enhance={() => async ({ result, update }) => {
						await update();
						if (result.type === 'success') closeAction();
					}}
				>
					<input type="hidden" name="guestId" value={g.id} />
					<div style="height: 4px"></div>
					<button class="btn btn-gold" type="submit">Ocultar invitado</button>
				</form>
			{:else}
				<p class="muted small">
					¿Seguro que quieres eliminar a <strong>{g.display_name}</strong>? Esta acción no se puede
					deshacer.
				</p>
				<form
					method="POST"
					action="?/removeGuest"
					use:enhance={() => async ({ result, update }) => {
						await update();
						if (result.type === 'success') closeAction();
					}}
				>
					<input type="hidden" name="guestId" value={g.id} />
					{#if form?.error && form?.removeId === g.id}<p class="error">{form.error}</p>{/if}
					<div style="height: 4px"></div>
					<button class="btn btn-danger" type="submit">Eliminar definitivamente</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<div class="card">
	<h3>Miembros <span class="count">{data.members.length}</span></h3>
	{#each data.members as m}
		<div class="list-row row">
			<Avatar id={m.avatar} />
			<span>{m.display_name}</span>
		</div>
	{/each}
</div>

<div class="card">
	<div class="row between">
		<h3 style="margin: 0">Invitados <span class="count">{data.guests.length}</span></h3>
		<button class="ghost-add" type="button" onclick={() => (showAddGuest = true)}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Añadir
		</button>
	</div>

	{#if data.guests.length === 0}
		<p class="muted small" style="margin-top: 10px">Ninguno todavía.</p>
	{:else}
		{#each data.guests as g}
			<div class="list-row">
				<div class="row between">
					<span class="row" style="gap: 10px">
						<Avatar id={g.avatar} />
						<span>{g.display_name}</span>
					</span>
					<div class="guest-actions">
						<button class="gaction" type="button" title="Hacer miembro" aria-label="Hacer miembro" onclick={() => openAction(g, 'promote')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<line x1="19" y1="8" x2="19" y2="14" />
								<line x1="22" y1="11" x2="16" y2="11" />
							</svg>
						</button>
						{#if data.members.length > 0}
							<button class="gaction" type="button" title="Unificar con un miembro" aria-label="Unificar" onclick={() => openAction(g, 'unify')}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
									<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
								</svg>
							</button>
						{/if}
						{#if g.games > 0}
							<button class="gaction" type="button" title="Ocultar invitado" aria-label="Ocultar invitado" onclick={() => openAction(g, 'hide')}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							</button>
						{:else}
							<button class="gaction gaction-danger" type="button" title="Eliminar invitado" aria-label="Eliminar invitado" onclick={() => openAction(g, 'delete')}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
									<line x1="10" y1="11" x2="10" y2="17" />
									<line x1="14" y1="11" x2="14" y2="17" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	{/if}

	<div class="guest-rank">
		<span class="small muted">Contar invitados en el ranking</span>
		<form method="POST" action="?/toggleGuests" use:enhance>
			<button
				class="switch"
				class:on={data.includeGuests}
				type="submit"
				role="switch"
				aria-checked={data.includeGuests}
				aria-label="Contar invitados en el ranking"
			>
				<span class="knob"></span>
			</button>
		</form>
	</div>
</div>

{#if data.hiddenGuests.length > 0}
	<div class="card">
		<div class="collapse-head">
			<button class="collapse-toggle" type="button" onclick={() => (showHidden = !showHidden)} aria-expanded={showHidden}>
				<span class="chev" class:open={showHidden} aria-hidden="true">›</span>
				<h3 style="margin: 0">Invitados ocultos <span class="count">{data.hiddenGuests.length}</span></h3>
			</button>
			<span class="infotip">
				<button class="info-btn" type="button" aria-label="Qué son los invitados ocultos">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
				</button>
				<span class="infotip-bubble" role="tooltip">
					No aparecen en la lista de juego ni en el ranking, pero conservan su historial.
				</span>
			</span>
		</div>
		{#if showHidden}
			{#each data.hiddenGuests as g}
				<div class="list-row">
					<div class="row between">
						<span class="row" style="gap: 10px">
							<Avatar id={g.avatar} />
							<span class="muted">{g.display_name}</span>
						</span>
						<form method="POST" action="?/unhideGuest" use:enhance>
							<input type="hidden" name="guestId" value={g.id} />
							<button class="gaction" type="submit" title="Mostrar invitado" aria-label="Mostrar invitado">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							</button>
						</form>
					</div>
				</div>
			{/each}
		{/if}
	</div>
{/if}

<div class="card danger-zone">
	<h3 class="dz-title">⚠ Zona peligrosa</h3>
	<p class="muted small">
		Eliminar el Ætt borra <strong>para siempre</strong> todas sus partidas, puntuaciones e invitados,
		y desvincula a sus miembros. Esta acción no se puede deshacer.
	</p>

	{#if !confirmingDelete}
		<div style="height: 6px"></div>
		<button class="btn dz-reveal" type="button" onclick={() => (confirmingDelete = true)}>
			Eliminar este Ætt
		</button>
	{:else}
		<form method="POST" action="?/deleteSpace" use:enhance>
			<label for="confirm">Escribe <strong>{data.space?.name}</strong> para confirmar</label>
			<input
				id="confirm"
				name="confirm"
				type="text"
				autocomplete="off"
				autocapitalize="off"
				placeholder={data.space?.name}
				required
			/>
			{#if form?.deleteError}<p class="error">{form.deleteError}</p>{/if}
			<div class="dz-actions">
				<button class="btn btn-ghost btn-sm" type="button" onclick={() => (confirmingDelete = false)}>
					Cancelar
				</button>
				<button class="btn btn-danger" type="submit">Eliminar definitivamente</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page-eyebrow {
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.34em;
		font-size: 0.8rem;
		color: var(--gold-soft);
		text-align: center;
		margin: 2px 0 10px;
	}
	.settings-title {
		font-family: var(--font-jersey);
		text-align: center;
		font-size: clamp(1.9rem, 8vw, 2.4rem);
		line-height: 1;
		margin: 0;
	}
	.settings-title {
		margin-bottom: 18px;
	}

	.qr-btn {
		display: block;
		margin: 12px auto 4px;
		padding: 8px;
		line-height: 0;
		background: #fff;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.qr-btn:active {
		transform: scale(0.98);
	}
	.qr-btn img {
		display: block;
		border-radius: 4px;
	}
	.code {
		font-size: 2.2rem;
		letter-spacing: 0.28em;
		color: var(--gold);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}
	.backdrop-close {
		position: absolute;
		inset: 0;
		border: none;
		cursor: default;
		background: rgba(6, 12, 18, 0.78);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}
	/* Frosted glass, matching the profile modal */
	.glass {
		background: linear-gradient(180deg, rgba(30, 47, 61, 0.72), rgba(18, 29, 39, 0.74));
		backdrop-filter: blur(22px) saturate(150%);
		-webkit-backdrop-filter: blur(22px) saturate(150%);
		border: 1px solid rgba(233, 240, 247, 0.1);
		box-shadow:
			0 24px 60px rgba(0, 0, 0, 0.55),
			inset 0 1px 0 rgba(233, 240, 247, 0.06);
	}
	.qr-modal {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		max-width: 92vw;
		padding: 54px 20px 22px;
		border-radius: var(--radius-lg);
	}
	.qr-close {
		position: absolute;
		top: 14px;
		right: 14px;
	}
	.add-modal {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 460px;
		max-height: 88dvh;
		overflow-y: auto;
		padding: 18px;
		border-radius: var(--radius-lg);
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.qr-white {
		background: #fff;
		padding: 16px;
		border-radius: 14px;
		line-height: 0;
	}
	.qr-white img {
		display: block;
		width: min(78vw, 340px);
		height: auto;
	}
	.qr-modal-code {
		font-size: 1.9rem;
		letter-spacing: 0.28em;
		color: var(--gold);
	}

	.invite-head {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.icon-share {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--stone);
		cursor: pointer;
		transition: color 0.15s;
	}
	.icon-share:hover {
		color: var(--gold);
	}
	.icon-share svg {
		width: 17px;
		height: 17px;
	}

	.ghost-add {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 13px;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--frost);
		font-family: var(--font-display);
		font-size: 0.82rem;
		letter-spacing: 0.03em;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.ghost-add:hover {
		border-color: var(--gold);
		color: var(--gold-soft);
	}
	.ghost-add svg {
		width: 15px;
		height: 15px;
		color: var(--gold);
	}

	.list-row {
		padding: 10px 0;
	}
	/* Divider only between rows — never after the last one. */
	.list-row + .list-row {
		border-top: 1px solid var(--border);
	}
	.guest-actions {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.gaction {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--stone);
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}
	.gaction:hover {
		color: var(--gold);
		background: var(--fjord-elev-2);
	}
	.gaction-danger:hover {
		color: var(--blood-bright);
	}
	.gaction svg {
		width: 17px;
		height: 17px;
	}
	.collapse-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.collapse-toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--frost);
		cursor: pointer;
		text-align: left;
	}
	.count {
		font-family: var(--font-body);
		font-size: 0.85rem;
		color: var(--stone);
		font-weight: 400;
	}
	.chev {
		font-size: 1.5rem;
		line-height: 1;
		color: var(--stone);
		transition: transform 0.18s ease;
	}
	.chev.open {
		transform: rotate(90deg);
		color: var(--gold);
	}

	.infotip {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
	}
	.info-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--stone);
		cursor: pointer;
		transition: color 0.15s;
	}
	.info-btn:hover {
		color: var(--gold);
	}
	.info-btn svg {
		width: 17px;
		height: 17px;
	}
	.infotip-bubble {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		z-index: 5;
		width: max-content;
		max-width: 230px;
		padding: 9px 11px;
		background: var(--fjord-elev-2);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: var(--shadow);
		color: var(--stone);
		font-size: 0.8rem;
		line-height: 1.4;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-4px);
		transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
		pointer-events: none;
	}
	.infotip:hover .infotip-bubble,
	.infotip:focus-within .infotip-bubble {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}

	.guest-rank {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}
	.switch {
		position: relative;
		width: 44px;
		height: 26px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: var(--fjord-elev-2);
		box-shadow: inset 0 0 0 1px var(--border);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.18s;
	}
	.switch.on {
		background: var(--good);
		box-shadow: none;
	}
	.knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.18s;
	}
	.switch.on .knob {
		transform: translateX(18px);
	}

	select {
		flex: 1;
		min-width: 0;
		padding: 10px 12px;
		background: var(--fjord-elev-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--frost);
		font-family: var(--font-body);
		font-size: 1rem;
	}

	.danger-zone {
		border-color: rgba(224, 71, 63, 0.38);
		background: linear-gradient(180deg, rgba(193, 53, 46, 0.08), transparent 70%);
	}
	.dz-title {
		color: var(--blood-bright);
		margin: 0 0 6px;
	}
	.dz-reveal {
		background: transparent;
		border: 1px solid rgba(224, 71, 63, 0.55);
		color: var(--blood-bright);
	}
	.dz-reveal:hover {
		border-color: var(--blood-bright);
		background: rgba(224, 71, 63, 0.1);
	}
	.dz-actions {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}
	.dz-actions .btn {
		flex: 1;
	}
</style>

