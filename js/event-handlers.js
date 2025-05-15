/**
 * Event handlers for DOM elements
 * 
 * Firefox needs these handlers registered via JS instead of inline HTML
 * because of Content Security Policy restrictions
 */

document.addEventListener("DOMContentLoaded", function () {
  // hook up events for all interactive elements
  // we can't use onclick="" in HTML because Firefox CSP blocks it

  // confirm dialog buttons
  const confirmDialog = document.getElementById("customConfirmDialog");
  if (confirmDialog) {
    const confirmCancelBtn = document.getElementById("confirmCancelBtn");
    const confirmOkBtn = document.getElementById("confirmOkBtn");

    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener("click", function () {
        confirmDialog.style.display = "none";
        // run cancel callback if it exists
        if (window.confirmCancelCallback) {
          window.confirmCancelCallback();
        }
      });
    }

    if (confirmOkBtn) {
      confirmOkBtn.addEventListener("click", function () {
        confirmDialog.style.display = "none";
        // run confirm callback if it exists
        if (window.confirmCallback) {
          window.confirmCallback();
        }
      });
    }
  }

  // gear icon for settings
  const settingsToggleBtn = document.getElementById("settingsToggleBtn");
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener("click", function () {
      // fire event that popup.js listens for
      document.dispatchEvent(new CustomEvent("toggleSettings"));
    });
  }

  // add format button in settings
  const addFormatBtn = document.getElementById("addFormatBtn");
  if (addFormatBtn) {
    addFormatBtn.addEventListener("click", function () {
      document.dispatchEvent(new CustomEvent("addFormat"));
    });
  }

  // main reset button
  const resetBtn = document.querySelector(".reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      document.dispatchEvent(new CustomEvent("resetOptions"));
    });
  }

  // all checkboxes and toggles
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      // send event with what changed and its new state
      document.dispatchEvent(
        new CustomEvent("toggleChange", {
          detail: {
            id: this.id,
            checked: this.checked,
          },
        })
      );
    });
  });

  // template dropdowns
  const formatTemplateDropdown = document.getElementById(
    "formatTemplateDropdown"
  );
  if (formatTemplateDropdown) {
    formatTemplateDropdown.addEventListener("change", function () {
      document.dispatchEvent(
        new CustomEvent("formatTemplateChange", {
          detail: {
            value: this.value,
          },
        })
      );

      // update examples when template changes
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // plain text templates
  const plainTextTemplateDropdown = document.getElementById(
    "plainTextTemplateDropdown"
  );
  if (plainTextTemplateDropdown) {
    plainTextTemplateDropdown.addEventListener("change", function () {
      document.dispatchEvent(
        new CustomEvent("plainTextTemplateChange", {
          detail: {
            value: this.value,
          },
        })
      );

      // refresh examples
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // template input fields - live update as user types
  const formatTemplateInput = document.getElementById("formatTemplate");
  if (formatTemplateInput) {
    formatTemplateInput.addEventListener("input", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  const plainTextTemplateInput = document.getElementById("plainTextTemplate");
  if (plainTextTemplateInput) {
    plainTextTemplateInput.addEventListener("input", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // toggles that affect formatting
  const includeTitlesToggle = document.getElementById("includeTitles");
  if (includeTitlesToggle) {
    includeTitlesToggle.addEventListener("change", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  const formatMarkdownToggle = document.getElementById("formatMarkdown");
  if (formatMarkdownToggle) {
    formatMarkdownToggle.addEventListener("change", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // fix broken favicons
  const favicons = document.querySelectorAll(".tab-favicon");
  favicons.forEach((img) => {
    img.addEventListener("error", function () {
      this.src = "../icons/link.svg";
    });
  });

  // special setup for folder preview page
  if (window.location.pathname.includes("folder-preview.html")) {
    // setup listeners for tabs in the preview
    const setupTabItemListeners = () => {
      const tabItems = document.querySelectorAll(".tab-item");
      const removeButtons = document.querySelectorAll(".tab-remove-btn");

      tabItems.forEach((item) => {
        item.addEventListener("click", function () {
          const url = this.querySelector(".tab-url").textContent;
          if (url) {
            window.open(url, "_blank");
          }
        });
      });

      removeButtons.forEach((btn) => {
        btn.addEventListener("click", function (e) {
          e.stopPropagation(); // don't open the tab when clicking X

          // get tab index from data attribute
          const tabItem = this.closest(".tab-item");
          const tabIndex = tabItem.dataset.tabIndex;

          if (tabIndex !== undefined) {
            // fire event to remove this tab 
            document.dispatchEvent(
              new CustomEvent("removeTabFromFolder", {
                detail: {
                  tabIndex: parseInt(tabIndex, 10),
                },
              })
            );
          }
        });
      });
    };

    // use mutation observer to catch dynamically added tabs
    // needed since tabs get added after initial page load
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          setupTabItemListeners();
        }
      }
    });

    // start watching for tab changes
    const tabList = document.getElementById("tabList");
    if (tabList) {
      observer.observe(tabList, { childList: true, subtree: true });
      // initial setup
      setupTabItemListeners();
    }
  }
});
