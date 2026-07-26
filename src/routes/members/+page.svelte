<script>
	import { onMount } from 'svelte';
	import AvatarPicker from '$lib/AvatarPicker.svelte';
	import Avatar from '$lib/Avatar.svelte';
	import BackLink from '$lib/BackLink.svelte';
	let { data, form } = $props();

	let promoting = $state(null); // guestId
	const joinUrl = $derived(`${data.origin}/join?code=${data.inviteCode}`);
	let qrDataUrl = $state('');

	onMount(async () => {
		const QRCode = (await import('qrcode')).default;
		qrDataUrl = await QRCode.toDataURL(joinUrl, {
			margin: 1,
			width: 320,
			color: { dark: '#0b1622', light: '#e9f0f7' }
		});
	});
</script>

<div class="topbar">
	<BackLink href="/asgard" label="Asgard" />
</div>

<h1>El Ætt</h1>

<div class="card center">
	<h3>Invitar al Ætt</h3>
	<p class="muted small">Que escaneen este QR, o pásales el código.</p>
	{#if qrDataUrl}
		<img
			src={qrDataUrl}
			alt="Código QR de invitación"
			width="200"
			height="200"
			style="border-radius: 12px; margin: 10px auto; display: block; background: var(--frost); padding: 8px"
		/>
	{/if}
	<div class="jersey" style="font-size: 2.2rem; letter-spacing: 0.28em; color: var(--gold)">
		{data.inviteCode}
	</div>
</div>

<div class="card">
	<h3>Miembros</h3>
	{#each data.members as m}
		<div class="row" style="padding: 8px 0">
			<Avatar id={m.avatar} />
			<span>{m.display_name}</span>
		</div>
	{/each}
</div>

<div class="card">
	<div class="row between">
		<h3 style="margin: 0">Invitados</h3>
		<form method="POST" action="?/toggleGuests">
			<button class="pill" type="submit">
				{data.includeGuests ? '✅ en ranking' : '🚫 fuera de ranking'}
			</button>
		</form>
	</div>

	{#each data.guests as g}
		<div style="padding: 8px 0; border-bottom: 1px solid var(--border)">
			<div class="row between">
				<span class="row" style="gap: 10px">
					<Avatar id={g.avatar} />
					<span>{g.display_name} <span class="pill pill-guest">invitado</span></span>
				</span>
				<button class="btn btn-sm" type="button" onclick={() => (promoting = promoting === g.id ? null : g.id)}>
					⬆ Hacer miembro
				</button>
			</div>
			{#if promoting === g.id}
				<form method="POST" action="?/promote" style="margin-top: 8px">
					<input type="hidden" name="guestId" value={g.id} />
					<label for="pin-{g.id}">PIN de 4 dígitos para {g.display_name}</label>
					<div class="row" style="gap: 8px">
						<input id="pin-{g.id}" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="****" required />
						<button class="btn btn-gold btn-sm" type="submit">Promocionar</button>
					</div>
					{#if form?.error && form?.promoteId === g.id}<p class="error">{form.error}</p>{/if}
				</form>
			{/if}
		</div>
	{/each}
	{#if data.guests.length === 0}<p class="muted small">Ninguno todavía.</p>{/if}

	<form method="POST" action="?/addGuest" style="margin-top: 12px">
		<label for="gname">Añadir invitado</label>
		<input id="gname" name="name" type="text" placeholder="Nombre del invitado" required />
		<label>Avatar</label>
		<AvatarPicker />
		{#if form?.error && !form?.promoteId}<p class="error">{form.error}</p>{/if}
		<div style="height: 10px"></div>
		<button class="btn" type="submit">➕ Añadir invitado</button>
	</form>
</div>
