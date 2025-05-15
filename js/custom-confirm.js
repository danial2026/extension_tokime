/**
 * Replacemnt for standard confirm dialog that works in Firefox extensions
 */

// skip this in background contexts
const isWindowContext = typeof window !== "undefined";

let confirmDialog;
let confirmMessage;
let confirmOkBtn;
let confirmCancelBtn;
let confirmPromiseResolve = null;

// monkeypatch confirm() if we're in a window
if (isWindowContext) {
  // save the original
  const originalConfirm = window.confirm;
  window.confirm = function (message) {
    console.log('confirm called with:', message);

    if (confirmDialog && confirmMessage) {
      console.log('using custom confirm');
      return customConfirm(message);
    } else {
      // fallback to browser's confirm
      console.log('fallback to browser confirm');
      return originalConfirm.call(window, message);
    }
  };
}

/**
 * Set up the dialog elements
 */
export function initCustomConfirm() {
  // can't do this in workers
  if (!isWindowContext) return;

  // find the elements
  confirmDialog = document.getElementById("customConfirmDialog");
  confirmMessage = document.getElementById("confirmMessage");
  confirmOkBtn = document.getElementById("confirmOkBtn");
  confirmCancelBtn = document.getElementById("confirmCancelBtn");

  if (!confirmDialog || !confirmMessage || !confirmOkBtn || !confirmCancelBtn) {
    console.error('Could not find confirm dialog elements!');
    return;
  }

  // wire up the buttons
  confirmOkBtn.addEventListener("click", () => {
    console.log('OK clicked');
    hideConfirmDialog();
    if (confirmPromiseResolve) {
      confirmPromiseResolve(true);
      confirmPromiseResolve = null;
    }
  });

  confirmCancelBtn.addEventListener("click", () => {
    console.log('Cancel clicked');
    hideConfirmDialog();
    if (confirmPromiseResolve) {
      confirmPromiseResolve(false);
      confirmPromiseResolve = null;
    }
  });

  console.log('Custom confirm initialized');
}

/**
 * Show the confirm dialog with a message
 */
export function customConfirm(message) {
  // skip for workers
  if (!isWindowContext) return Promise.resolve(false);

  if (!confirmDialog || !confirmMessage) {
    console.error('Dialog not initialized');
    return Promise.resolve(false);
  }

  console.log('Showing confirm dialog:', message);

  // show message
  confirmMessage.textContent = message;

  // wrapper in a promise so we can await it
  return new Promise((resolve) => {
    confirmPromiseResolve = resolve;
    confirmDialog.style.display = "flex";
  });
}

// hide the dialog
function hideConfirmDialog() {
  if (confirmDialog) {
    confirmDialog.style.display = "none";
  }
}
