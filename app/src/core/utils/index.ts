import * as hashes from 'jshashes';

/**
 * Pauses the execution of the function for a specified duration.
 *
 * @export
 * @param {number} ms - The duration (in milliseconds) to pause the execution.
 * @returns {Promise} A Promise that resolves after the specified duration.
 */
export function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncates a given string to a specified length and appends ellipsis (...) if needed.
 *
 * @export
 * @param {string} text - The input string to be ellipsized.
 * @param {number} maxLength - The maximum length of the output string (including the ellipsis).
 * @returns {string} The ellipsized string.
 */
export function ellipsize(text: string, maxLength: number): string {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

/**
 * Creates a deep clone of the given ArrayBuffer.
 *
 * @export
 * @param {ArrayBuffer} buffer - The ArrayBuffer to clone.
 * @returns {ArrayBuffer} A new ArrayBuffer containing the same binary data as the input buffer.
 */
export function cloneArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
    const newBuffer = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(newBuffer).set(new Uint8Array(buffer));
    return newBuffer;
}

/**
 * Lexicographically compare two `Uint8Array` instances.
 *
 * @param {Uint8Array} a - The first `Uint8Array` instance to compare.
 * @param {Uint8Array} b - The second `Uint8Array` instance to compare.
 * @returns {number} The comparison result. -1 if `a` is "less" than `b`, 1 if `a` is "greater" than `b`, or 0 if they are "equal".
 */
export function compareUint8Array(a: Uint8Array, b: Uint8Array): number {
  if (a === b) return 0;

  const len = Math.min(a.byteLength, b.byteLength);

  for (let i = 0; i < len; ++i) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }

  if (a.byteLength < b.byteLength) return -1;
  if (a.byteLength > b.byteLength) return 1;

  return 0;
}

/**
 * Shares the specified text using the Web Share API if available in the user's browser.
 *
 * @function
 * @async
 * @param {string} text - The text to be shared.
 * @example
 * share("Hello, World!");
 */
export async function share(text: string) {
    if (navigator.share) {
        await navigator.share({
            text,
        });
    }
}

/*
Hashing
*/

const hasher = new hashes.MD5();

const hashCache = new Map<string, string>();

export async function md5(data: string): Promise<string> {
    if (!hashCache.has(data)) {
        const hashHex = hasher.hex(data);
        hashCache.set(data, hashHex);
    }
    return hashCache.get(data)!;
}

/*
Rate limiting
*/

export function getRateLimitResetTimeFromResponse(response: Response): number {
    const now = Date.now();
    const fallbackValue = now + 20*1000;
    const maxValue = now + 2*60*1000;

    const rateLimitReset = response.headers.get("x-ratelimit-reset");
    if (!rateLimitReset) {
        return fallbackValue;
    }

    let resetTime = parseInt(rateLimitReset, 10);
    if (isNaN(resetTime)) {
        return fallbackValue;
    }

    resetTime *= 1000;

    if (resetTime > fallbackValue) {
        return maxValue;
    }

    return resetTime;
}