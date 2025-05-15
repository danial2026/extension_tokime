/**
 * Clipboard handling - this is tricky in extensions
 */

import "./browser-polyfill.js";
import { saveToStorage, loadFromStorage } from "./utils.js";

/**
 * Copy text to clipboard via background script
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    try {
      // try direct clipboard API first (doesn't always work)
      navigator.clipboard
        .writeText(text)
        .then(() => resolve())
        .catch((err) => {
          
          // fallback to background script method
          browser.runtime.sendMessage(
            { action: "copyToClipboard", text },
            (response) => {
              if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
              } else if (response && response.success) {
                resolve();
              } else {
                reject(new Error("Failed to copy text"));
              }
            }
          );
        });
    } catch (error) {
      // direct access failed, try background
      browser.runtime.sendMessage(
        { action: "copyToClipboard", text },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else if (response && response.success) {
            resolve();
          } else {
            reject(new Error("Failed to copy text"));
          }
        }
      );
    }
  });
}

/**
 * Function to copy text to clipboard (for background script)
 * @param {string} text - Text to copy
 */
export function copyTextToClipboard(text) {
  // store text in storage so our content script can get it
  saveToStorage({ clipboard_text: text })
    .then(() => {
      // we need a non-extension page to run our script in
      browser.tabs.query({ currentWindow: true }, function (tabs) {
        // can't use browser:// or about: pages
        const allowedTabs = tabs.filter(
          (tab) =>
            tab.url &&
            !tab.url.startsWith("browser://") &&
            !tab.url.startsWith("about:") &&
            !tab.url.startsWith("moz-extension://") &&
            !tab.url.startsWith("chrome-extension://")
        );

        if (allowedTabs.length === 0) {
          // no usable tabs - need to let the user know
          browser.action.setBadgeText({ text: "!" });
          browser.action.setBadgeBackgroundColor({ color: "#e74c3c" });

          // clear after 3s
          setTimeout(() => {
            browser.action.setBadgeText({ text: "" });
          }, 3000);
          return;
        }

        // try to use the active tab if possible
        let targetTabId;
        const activeNonRestrictedTabs = allowedTabs.filter((tab) => tab.active);
        if (activeNonRestrictedTabs.length > 0) {
          targetTabId = activeNonRestrictedTabs[0].id;
        } else {
          // or just use the first non-restricted tab
          targetTabId = allowedTabs[0].id;
        }

        // inject and run our copy script
        browser.scripting
          .executeScript({
            target: { tabId: targetTabId },
            function: executeClipboardCopy,
          })
          .then(() => {
            // show success indicator
            browser.action.setBadgeText({ text: "✓" });
            browser.action.setBadgeBackgroundColor({ color: "#5d7599" });

            // clear after 3s
            setTimeout(() => {
              browser.action.setBadgeText({ text: "" });
            }, 3000);
          })
          .catch((error) => {
            console.error('Script injection failed:', error);

            // show error indicator
            browser.action.setBadgeText({ text: "!" });
            browser.action.setBadgeBackgroundColor({ color: "#e74c3c" });

            // clear after 3s
            setTimeout(() => {
              browser.action.setBadgeText({ text: "" });
            }, 3000);
          });
      });
    })
    .catch((error) => {
      console.error('Storage error:', error);
    });
}

/**
 * Get the appropriate storage API (Chrome or Firefox)
 * This is a duplicate of the function in utils.js because we need it
 * in the injected content script context
 */
function getContentScriptStorageAPI() {
  // Check if we're in a Firefox context
  if (typeof window.browser !== 'undefined' && window.browser.storage) {
    return window.browser.storage.local;
  }
  // Chrome/Edge context
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local;
  }
  return null;
}

/**
 * Get the runtime API for error checking
 * This is a duplicate of the function in utils.js because we need it
 * in the injected content script context
 */
function getContentScriptRuntimeAPI() {
  if (typeof window.browser !== 'undefined' && window.browser.runtime) {
    return window.browser.runtime;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime;
  }
  return null;
}

/**
 * This function will be injected into the active tab to perform the copy
 * Note: Cannot be an arrow function due to browser.scripting usage
 */
export function executeClipboardCopy() {
  try {
    // Use our cross-browser compatible functions
    const getStorage = function() {
      // Check if we're in a Firefox context
      if (typeof window.browser !== 'undefined' && window.browser.storage) {
        return window.browser.storage.local;
      }
      // Chrome/Edge context
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return chrome.storage.local;
      }
      return null;
    };
    
    const getRuntime = function() {
      if (typeof window.browser !== 'undefined' && window.browser.runtime) {
        return window.browser.runtime;
      }
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome.runtime;
      }
      return null;
    };
    
    const storage = getStorage();
    const runtime = getRuntime();
    
    if (!storage || !runtime) {
      console.error('Browser APIs not available in content script');
      return;
    }

    storage.get(["clipboard_text"], function (result) {
      const error = runtime.lastError;
      if (error) {
        console.error('Storage access error:', error);
        return;
      }

      if (result.clipboard_text) {
        // old school copy technique
        const textarea = document.createElement("textarea");
        textarea.value = result.clipboard_text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        // do the copy
        document.execCommand("copy");

        // cleanup
        document.body.removeChild(textarea);

        // remove the stored text for privacy
        storage.remove(["clipboard_text"], function () {
          if (runtime.lastError) {
            console.error('Failed to clear storage:', runtime.lastError);
          }
        });
      }
    });
  } catch (error) {
    console.error('Clipboard operation failed:', error);
  }
}

/**
 * Show a status badge in the extension icon
 * @param {string} text - Badge text
 * @param {string} color - Badge color
 * @param {number} duration - Duration to show the badge in ms
 */
export function showBadge(text, color = "#5d7599", duration = 3000) {
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color });

  // Clear the badge after the specified duration
  setTimeout(() => {
    browser.action.setBadgeText({ text: "" });
  }, duration);
}
