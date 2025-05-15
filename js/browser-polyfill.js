/**
 * Simple shim for browser API compatibility
 * 
 * Makes chrome.* APIs available as browser.* APIs and vice versa.
 * Helps us not worry about different browsers' quirks.
 */

(function () {
  "use strict";

  if (
    typeof globalThis.browser === "undefined" &&
    typeof globalThis.chrome !== "undefined"
  ) {
    // Chrome environment - expose Chrome APIs as browser.*
    globalThis.browser = {
      // basic APIs we need
      runtime: chrome.runtime,
      tabs: chrome.tabs,
      storage: chrome.storage,
      
      // needed for popup icon stuff
      action: chrome.action,
    };
  } else if (
    typeof globalThis.chrome === "undefined" &&
    typeof globalThis.browser !== "undefined"
  ) {
    // Firefox setup - opposite direction
    globalThis.chrome = {
      // core stuff
      runtime: browser.runtime,
      tabs: browser.tabs,
      storage: browser.storage,
      
      // firefox calls it browserAction sometimes
      action: browser.browserAction || browser.action,
    };
  }

  // fix promises weirdness
  if (globalThis.chrome) {
    // firefox doesn't have lastError so add it
    if (globalThis.chrome.runtime && !globalThis.chrome.runtime.lastError) {
      Object.defineProperty(globalThis.chrome.runtime, "lastError", {
        get: function () {
          return null;
        },
      });
    }
  }
})();
