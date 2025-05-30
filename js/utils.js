/**
 * Common utilities for the extension
 */

import { customConfirm } from "./custom-confirm.js";

/**
 * Get the appropriate storage API (Chrome or Firefox)
 * @returns The browser's storage API
 */
export function getStorageAPI() {
  // Check if we're in a Firefox context
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage.local;
  }
  // Chrome/Edge context
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local;
  }
  // Fallback for development or testing
  console.warn('No browser storage API detected!');
  return null;
}

/**
 * Get the runtime API for error checking
 * @returns The browser's runtime API
 */
export function getRuntimeAPI() {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser.runtime;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime;
  }
  return null;
}

/**
 * Saves data to browser storage
 * @param {Object} data - Key-value pairs to save to storage
 * @returns {Promise} - Promise that resolves when the data is saved
 */
export function saveToStorage(data) {
  return new Promise((resolve, reject) => {
    try {
      const storage = getStorageAPI();
      const runtime = getRuntimeAPI();
      
      if (!storage) {
        console.error('No storage API available');
        reject(new Error('No storage API available'));
        return;
      }

      storage.set(data, () => {
        const error = runtime ? runtime.lastError : null;
        if (error) {
          console.error('Storage error:', error);
          reject(error);
        } else {
          console.log('Saved data successfully');
          resolve();
        }
      });
    } catch (err) {
      console.error('Unexpected storage error:', err);
      reject(err);
    }
  });
}

/**
 * Loads data from browser storage
 * @param {string|Array|Object} keys - The keys to load from storage
 * @returns {Promise} - Promise that resolves with the loaded data
 */
export function loadFromStorage(keys) {
  return new Promise((resolve, reject) => {
    try {
      const storage = getStorageAPI();
      const runtime = getRuntimeAPI();
      
      if (!storage) {
        console.error('No storage API available');
        resolve({}); // Return empty to avoid breaking the app
        return;
      }

      storage.get(keys, (result) => {
        const error = runtime ? runtime.lastError : null;
        if (error) {
          console.error('Failed to load from storage:', error);
          // return empty obj to avoid null errors later
          resolve({});
        } else {
          console.log('Loaded data:', Object.keys(result || {}).length, 'keys');
          resolve(result || {});
        }
      });
    } catch (err) {
      console.error('Unexpected error in loadFromStorage:', err);
      // still return empty to prevent app from totally breaking
      resolve({});
    }
  });
}

/**
 * Shows a modal dialog
 * @param {HTMLElement} modal - The modal element to show
 * @param {Function} setupFn - Optional function to run when the modal is shown
 */
export function showModal(modal, setupFn) {
  if (!modal) return;

  modal.style.display = "flex";

  if (typeof setupFn === "function") {
    setupFn();
  }

  document.body.classList.add("modal-open");
}

/**
 * Hides a modal dialog
 * @param {HTMLElement} modal - The modal element to hide
 * @param {HTMLElement} form - Optional form to reset
 */
export function hideModal(modal, form) {
  if (!modal) return;

  modal.style.display = "none";

  if (form) {
    form.reset();
  }

  document.body.classList.remove("modal-open");
}

/**
 * Creates a DOM element with the specified attributes and styles
 * @param {string} tag - The tag name of the element to create
 * @param {Object} attributes - Key-value pairs of attributes to set
 * @param {Object} styles - Key-value pairs of styles to set
 * @param {string} content - Optional HTML content to set
 * @returns {HTMLElement} - The created element
 */
export function createElement(tag, attributes = {}, styles = {}, content = "") {
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "dataset") {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else if (key === "textContent") {
      element.textContent = value;
    } else {
      element[key] = value;
    }
  }

  // Set styles
  for (const [key, value] of Object.entries(styles)) {
    element.style[key] = value;
  }

  // Set content
  if (content) {
    element.innerHTML = content;
  }

  return element;
}

/**
 * Formats text using a template with placeholders
 * @param {string} template - Template string with {{placeholders}}
 * @param {Object} data - Key-value pairs to replace placeholders
 * @returns {string} - Formatted text
 */
