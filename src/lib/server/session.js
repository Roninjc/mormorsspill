import { signSession } from './auth.js';

const COOKIE = 'session'; // the logged-in user
const SPACE = 'active_space'; // the Ætt the user is currently viewing
const OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: false, // behind nginx TLS; the browser reaches the proxy over http. Tune via env if serving TLS directly.
	maxAge: 60 * 60 * 24 * 365
};

export function setSession(cookies, userId) {
	cookies.set(COOKIE, signSession(userId), OPTS);
}

/** Sets which Ætt the user is currently acting in (chosen from Midgard). */
export function setActiveSpace(cookies, spaceId) {
	cookies.set(SPACE, String(spaceId), OPTS);
}

export function clearActiveSpace(cookies) {
	cookies.delete(SPACE, { path: '/' });
}

export function clearSession(cookies) {
	cookies.delete(COOKIE, { path: '/' });
	cookies.delete(SPACE, { path: '/' });
}
