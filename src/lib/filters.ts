/**
 * Query-string helpers shared by the server page and the client filter bar.
 *
 * This module has no "use client" directive on purpose: a function exported
 * from a client module cannot be called during a server render, so parsing
 * helpers that both sides need have to live somewhere neutral.
 */

/** Parse a "min-max" range token (either end may be blank) into numbers. */
export function parseRange(token: string | undefined): { min?: number; max?: number } {
  if (!token) return {};
  const [a, b] = token.split("-");
  const min = a ? Number(a) : undefined;
  const max = b ? Number(b) : undefined;
  return {
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  };
}
