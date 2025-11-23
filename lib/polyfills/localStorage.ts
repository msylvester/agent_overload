// Polyfill for localStorage in Node.js environments where it may be broken or missing
// This runs immediately when imported

(function() {
  if (typeof globalThis === "undefined") return;

  const isServer = typeof window === "undefined";
  
  if (!isServer) return;

  // Create a proper localStorage mock for server-side rendering
  const storage = new Map<string, string>();

  const localStorageMock = {
    getItem: (key: string): string | null => {
      return storage.get(key) ?? null;
    },
    setItem: (key: string, value: string): void => {
      storage.set(key, String(value));
    },
    removeItem: (key: string): void => {
      storage.delete(key);
    },
    clear: (): void => {
      storage.clear();
    },
    get length(): number {
      return storage.size;
    },
    key: (index: number): string | null => {
      const keys = Array.from(storage.keys());
      return keys[index] ?? null;
    },
  };

  // Replace localStorage if it's broken or missing
  const existingStorage = (globalThis as any).localStorage;
  if (
    typeof existingStorage === "undefined" ||
    existingStorage === null ||
    typeof existingStorage.getItem !== "function"
  ) {
    (globalThis as any).localStorage = localStorageMock;
  }
})();

export {};