export function formatWithTemplate(template, data) {
  if (!template) return "";

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

/**
 * Shows a snackbar message
 * @param {string} message - Message to show
 */
export function showSnackbar(message) {
  const snackbar = document.getElementById("snackbar");
  if (!snackbar) {
    console.error('No snackbar found!');
    return;
  }

  // Find the text element within the snackbar
  const textElement = snackbar.querySelector(".snackbar-text");
  if (textElement) {
    // Update the message
    textElement.textContent = message;
  } else {
    // If no text element, use the snackbar itself
    snackbar.textContent = message;
  }

  // Remove any existing show class first
  snackbar.classList.remove("show");

  // Force a reflow to restart animation
  void snackbar.offsetWidth;

  // Show the snackbar
  snackbar.classList.add("show");

  // Set up the close button
  const closeButton = snackbar.querySelector(".snackbar-close");
  if (closeButton) {
    closeButton.onclick = () => {
      snackbar.classList.remove("show");
    };
  }

  // Auto-hide after 3 seconds
  setTimeout(() => {
    snackbar.classList.remove("show");
  }, 3000);
}

/**
 * Generates a unique ID with an optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateUniqueId(prefix = "") {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handles dropdown change event with optional input field
 * @param {HTMLSelectElement} dropdown - The dropdown element
 * @param {HTMLInputElement} input - The associated input element
 * @param {string} storageKey - The key to use for storage
 */
export function handleDropdownChange(dropdown, input, storageKey) {
  if (!dropdown || !input) return;

  // If "custom" is selected, show the input field
  if (dropdown.value === "custom") {
    input.classList.add("show");
    input.focus();
  } else {
    input.classList.remove("show");
    input.value = dropdown.value;
  }

  // Save the current template to storage
  const templateValue =
    dropdown.value === "custom" ? input.value : dropdown.value;
  const data = { [storageKey]: templateValue };
  updateFormatExamples();
  saveToStorage(data);
}

/**
 * Creates a delete button with a trash icon
 * @param {string|Function} param1 - Either a click handler function or format type string
 * @param {string} param2 - Either a title string or format ID
 * @param {string} param3 - Optional format name
 * @returns {HTMLElement} - The delete button element
 */
export function createDeleteButton(param1, param2, param3) {
  // Check if first parameter is a function (legacy usage) or format type (new usage)
  let onClick;
  let title = "Remove";

  if (typeof param1 === "function") {
    // Legacy usage: createDeleteButton(onClick, title)
    onClick = param1;
    if (param2) title = param2;
  } else {
    // New usage: createDeleteButton(formatType, formatId, formatName)
    const formatType = param1;
    const formatId = param2;
    if (param3) title = `Remove "${param3}"`;

    // Create click handler for format removal
    onClick = async (e) => {
      e.stopPropagation(); // Prevent dropdown from opening/closing

      console.log(`Trying to remove format: ${formatType} / ${formatId}`);

      // Use customConfirm with await
      const confirmed = await customConfirm(`Remove format "${param3}"?`);

      console.log('User confirmed:', confirmed);

      if (confirmed) {
        // Use the removeFormat function from format-manager if available in window scope
        if (window.removeFormat) {
          window.removeFormat(formatType, formatId);
        } else if (typeof removeFormat === "function") {
          removeFormat(formatType, formatId);
        } else {
          console.error('No removeFormat function found!');
        }
      }
    };
  }

  const deleteBtn = createElement(
    "button",
    {
      className: "delete-btn",
      title: title,
    },
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: "4px",
    },
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="red" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
  );

  if (typeof onClick === "function") {
    deleteBtn.addEventListener("click", onClick);
  }

  return deleteBtn;
}

/**
 * Loads an HTML template from the given path
 * @param {string} path - Path to the template file
 * @returns {Promise<string>} - The template HTML
 */
export async function loadTemplate(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const template = await response.text();
    return template;
  } catch (error) {
    console.error('Failed to load template:', error);
    throw error;
  }
}

/**
 * Shows the loading spinner
 */
export function showLoadingSpinner() {
  const loadingContainer = document.getElementById("loadingContainer");
  if (loadingContainer) {
    loadingContainer.style.display = "flex";
  }
}

/**
 * Hides the loading spinner
 */
export function hideLoadingSpinner() {
  const loadingContainer = document.getElementById("loadingContainer");
  if (loadingContainer) {
    loadingContainer.style.display = "none";
  }
}

/**
 * Clears all data from browser storage
 * @returns {Promise} - Promise that resolves when storage is cleared
 */
export function clearStorage() {
  return new Promise((resolve, reject) => {
    try {
      const storage = getStorageAPI();
      const runtime = getRuntimeAPI();
      
      if (!storage) {
        console.error('No storage API available');
        reject(new Error('No storage API available'));
        return;
      }
      
      // Different browsers have different clear methods
      if (typeof storage.clear === 'function') {
        // Firefox and Chrome both support clear()
        storage.clear(() => {
          const error = runtime ? runtime.lastError : null;
          if (error) {
            console.error('Storage clear error:', error);
            reject(error);
          } else {
            console.log('Storage cleared successfully');
            resolve();
          }
        });
      } else {
        // Fallback: get all keys and remove them
        storage.get(null, (items) => {
          const error = runtime ? runtime.lastError : null;
          if (error) {
            console.error('Failed to get storage items:', error);
            reject(error);
            return;
          }
          
          const allKeys = Object.keys(items || {});
          if (allKeys.length === 0) {
            resolve(); // Nothing to clear
            return;
          }
          
          storage.remove(allKeys, () => {
            const removeError = runtime ? runtime.lastError : null;
            if (removeError) {
              console.error('Failed to remove items:', removeError);
              reject(removeError);
            } else {
              console.log('Storage cleared successfully (via remove)');
              resolve();
            }
          });
        });
      }
    } catch (err) {
      console.error('Unexpected error in clearStorage:', err);
      reject(err);
    }
  });
}
