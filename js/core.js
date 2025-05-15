/**
 * Core funtionality shared across the extension
 */

// UI elements we use
export const elements = {
  includeTitlesToggle: document.getElementById("includeTitles"),
  formatMarkdownToggle: document.getElementById("formatMarkdown"),
  formatTemplateInput: document.getElementById("formatTemplate"),
  plainTextTemplateInput: document.getElementById("plainTextTemplate"),
  copyAllTabsBtn: document.getElementById("copyAllTabs"),
  copySelectedTabsBtn: document.getElementById("copySelectedTabs"),
  resetBtn: document.querySelector(".reset-btn"),
  settingsIcon: document.querySelector(".settings-icon"),
  settingsMenu: document.querySelector(".settings-menu"),
  closeSettingsBtn: document.querySelector(".close-btn"),
  snackbar: document.getElementById("snackbar"),
  tabPreview: document.getElementById("tabPreview"),
  sortByPositionToggle: document.getElementById("sortByPosition"),
  groupByDomainToggle: document.getElementById("groupByDomain"),
  showSelectedOnlyToggle: document.getElementById("showSelectedOnly"),
  toggleLabel: document.getElementById("toggleLabel"),
};

// app state
export const state = {
  currentTabs: [], // all tabs in current window
  selectedTabs: [], // which ones user has selected
  forceShowSelected: false, // for preview mode
  currentPreviewRestoreButton: null, // tracks the current backup button
};

/**
 * Shows a snackbar notification
 * @param {string} message - Message to display
 */
export function showSnackbar(message) {
  if (!elements.snackbar) {
    console.warn("Snackbar element not found!");
    return;
  }

  // grab text element inside snackbar
  const textElement = elements.snackbar.querySelector(".snackbar-text");
  if (!textElement) {
    console.warn("Snackbar text element not found!");
    return;
  }

  // update msg
  textElement.textContent = message;

  // reset animation
  elements.snackbar.classList.remove("show");
  void elements.snackbar.offsetWidth; // force reflow

  // show it
  elements.snackbar.classList.add("show");

  // setup close btn
  const closeButton = elements.snackbar.querySelector(".snackbar-close");
  if (closeButton) {
    closeButton.onclick = () => {
      elements.snackbar.classList.remove("show");
    };
  }

  // auto-hide
  setTimeout(() => {
    elements.snackbar.classList.remove("show");
  }, 3000);
}

/**
 * Extracts domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url; // fallback if invalid url
  }
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - Whether copy was successful
 */
export async function copyToClipboard(text) {
  try {
    // modern clipboard API - doesn't work in all contexts
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    try {
      // old-school fallback with textarea trick
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // execCommand is deprecated but useful as a fallback
      document.execCommand("copy");
      textArea.remove();
      return true;
    } catch (err2) {
      console.error("Failed to copy text:", err2);
      return false;
    }
  }
}

/**
 * Formats a size in bytes to a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
export function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Initialize core elements when DOM is loaded
export function initCore() {
  // ensure elements are ready
  document.addEventListener("DOMContentLoaded", () => {
    // (re)populate any null DOM refs
    for (const key in elements) {
      if (elements[key] === null) {
        elements[key] =
          document.getElementById(key) || document.querySelector(`.${key}`);
      }
    }
  });
}
