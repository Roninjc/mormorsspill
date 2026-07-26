<script>
	import { AVATARS } from '$lib/avatars.js';
	import Avatar from '$lib/Avatar.svelte';
	let { name = 'avatar', value = $bindable(AVATARS[0]) } = $props();
</script>

<input type="hidden" {name} value={value} />
<div class="grid-avatars">
	{#each AVATARS as a}
		<button
			type="button"
			class="avatar-pick"
			style:box-shadow={value === a ? '0 0 0 2px var(--gold)' : 'none'}
			style:opacity={value === a ? '1' : '0.62'}
			onclick={() => (value = a)}
			aria-pressed={value === a}
		>
			<Avatar id={a} size={52} />
		</button>
	{/each}
</div>

<style>
	.avatar-pick {
		background: none;
		border: none;
		padding: 4px;
		width: 60px;
		height: 60px;
		box-sizing: border-box;
		justify-self: center;
		border-radius: 50%;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.12s ease;
	}
</style>
