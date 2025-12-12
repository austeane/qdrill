import crypto from 'crypto';

const CLAIM_SECRET = process.env.CLAIM_TOKEN_SECRET || process.env.AUTH_SECRET;

if (!CLAIM_SECRET) {
	console.warn(
		'[claimTokens] Missing CLAIM_TOKEN_SECRET/AUTH_SECRET; claim tokens will be insecure.'
	);
}

/**
 * Generate a signed claim token for an anonymously created entity.
 * Tokens are opaque to clients but verifiable server-side without DB storage.
 *
 * @param {'drill'|'formation'|'practice-plan'} type
 * @param {number} id
 * @param {number} [ttlMs] default 7 days
 */
export function generateClaimToken(type, id, ttlMs = 7 * 24 * 60 * 60 * 1000) {
	const nonce = crypto.randomBytes(16).toString('hex');
	const payload = {
		t: type,
		id,
		n: nonce,
		exp: Date.now() + ttlMs
	};
	const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const sig = crypto
		.createHmac('sha256', CLAIM_SECRET || 'insecure')
		.update(payloadStr)
		.digest('base64url');
	return `${payloadStr}.${sig}`;
}

/**
 * Verify a claim token for a given entity.
 *
 * @param {'drill'|'formation'|'practice-plan'} type
 * @param {number} id
 * @param {string} token
 * @returns {boolean}
 */
export function verifyClaimToken(type, id, token) {
	if (!token || typeof token !== 'string') return false;
	const [payloadStr, sig] = token.split('.');
	if (!payloadStr || !sig) return false;

	const expected = crypto
		.createHmac('sha256', CLAIM_SECRET || 'insecure')
		.update(payloadStr)
		.digest('base64url');

	try {
		if (
			Buffer.from(sig).length !== Buffer.from(expected).length ||
			!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
		) {
			return false;
		}
	} catch {
		return false;
	}

	try {
		const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
		if (payload.t !== type || payload.id !== id) return false;
		if (payload.exp && Date.now() > payload.exp) return false;
		return true;
	} catch {
		return false;
	}
}
