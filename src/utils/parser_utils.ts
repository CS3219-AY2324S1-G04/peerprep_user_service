/**
 * @file Utility functions for parsing values.
 */

/**
 * Converts a string {@link raw} to an integer.
 *
 * Unlike {@link parseInt}, this function will return undefined if the exact
 * content of the string is not a base 10 integer.
 * @param raw - String to parse.
 * @returns Integer resulting from the parsing if {@link raw} contains a base 10
 * integer. Else, returns undefined.
 */
export function parseIntStrict(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const val: number = parseFloat(raw);
  if (isNaN(val) || !Number.isInteger(val)) {
    return undefined;
  }

  return val;
}
