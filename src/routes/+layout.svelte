<script>
	import '../app.css';
	import { page } from '$app/state';
	let { children } = $props();
</script>

<div class="app" class:is-landing={page.url.pathname === '/'}>
	{@render children()}
</div>
