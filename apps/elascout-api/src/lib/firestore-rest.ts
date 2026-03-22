/**
 * Lightweight Firestore REST API client for Cloudflare Workers.
 * Replaces firebase-admin Firestore (which requires gRPC/Node.js).
 * Uses the Firestore v1 REST API with Bearer token authentication.
 */

// Sentinel value to trigger a server timestamp write
export const SERVER_TIMESTAMP = Symbol("SERVER_TIMESTAMP");

// ─── Firestore value types ───────────────────────────────────────────────────

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } };

interface FsDocument {
  name?: string;
  fields?: Record<string, FsValue>;
  createTime?: string;
  updateTime?: string;
}

interface TransformField {
  fieldPath: string;
  setToServerValue: "REQUEST_TIME";
}

// ─── Serializers ─────────────────────────────────────────────────────────────

function toFsValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFsValue) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, FsValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFsValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFsValue(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fromFsValue);
  if ("mapValue" in v) {
    const result: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(v.mapValue.fields ?? {})) {
      result[k] = fromFsValue(fv);
    }
    return result;
  }
  return null;
}

function fromFsDoc(doc: FsDocument): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) {
    result[k] = fromFsValue(v);
  }
  if (doc.createTime) result.createdAt = doc.createTime;
  if (doc.updateTime) result.updatedAt = doc.updateTime;
  return result;
}

/** Splits data into regular fields and server-timestamp transforms. */
function buildWriteData(data: Record<string, unknown>): {
  fields: Record<string, FsValue>;
  transforms: TransformField[];
} {
  const fields: Record<string, FsValue> = {};
  const transforms: TransformField[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === SERVER_TIMESTAMP) {
      transforms.push({ fieldPath: key, setToServerValue: "REQUEST_TIME" });
    } else {
      fields[key] = toFsValue(value);
    }
  }

  return { fields, transforms };
}

function encodeLength(n: number): Uint8Array {
  if (n < 128) return new Uint8Array([n]);
  if (n < 256) return new Uint8Array([0x81, n]);
  return new Uint8Array([0x82, (n >> 8) & 0xff, n & 0xff]);
}

// ─── Firestore REST client ───────────────────────────────────────────────────

export class FirestoreRest {
  private readonly baseUrl: string;
  private readonly commitUrl: string;

  constructor(
    private readonly projectId: string,
    private readonly getToken: () => Promise<string>
  ) {
    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    this.baseUrl = base;
    this.commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  }

  private async req(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    return fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  }

  /** Get a single document. Returns null if not found. */
  async getDoc(
    collection: string,
    id: string
  ): Promise<Record<string, unknown> | null> {
    const res = await this.req(`${this.baseUrl}/${collection}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firestore getDoc error ${res.status}: ${await res.text()}`);
    return fromFsDoc(await res.json() as FsDocument);
  }

  /**
   * Create or replace a document. Server timestamps are applied atomically
   * via the commit endpoint.
   */
  async setDoc(
    collection: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { fields, transforms } = buildWriteData(data);

    await this._commit([
      { update: { name: this._docName(collection, id), fields } },
      ...(transforms.length > 0
        ? [
            {
              transform: {
                document: this._docName(collection, id),
                fieldTransforms: transforms,
              },
            },
          ]
        : []),
    ]);

    const doc = await this.getDoc(collection, id);
    return doc!;
  }

  /** Partial update — only the provided fields are changed. */
  async updateDoc(
    collection: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { fields, transforms } = buildWriteData(data);

    const updateMask = Object.keys(fields);

    await this._commit([
      {
        update: { name: this._docName(collection, id), fields },
        updateMask: { fieldPaths: updateMask },
      },
      ...(transforms.length > 0
        ? [
            {
              transform: {
                document: this._docName(collection, id),
                fieldTransforms: transforms,
              },
            },
          ]
        : []),
    ]);

    const doc = await this.getDoc(collection, id);
    return doc!;
  }

