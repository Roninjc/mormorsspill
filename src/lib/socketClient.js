import { io } from 'socket.io-client';

let socket;

/** Socket compartido (solo navegador). Se conecta al mismo origen. */
export function getSocket() {
	if (!socket) socket = io({ transports: ['websocket', 'polling'] });
	return socket;
}
