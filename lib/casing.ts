// @/lib/casing.ts

/**
 * Deep-converts all object keys from snake_case to camelCase.
 * Leaves arrays' elements converted too. Does not touch File/Blob/Date instances.
 */
export function snakeToCamel<T = unknown>(input: unknown): T {
    if (Array.isArray(input)) {
      return input.map((item) => snakeToCamel(item)) as unknown as T;
    }
  
    const isPlainObject =
      typeof input === "object" &&
      input !== null &&
      !(input instanceof File) &&
      !(input instanceof Blob) &&
      !(input instanceof Date);
  
    if (!isPlainObject) {
      return input as T;
    }
  
    const result: Record<string, unknown> = {};
  
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      const camelKey = key.replace(
        /_([a-z0-9])/g,
        (_, char: string) => char.toUpperCase(),
      );
  
      result[camelKey] = snakeToCamel(value);
    }
  
    return result as T;
  }