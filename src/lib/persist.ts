/**
 * Persistence for the in-memory stores (scores, screen state, last screen),
 * backed by one IndexedDB object store of key → value.
 *
 * Everything is loaded once at startup (`loadPersisted`, before the first
 * render) and written back as values change (`persist`). If IndexedDB isn't
 * available (tests, some private modes) or fails, the app still works; it
 * just forgets on reload.
 */

const DB_NAME = "fretto";
const STORE = "kv";
/**
 * Bump when the shape of anything persisted changes (a round, a score...).
 * Saved data from another version is discarded rather than fed to code that
 * doesn't expect it.
 */
export const DATA_VERSION = 1;
const VERSION_KEY = "dataVersion";
/** Don't hold the app back for more than this waiting for the database. */
const LOAD_TIMEOUT_MS = 1500;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function readAll(db: IDBDatabase): Promise<Map<string, unknown>> {
  return new Promise((resolve) => {
    const out = new Map<string, unknown>();
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve(out);
        out.set(String(cursor.key), cursor.value);
        cursor.continue();
      };
      req.onerror = () => resolve(new Map());
    } catch {
      resolve(new Map());
    }
  });
}

/** Everything saved, or an empty map if nothing (usable) is saved. */
export async function loadPersisted(): Promise<Map<string, unknown>> {
  const load = (async () => {
    const db = await openDb();
    if (!db) return new Map<string, unknown>();
    const all = await readAll(db);
    if (all.get(VERSION_KEY) !== DATA_VERSION) {
      clearAll(db);
      return new Map<string, unknown>();
    }
    all.delete(VERSION_KEY);
    return all;
  })();
  const timeout = new Promise<Map<string, unknown>>((resolve) =>
    setTimeout(() => resolve(new Map()), LOAD_TIMEOUT_MS),
  );
  return Promise.race([load, timeout]);
}

function clearAll(db: IDBDatabase) {
  try {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    store.clear();
    store.put(DATA_VERSION, VERSION_KEY);
  } catch {
    // Nothing to do: the app works without saved data.
  }
}

// Writes are batched: several values changing together (e.g. a new round
// resets the answers too) go out in one transaction.
const pending = new Map<string, unknown>();
let flushScheduled = false;

/** Save `value` under `key`. Values must be structured-cloneable (plain data). */
export function persist(key: string, value: unknown) {
  if (typeof indexedDB === "undefined") return;
  pending.set(key, value);
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(flush);
}

async function flush() {
  flushScheduled = false;
  const db = await openDb();
  if (!db || pending.size === 0) return;
  const entries = [...pending];
  pending.clear();
  try {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    for (const [k, v] of entries) store.put(v, k);
    store.put(DATA_VERSION, VERSION_KEY);
  } catch {
    // e.g. quota exceeded or a value that can't be cloned: skip this save.
  }
}
