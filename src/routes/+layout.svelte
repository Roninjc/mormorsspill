<script>
	import '../app.css';
	import { onMount } from 'svelte';
	let { children } = $props();

	onMount(() => {
		// iOS standalone PWAs finalise the viewport (safe areas + fixed positioning)
		// only after the first scroll, so fixed bottom bars start slightly raised.
		// A one-off, imperceptible 1px scroll nudges WebKit to settle right away.
		const standalone =
			window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
		if (standalone) {
			requestAnimationFrame(() => {
				window.scrollTo(0, 1);
				requestAnimationFrame(() => window.scrollTo(0, 0));
			});
		}

		// Touch devices have no hover, so replay the ice-gleam on tap. Delegated
		// once here so every primary button gets it; pointerdown fires before any
		// navigation, so the sweep starts as the finger lands.
		if (window.matchMedia?.('(hover: hover)').matches) return;
		const spark = (e) => {
			const btn = e.target?.closest?.('.btn-primary');
			if (!btn) return;
			btn.classList.remove('is-gleaming');
			void btn.offsetWidth; // restart the animation even on rapid taps
			btn.classList.add('is-gleaming');
		};
		const clear = (e) => {
			if (e.animationName === 'ice-gleam') e.target?.classList?.remove('is-gleaming');
		};
		document.addEventListener('pointerdown', spark);
		document.addEventListener('animationend', clear);
		return () => {
			document.removeEventListener('pointerdown', spark);
			document.removeEventListener('animationend', clear);
		};
	});
</script>

<div class="app">
	{@render children()}
</div>
