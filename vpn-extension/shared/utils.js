 /* ============================================
   Shared Utilities - Pure helper functions
   No dependencies, reusable everywhere
   ============================================ */

/**
 * Yield to the main event loop to prevent UI freeze.
 * Call this between heavy synchronous operations.
 */
export function yieldToMain() {
  return new Promise(function (r) { setTimeout(r, 0); });
}

/**
 * Debounce a function call.
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, ms) {
  var t = null;
  return function () {
    var ctx = this;
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function () {
      try {
        fn.apply(ctx, args);
      } catch (e) {
        console.error("Debounced function error:", e);
      }
    }, ms);
  };
}

/**
 * Insert into a Map with automatic eviction when max size is reached.
 * Evicts the oldest entry (FIFO).
 * @param {Map} map - Target Map
 * @param {*} key - Key to insert
 * @param {*} value - Value to insert
 * @param {number} max - Maximum map size
 */
export function cachePut(map, key, value, max) {
  if (map.size >= max) {
    var first = map.keys().next().value;
    map.delete(first);
  }
  map.set(key, value);
}

/**
 * Safely try-catch async operation with fallback.
 * @param {Function} fn - Async function to try
 * @param {*} fallback - Fallback value on error
 * @returns {Promise<*>}
 */
export async function safeAsync(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    console.error("safeAsync error:", e);
    return fallback;
  }
}
