<script>
	import { avatarOr } from '$lib/avatars.js';

	let { id = 'helm', size = 44, ring = true } = $props();

	// Each motif has its own crest color.
	const COLORS = {
		helm: '#e4b34a',
		axe: '#e0473f',
		hammer: '#9db4c8',
		ship: '#46b98a',
		fehu: '#e4b34a',
		uruz: '#e0473f',
		thurisaz: '#8a6bd1',
		ansuz: '#46b98a',
		algiz: '#9db4c8',
		raidho: '#e08a3c'
	};

	// Glyphs: strokes with stroke=currentColor (color set by the <svg>).
	const GLYPHS = {
		helm: `<path d="M24 58 A26 26 0 0 1 76 58" /><line x1="22" y1="58" x2="78" y2="58" /><line x1="50" y1="58" x2="50" y2="74" /><path d="M30 54 Q16 50 16 30" /><path d="M70 54 Q84 50 84 30" />`,
		axe: `<line x1="34" y1="82" x2="60" y2="24" /><path d="M52 22 Q78 16 74 46 Q60 42 50 46 Z" />`,
		hammer: `<rect x="30" y="20" width="40" height="20" rx="3" /><line x1="50" y1="40" x2="50" y2="80" /><line x1="40" y1="80" x2="60" y2="80" />`,
		ship: `<path d="M14 56 Q50 88 86 56" /><line x1="18" y1="57" x2="82" y2="57" /><line x1="50" y1="57" x2="50" y2="22" /><path d="M50 24 L76 30 L76 48 L50 44 Z" />`,
		fehu: `<line x1="38" y1="16" x2="38" y2="84" /><line x1="38" y1="34" x2="64" y2="22" /><line x1="38" y1="52" x2="64" y2="40" />`,
		uruz: `<line x1="34" y1="18" x2="34" y2="84" /><line x1="34" y1="18" x2="62" y2="32" /><line x1="62" y1="32" x2="62" y2="84" />`,
		thurisaz: `<line x1="40" y1="16" x2="40" y2="84" /><line x1="40" y1="38" x2="64" y2="50" /><line x1="64" y1="50" x2="40" y2="62" />`,
		ansuz: `<line x1="40" y1="16" x2="40" y2="84" /><line x1="40" y1="30" x2="64" y2="40" /><line x1="40" y1="46" x2="64" y2="56" />`,
		algiz: `<line x1="50" y1="20" x2="50" y2="84" /><line x1="50" y1="44" x2="28" y2="22" /><line x1="50" y1="44" x2="72" y2="22" />`,
		raidho: `<line x1="38" y1="16" x2="38" y2="84" /><path d="M38 16 L62 28 L38 48" /><line x1="38" y1="46" x2="64" y2="84" />`
	};

	const key = $derived(avatarOr(id));
	const color = $derived(COLORS[key]);
	const glyph = $derived(GLYPHS[key]);
</script>

<span class="avatar" style="width:{size}px;height:{size}px;color:{color}">
	<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
		<circle cx="50" cy="50" r="49" fill="#101d29" />
		{#if ring}
			<circle cx="50" cy="50" r="47" fill="none" stroke={color} stroke-opacity="0.45" stroke-width="2" />
		{/if}
		<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
			{@html glyph}
		</g>
	</svg>
</span>
