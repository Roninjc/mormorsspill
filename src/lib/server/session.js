import { signSession } from './auth.js';

const COOKIE = 'session';
const OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: false, // detrás de nginx TLS; el navegador lo ve http al proxy. Ajustable por env si se sirve TLS directo.
	maxAge: 60 * 60 * 24 * 365
};

export function setSession(cookies, memberId) {
	cookies.set(COOKIE, signSession(memberId), OPTS);
}

export function clearSession(cookies) {
	cookies.delete(COOKIE, { path: '/' });
}
