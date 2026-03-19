/**
 * Generates OAuth2 access tokens from a Firebase/Google service account
 * for use in Cloudflare Workers (no Node.js dependencies).
 * Uses the Web Crypto API (available in all modern runtimes).
 *
 * The FIREBASE_PRIVATE_KEY must be PKCS#8 format (-----BEGIN PRIVATE KEY-----)
 * or PKCS#1 format (-----BEGIN RSA PRIVATE KEY-----). Both are handled.
 */

interface TokenCache {
  token: string;
  expiresAt: number;
}

// In-memory cache per Worker instance (warm requests share this)
let tokenCache: TokenCache | null = null;

function encodeAsn1Length(length: number): Uint8Array {
  if (length < 128) return new Uint8Array([length]);
  if (length < 256) return new Uint8Array([0x81, length]);
  return new Uint8Array([0x82, (length >> 8) & 0xff, length & 0xff]);
}

/** Wraps a PKCS#1 DER buffer into PKCS#8 DER format. */
function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  // AlgorithmIdentifier: SEQUENCE { rsaEncryption OID, NULL }
  const algorithmId = new Uint8Array([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);

  // OCTET STRING wrapping the PKCS#1 key
  const octetLen = encodeAsn1Length(pkcs1.length);
  const octetStr = new Uint8Array(1 + octetLen.length + pkcs1.length);
  octetStr[0] = 0x04;
  octetStr.set(octetLen, 1);
  octetStr.set(pkcs1, 1 + octetLen.length);

  // version INTEGER 0
  const version = new Uint8Array([0x02, 0x01, 0x00]);

  // Build inner content
  const inner = new Uint8Array(version.length + algorithmId.length + octetStr.length);
  inner.set(version);
  inner.set(algorithmId, version.length);
  inner.set(octetStr, version.length + algorithmId.length);

  // Outer SEQUENCE
  const seqLen = encodeAsn1Length(inner.length);
  const pkcs8 = new Uint8Array(1 + seqLen.length + inner.length);
  pkcs8[0] = 0x30;
  pkcs8.set(seqLen, 1);
  pkcs8.set(inner, 1 + seqLen.length);

  return pkcs8;
}

/** Imports a PEM private key (PKCS#8 or PKCS#1) as a CryptoKey. */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const isPkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");

  const base64 = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const keyBuffer = (isPkcs1 ? pkcs1ToPkcs8(bytes).buffer : bytes.buffer) as ArrayBuffer;

  return crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function base64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function buildSignedJwt(
  header: object,
  payload: object,
  privateKey: CryptoKey
): Promise<string> {
  const enc = new TextEncoder();
  const h = base64url(enc.encode(JSON.stringify(header)));
  const p = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${h}.${p}`;

  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    enc.encode(signingInput)
  );

  return `${signingInput}.${base64url(sig)}`;
}

/**
 * Fetches (and caches) an OAuth2 access token for the given service account.
 * Scopes: Firestore + Firebase.
 */
export async function getServiceAccountToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  const privateKey = await importPrivateKey(privateKeyPem);

  const jwt = await buildSignedJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      scope:
        "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase",
      iat: now,
      exp: now + 3600,
    },
    privateKey
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Service account token exchange failed: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  tokenCache = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}
