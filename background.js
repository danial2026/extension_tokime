/**
 * Main service worker - runs in background
 */

import "./js/browser-polyfill.js";

// listen for messages from popup or content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // handle diff message types
  if (message.action === "getActiveStopwatches") {
    // TODO: implement badge updates based on active stopwatches
    sendResponse({ success: true });
    return true; // keep channel open for async
  }

  return false;
});

// shows badge for active timers - helps visual feedback
function updateBadge(activeCount) {
  if (activeCount > 0) {
    browser.action.setBadgeText({ text: activeCount.toString() });
    browser.action.setBadgeBackgroundColor({ color: "#5d7599" });
  } else {
    browser.action.setBadgeText({ text: "" });
  }
}
