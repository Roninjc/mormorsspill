import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// --- Session secret (persists across restarts) ---
function loadSecret() {
	if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
	const path = process.env.SESSION_SECRET_PATH || 'data/.session_secret';
	if (existsSync(path)) return readFileSync(path, 'utf8').trim();
	const secret = randomBytes(32).toString('hex');
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, secret, { mode: 0o600 });
	return secret;
}
const SECRET = loadSecret();

// --- PIN ---
export function hashPin(pin) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(String(pin), salt, 32).toString('hex');
	return `${salt}$${hash}`;
}

export function verifyPin(pin, stored) {
	if (!stored || !stored.includes('$')) return false;
	const [salt, hash] = stored.split('$');
	const candidate = scryptSync(String(pin), salt, 32);
	const expected = Buffer.from(hash, 'hex');
	return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// --- Signed session (memberId.HMAC) ---
export function signSession(memberId) {
	const payload = String(memberId);
	const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
	return `${payload}.${sig}`;
}

export function verifySession(value) {
	if (!value || !value.includes('.')) return null;
	const idx = value.lastIndexOf('.');
	const payload = value.slice(0, idx);
	const sig = value.slice(idx + 1);
	const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	const id = Number(payload);
	return Number.isInteger(id) ? id : null;
}

// --- Invite code ---
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/O/0/1
export function generateInviteCode() {
	const bytes = randomBytes(6);
	let out = '';
	for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
	return out;
}