  /** Delete a document. */
  async deleteDoc(collection: string, id: string): Promise<void> {
    const res = await this.req(`${this.baseUrl}/${collection}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Firestore deleteDoc error ${res.status}: ${await res.text()}`);
    }
  }

  /**
   * Run a structured query.
   * @param filters  Array of { field, op ('==','!=','<','<=','>','>='), value }
   * @param orderBy  Array of { field, direction ('ASCENDING'|'DESCENDING') }
   */
  async query(
    collection: string,
    filters: Array<{ field: string; op: string; value: unknown }>,
    orderBy: Array<{ field: string; direction: "ASCENDING" | "DESCENDING" }> = [],
    limit?: number
  ): Promise<Array<Record<string, unknown> & { id: string }>> {
    const OP_MAP: Record<string, string> = {
      "==": "EQUAL",
      "!=": "NOT_EQUAL",
      "<": "LESS_THAN",
      "<=": "LESS_THAN_OR_EQUAL",
      ">": "GREATER_THAN",
      ">=": "GREATER_THAN_OR_EQUAL",
      "array-contains": "ARRAY_CONTAINS",
    };

    const makeFilter = (f: { field: string; op: string; value: unknown }) => ({
      fieldFilter: {
        field: { fieldPath: f.field },
        op: OP_MAP[f.op] ?? "EQUAL",
        value: toFsValue(f.value),
      },
    });

    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId: collection }],
    };

    if (filters.length === 1) {
      structuredQuery.where = makeFilter(filters[0]!);
    } else if (filters.length > 1) {
      structuredQuery.where = {
        compositeFilter: { op: "AND", filters: filters.map(makeFilter) },
      };
    }

    if (orderBy.length > 0) {
      structuredQuery.orderBy = orderBy.map((o) => ({
        field: { fieldPath: o.field },
        direction: o.direction,
      }));
    }

    if (limit !== undefined) structuredQuery.limit = limit;

    const res = await this.req(`${this.baseUrl}:runQuery`, {
      method: "POST",
      body: JSON.stringify({ structuredQuery }),
    });

    if (!res.ok) throw new Error(`Firestore query error ${res.status}: ${await res.text()}`);

    const rows = (await res.json()) as Array<{ document?: FsDocument }>;
    return rows
      .filter((r) => r.document)
      .map((r) => {
        const doc = r.document!;
        const nameParts = (doc.name ?? "").split("/");
        const id = nameParts[nameParts.length - 1]!;
        return { id, ...fromFsDoc(doc) };
      });
  }

  /**
   * Run a collection group query (searches across all subcollections with the given name).
   */
  async collectionGroupQuery(
    collectionId: string,
    filters: Array<{ field: string; op: string; value: unknown }>,
    orderBy: Array<{ field: string; direction: "ASCENDING" | "DESCENDING" }> = [],
    limit?: number
  ): Promise<Array<Record<string, unknown> & { id: string }>> {
    const OP_MAP: Record<string, string> = {
      "==": "EQUAL",
      "!=": "NOT_EQUAL",
      "<": "LESS_THAN",
      "<=": "LESS_THAN_OR_EQUAL",
      ">": "GREATER_THAN",
      ">=": "GREATER_THAN_OR_EQUAL",
      "array-contains": "ARRAY_CONTAINS",
    };

    const makeFilter = (f: { field: string; op: string; value: unknown }) => ({
      fieldFilter: {
        field: { fieldPath: f.field },
        op: OP_MAP[f.op] ?? "EQUAL",
        value: toFsValue(f.value),
      },
    });

    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId, allDescendants: true }],
    };

    if (filters.length === 1) {
      structuredQuery.where = makeFilter(filters[0]!);
    } else if (filters.length > 1) {
      structuredQuery.where = {
        compositeFilter: { op: "AND", filters: filters.map(makeFilter) },
      };
    }

    if (orderBy.length > 0) {
      structuredQuery.orderBy = orderBy.map((o) => ({
        field: { fieldPath: o.field },
        direction: o.direction,
      }));
    }

    if (limit !== undefined) structuredQuery.limit = limit;

    const res = await this.req(`${this.baseUrl}:runQuery`, {
      method: "POST",
      body: JSON.stringify({ structuredQuery }),
    });

    if (!res.ok) throw new Error(`Firestore collectionGroupQuery error ${res.status}: ${await res.text()}`);

    const rows = (await res.json()) as Array<{ document?: FsDocument }>;
    return rows
      .filter((r) => r.document)
      .map((r) => {
        const doc = r.document!;
        const nameParts = (doc.name ?? "").split("/");
        const id = nameParts[nameParts.length - 1]!;
        return { id, ...fromFsDoc(doc) };
      });
  }

  /** Generate a random Firestore-compatible document ID. */
  newId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }

  private _docName(collection: string, id: string): string {
    return `projects/${this.projectId}/databases/(default)/documents/${collection}/${id}`;
  }

  private async _commit(writes: unknown[]): Promise<void> {
    const res = await this.req(this.commitUrl, {
      method: "POST",
      body: JSON.stringify({ writes }),
    });
    if (!res.ok) {
      throw new Error(`Firestore commit error ${res.status}: ${await res.text()}`);
    }
  }
}
