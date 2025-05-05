/**
 * Optimized Log calculcations by precalculating the base log, then using multiplication/
 * Well, according to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log#description|MDN} anyways
 *
 * @param base
 * @returns
 */
export function createBaseLog(base: number) {
  const baseLog = 1 / Math.log(base);
  return (input: number) => {
    return Math.log(input) * baseLog;
  };
}
