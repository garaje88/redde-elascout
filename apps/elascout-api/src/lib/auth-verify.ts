/**
 * Firebase ID token verifier for Cloudflare Workers.
 * Uses Web Crypto API (no firebase-admin dependency).
 *
 * Firebase ID tokens are JWTs signed with Google's public keys.
 * Keys are fetched from Google's JWKS endpoint and cached per Worker instance.
 */

interface JwkKey {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg: string;
  use: string;
}

interface JwksCache {
  keys: JwkKey[];
  fetchedAt: number;
}

// Cache keys for up to 6 hours (they rotate ~weekly)
let jwksCache: JwksCache | null = null;
const JWKS_TTL_SECONDS = 6 * 60 * 60;

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

async function getPublicKeys(): Promise<JwkKey[]> {
  const now = Math.floor(Date.now() / 1000);
  if (jwksCache && jwksCache.fetchedAt + JWKS_TTL_SECONDS > now) {
    return jwksCache.keys;
  }

  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) throw new Error("Failed to fetch Firebase JWKS");

  const data = (await res.json()) as { keys: JwkKey[] };
  jwksCache = { keys: data.keys, fetchedAt: now };
  return data.keys;
}

function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded2 = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=");
  const binary = atob(padded2);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64urlDecode(part)));
}

interface VerifiedToken {
  uid: string;
  email: string;
}

/**
 * Verifies a Firebase ID token and returns { uid, email }.
 * Throws on invalid or expired tokens.
 */
export async function verifyFirebaseToken(
  token: string,
  projectId: string
): Promise<VerifiedToken> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

  const header = decodeJwtPart(headerB64) as { kid?: string; alg?: string };
  const payload = decodeJwtPart(payloadB64) as {
    iss?: string;
    aud?: string;
    sub?: string;
    email?: string;
    exp?: number;
    iat?: number;
  };

  // Basic claim validation
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) throw new Error("Token expired");
  if (!payload.iat || payload.iat > now + 300) throw new Error("Token issued in the future");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
    throw new Error("Invalid token issuer");
  if (payload.aud !== projectId) throw new Error("Invalid token audience");
  if (!payload.sub) throw new Error("Missing sub claim");

  // Fetch public keys and find the one matching kid
  const keys = await getPublicKeys();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error(`Unknown key id: ${header.kid}`);

  // Import the public key and verify signature
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", use: "sig", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlDecode(sigB64);

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    signingInput
  );

  if (!valid) throw new Error("Invalid token signature");

  return { uid: payload.sub, email: payload.email ?? "" };
}
