<script>
	let { href, label } = $props();
</script>

<a class="backlink" {href}>
	<svg
		class="backlink-ic"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<line x1="19" y1="12" x2="5" y2="12"></line>
		<polyline points="12 19 5 12 12 5"></polyline>
	</svg>
	<span>{label}</span>
</a>

<style>
	.backlink {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.8rem;
		font-weight: 600;
		line-height: 1;
		color: var(--gold);
		text-decoration: none;
	}
	.backlink-ic {
		width: 1.15em;
		height: 1.15em;
		display: block;
		flex-shrink: 0;
	}
	.backlink:hover {
		color: var(--gold-soft);
	}
</style>
