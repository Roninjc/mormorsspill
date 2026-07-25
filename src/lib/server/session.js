import { signSession } from './auth.js';

const COOKIE = 'session';
const OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: false, // behind nginx TLS; the browser reaches the proxy over http. Tune via env if serving TLS directly.
	maxAge: 60 * 60 * 24 * 365
};

export function setSession(cookies, memberId) {
	cookies.set(COOKIE, signSession(memberId), OPTS);
}

export function clearSession(cookies) {
	cookies.delete(COOKIE, { path: '/' });
}
