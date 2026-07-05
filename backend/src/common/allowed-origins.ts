/**
 * Parses the CORS_ORIGIN env var into a normalized list of allowed origins.
 * Returns an empty array when unset/blank (meaning: no cross-origin access).
 */
export function parseAllowedOrigins(value: string | undefined): string[] {
  return (
    value
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
