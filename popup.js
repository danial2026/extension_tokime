/**
 * popup.js - Main entry point for the Tokime stopwatch extension popup
 */

import { loadTemplate, showLoadingSpinner, hideLoadingSpinner } from "./js/utils.js";
import { initStopwatchUI } from "./ui/stopwatch-ui.js";
import { initSettingsUI } from "./ui/settings-ui.js";
import "./js/browser-polyfill.js";
import "./js/custom-confirm.js";

/**
 * Initialize the popup
 */
async function init() {
  try {
    // Show loading spinner
    showLoadingSpinner();
    
    // Load templates
    await Promise.all([
      loadConfirmDialog(),
      loadSettings()
    ]);
    
    // Initialize UI components
    initSettingsUI();
    await initStopwatchUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Hide loading spinner
    hideLoadingSpinner();
  } catch (error) {
    console.error("Error initializing popup:", error);
    hideLoadingSpinner();
  }
}

/**
 * Load the confirm dialog template
 */
async function loadConfirmDialog() {
  try {
    const confirmDialogTemplate = await loadTemplate("components/confirm_dialog.html");
    document.getElementById("confirmDialogPlaceholder").innerHTML = confirmDialogTemplate;
  } catch (error) {
    console.error("Error loading confirm dialog:", error);
  }
}

/**
 * Load the settings panel template
 */
async function loadSettings() {
  try {
    const settingsTemplate = await loadTemplate("components/settings_panel.html");
    document.getElementById("settingsMenuPlaceholder").innerHTML = settingsTemplate;
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

/**
 * Set up event listeners for the popup
 */
function setupEventListeners() {
  // Settings toggle button
  const settingsToggleBtn = document.getElementById("settingsToggleBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  
  if (settingsToggleBtn && settingsPanel) {
    settingsToggleBtn.addEventListener("click", () => {
      settingsPanel.classList.toggle("show");
    });

    // Close settings when clicking outside
    document.addEventListener("click", (event) => {
      if (!settingsPanel.contains(event.target) && 
          !settingsToggleBtn.contains(event.target) && 
          settingsPanel.classList.contains("show")) {
        settingsPanel.classList.remove("show");
      }
    });
  }

  // Snackbar close button
  const snackbarClose = document.querySelector(".snackbar-close");
  if (snackbarClose) {
    snackbarClose.addEventListener("click", () => {
      document.getElementById("snackbar").classList.remove("show");
    });
  }
}

/**
 * Show a snackbar message
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function showSnackbar(message, duration = 3000) {
  const snackbar = document.getElementById("snackbar");
  const snackbarText = document.querySelector(".snackbar-text");
  
  if (snackbar && snackbarText) {
    snackbarText.textContent = message;
    snackbar.classList.add("show");
    
    // Hide after duration
    setTimeout(() => {
      snackbar.classList.remove("show");
    }, duration);
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);
