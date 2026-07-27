import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Build-time version string shown in the app so you can tell which build is live.
// In CI the commit sha arrives via the APP_VERSION build-arg (the Docker build has
// no .git); locally it falls back to `git rev-parse`, then to "dev".
function resolveVersion() {
	let sha = process.env.APP_VERSION;
	if (!sha) {
		try {
			sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
				.toString()
				.trim();
		} catch {
			sha = 'dev';
		}
	}
	const short = sha.slice(0, 7);
	const date = new Date().toISOString().slice(0, 10);
	return `${short} · ${date}`;
}

/** Attaches Socket.IO to Vite's HTTP server in development. */
const socketIODev = {
	name: 'socket-io-dev',
	async configureServer(server) {
		if (!server.httpServer) return;
		const { injectSocketIO } = await server.ssrLoadModule('/src/lib/server/socket.js');
		injectSocketIO(server.httpServer);
	}
};

export default defineConfig({
	plugins: [
		socketIODev,
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			workbox: {
				navigateFallback: null
			},
			manifest: {
				name: 'Mormorsspill',
				short_name: 'Mormorsspill',
				description: 'Marcador y compañero para Mormorsspill',
				theme_color: '#0B1622',
				background_color: '#0B1622',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/icon-512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		})
	],
	ssr: {
		external: ['better-sqlite3']
	},
	define: {
		__APP_VERSION__: JSON.stringify(resolveVersion())
	}
});
