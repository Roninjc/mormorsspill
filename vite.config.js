import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

/** Adjunta Socket.IO al servidor HTTP de Vite en desarrollo. */
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
	}
});
