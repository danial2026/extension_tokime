/**
 * Settings UI code
 */

import { loadFromStorage, saveToStorage, clearStorage } from "../js/utils.js";
import "../js/browser-polyfill.js";

/**
 * Initialize the settings UI
 */
export function initSettingsUI() {
  // Set up event listeners for data management
  setupEventListeners();
}

/**
 * Set up event listeners for settings UI
 */
function setupEventListeners() {
  // Settings panel toggle
  const closeBtn = document.querySelector('.settings-menu .close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('settingsPanel').classList.remove('show');
    });
  }

  // Data management buttons
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }

  const importDataBtn = document.getElementById('importDataBtn');
  if (importDataBtn) {
    importDataBtn.addEventListener('click', importData);
  }

  const clearDataBtn = document.getElementById('clearDataBtn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', clearData);
  }
}

/**
 * Export all data
 */
async function exportData() {
  try {
    // Get all data from storage
    const data = await loadFromStorage(null); // null = get all data
    
    // Create JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokime-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Error exporting data');
  }
}

/**
 * Import data from a file
 */
function importData() {
  try {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    // Handle file selection
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Confirm before overwriting
          if (confirm('This will overwrite all your current data. Continue?')) {
            await saveToStorage(data);
            alert('Data imported successfully. Please reload the extension.');

            // Reload extension
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (error) {
          console.error('Import parsing error:', error);
          alert('Invalid import file');
        }
      };
      
      reader.readAsText(file);
    };

    // Trigger file selection
    input.click();
  } catch (error) {
    console.error('Import setup failed:', error);
    alert('Error importing data');
  }
}

/**
 * Clear all data
 */
async function clearData() {
  try {
    if (confirm('This will delete all your data. This cannot be undone. Continue?')) {
      // Use our cross-browser compatible clearStorage function
      await clearStorage();
      
      alert('All data has been cleared. Please reload the extension.');

      // Reload extension
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('Clear data failed:', error);
    alert('Error clearing data');
  }
}
