// Production server: wraps the SvelteKit handler (adapter-node)
// and attaches Socket.IO on the same process/port.
// Usage: npm run build && node server.js
import http from 'node:http';
import { handler } from './build/handler.js';
import { injectSocketIO } from './src/lib/server/socket.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer((req, res) => {
	handler(req, res, () => {
		res.statusCode = 404;
		res.end('Not found');
	});
});

injectSocketIO(server);

server.listen(PORT, HOST, () => {
	console.log(`Mormorsspill escuchando en http://${HOST}:${PORT}`);
});
