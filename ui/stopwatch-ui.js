/**
 * UI stuff for the stopwatch feature
 */

import { StopwatchManager, StopwatchModel, formatDuration } from "../js/StopwatchModel.js";
import { loadTemplate } from "../js/utils.js";

// get a manager instance to work with
const stopwatchManager = new StopwatchManager();

// we'll grab these from the DOM after load
let stopwatchListContainer = null;
let createStopwatchBtn = null;
let createStopwatchModal = null;
let createStopwatchForm = null;
let closeCreateStopwatchModalBtn = null;
let editStopwatchModal = null;
let editStopwatchForm = null;
let closeEditStopwatchModalBtn = null;

// updates active timers every second
let updateTimer = null;

/**
 * Set up the UI when the page loads
 */
export async function initStopwatchUI() {
  // load saved stopwatches first
  await stopwatchManager.loadStopwatches();
  
  // grab the DOM elements we need
  stopwatchListContainer = document.getElementById('stopwatchList');
  createStopwatchBtn = document.getElementById('createStopwatchBtn');
  
  // load the modal template - easier than hardcoding all that HTML
  const createStopwatchModalContent = await loadTemplate('components/create_stopwatch_modal.html');
  document.getElementById('createStopwatchModalPlaceholder').innerHTML = createStopwatchModalContent;
  
  // load the edit modal template too
  const editStopwatchModalContent = await loadTemplate('components/edit_stopwatch_modal.html');
  document.getElementById('editStopwatchModalPlaceholder').innerHTML = editStopwatchModalContent;
  
  createStopwatchModal = document.getElementById('createStopwatchModal');
  createStopwatchForm = document.getElementById('createStopwatchForm');
  closeCreateStopwatchModalBtn = document.getElementById('closeCreateStopwatchModal');
  
  editStopwatchModal = document.getElementById('editStopwatchModal');
  editStopwatchForm = document.getElementById('editStopwatchForm');
  closeEditStopwatchModalBtn = document.getElementById('closeEditStopwatchModal');
  
  // wire up event handlers
  setupEventListeners();
  
  // show the stopwatches
  renderStopwatchList();
  
  // start updating active timers
  startUpdateTimer();
}

/**
 * Hook up all the event listeners
 */
function setupEventListeners() {
  // show the create modal when + button clicked
  if (createStopwatchBtn) {
    createStopwatchBtn.addEventListener('click', () => {
      createStopwatchModal.style.display = 'flex';
    });
  }
  
  // close modal when X clicked
  if (closeCreateStopwatchModalBtn) {
    closeCreateStopwatchModalBtn.addEventListener('click', () => {
      createStopwatchModal.style.display = 'none';
    });
  }
  
  // handle form submit
  if (createStopwatchForm) {
    createStopwatchForm.addEventListener('submit', handleCreateStopwatch);
  }
  
  // close edit modal when X clicked
  if (closeEditStopwatchModalBtn) {
    closeEditStopwatchModalBtn.addEventListener('click', () => {
      editStopwatchModal.style.display = 'none';
    });
  }
  
  // handle edit form submit
  if (editStopwatchForm) {
    editStopwatchForm.addEventListener('submit', handleEditStopwatch);
  }
  
  // close modal when clicking background
  window.addEventListener('click', (event) => {
    if (event.target === createStopwatchModal) {
      createStopwatchModal.style.display = 'none';
    }
    if (event.target === editStopwatchModal) {
      editStopwatchModal.style.display = 'none';
    }
  });
}

// Creates a new stopwatch when the form submits
async function handleCreateStopwatch(event) {
  event.preventDefault();
  
  const titleInput = document.getElementById('stopwatchTitle');
  const title = titleInput.value.trim();
  
  if (!title) {
    alert('Please enter a title for your stopwatch');
    return;
  }
  
  // make a new stopwatch
  await stopwatchManager.addStopwatch({ title });
  
  // reset form & hide modal
  titleInput.value = '';
  createStopwatchModal.style.display = 'none';
  
  // redraw the list
  renderStopwatchList();
}

// Handles edit form submission
async function handleEditStopwatch(event) {
  event.preventDefault();
  
  const titleInput = document.getElementById('editStopwatchTitle');
  const stopwatchId = document.getElementById('editStopwatchId').value;
  const title = titleInput.value.trim();
  
  if (!title) {
    alert('Please enter a title for your stopwatch');
    return;
  }
  
  // save the changes
  await stopwatchManager.updateStopwatch(stopwatchId, { title });
  
  // hide the modal
  editStopwatchModal.style.display = 'none';
  
  // refresh the list
  renderStopwatchList();
}

// Makes a list item for a stopwatch
function createStopwatchElement(stopwatch) {
  const li = document.createElement('li');
  li.className = 'stopwatch-item';
  li.dataset.id = stopwatch.id;
  
  const isRunning = stopwatch.isRunning();
  const totalDuration = stopwatch.getFormattedTotalDuration();
  
  li.innerHTML = `
    <div class="stopwatch-info">
      <span class="stopwatch-name">${stopwatch.title}</span>
      <span class="stopwatch-time" data-id="${stopwatch.id}">${totalDuration}</span>
    </div>
    <div class="stopwatch-actions">
      <button class="stopwatch-action-btn ${isRunning ? 'pause-btn' : 'play-btn'}" data-action="${isRunning ? 'stop' : 'start'}" title="${isRunning ? 'Stop' : 'Start'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          ${isRunning ? 
            '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>' : 
            '<path d="M8 5v14l11-7z"></path>'}
        </svg>
      </button>
      <button class="stopwatch-action-btn edit-btn" data-action="edit" title="Edit">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
        </svg>
      </button>
      <button class="stopwatch-action-btn delete-btn" data-action="delete" title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add handlers for the buttons
  li.querySelectorAll('.stopwatch-action-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      const action = btn.dataset.action;
      handleStopwatchAction(action, stopwatch.id, event);
    });
  });
  
  // Click on the timer to view details
  li.querySelector('.stopwatch-info').addEventListener('click', () => {
    openStopwatchDetails(stopwatch.id);
  });
  
  return li;
}

// Handle button clicks (start, stop, edit, delete)
async function handleStopwatchAction(action, stopwatchId, event) {
  event.stopPropagation(); // don't trigger the details view
  
  switch (action) {
    case 'start':
      await stopwatchManager.startStopwatch(stopwatchId);
      renderStopwatchList();
      break;
      
    case 'stop':
      await stopwatchManager.stopStopwatch(stopwatchId);
      renderStopwatchList();
      break;
      
    case 'edit':
      promptEditStopwatch(stopwatchId);
      break;
      
    case 'delete':
      confirmDeleteStopwatch(stopwatchId);
      break;
  }
}

// Opens the details page in a new tab
function openStopwatchDetails(stopwatchId) {
  // Open a new tab with the stopwatch details
  const detailsUrl = browser.runtime.getURL(`stopwatch-details.html?id=${stopwatchId}`);
  browser.tabs.create({ url: detailsUrl });
}

// Shows the edit modal for a stopwatch
async function promptEditStopwatch(stopwatchId) {
  const stopwatch = await stopwatchManager.getStopwatch(stopwatchId);
  if (!stopwatch) return;
  
  // fill in form with current values
  document.getElementById('editStopwatchId').value = stopwatchId;
  document.getElementById('editStopwatchTitle').value = stopwatch.title;
  
  // show the modal
  editStopwatchModal.style.display = 'flex';
}

// Asks for confirmation before deleting
async function confirmDeleteStopwatch(stopwatchId) {
  const stopwatch = await stopwatchManager.getStopwatch(stopwatchId);
  if (!stopwatch) return;
  
  if (confirm(`Are you sure you want to delete "${stopwatch.title}"?`)) {
    await stopwatchManager.deleteStopwatch(stopwatchId);
    renderStopwatchList();
  }
}

// Renders the list of stopwatches
async function renderStopwatchList() {
  if (!stopwatchListContainer) return;
  
  // clear any existing list
  stopwatchListContainer.innerHTML = '';
  
  // get all stopwatches
  const stopwatches = await stopwatchManager.getAllStopwatches();
  
  // newest first
  stopwatches.sort((a, b) => b.createdAt - a.createdAt);
  
  if (stopwatches.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-state';
    emptyMessage.innerHTML = `
      <p>No stopwatches yet</p>
      <p>Click the "New" button to create one</p>
    `;
    stopwatchListContainer.appendChild(emptyMessage);
    return;
  }
  
  // use a fragment for better performance
  const fragment = document.createDocumentFragment();
  stopwatches.forEach(stopwatch => {
    const item = createStopwatchElement(stopwatch);
    fragment.appendChild(item);
  });
  
  stopwatchListContainer.appendChild(fragment);
}

// Starts timer to update the active stopwatches
function startUpdateTimer() {
  // clear any existing timer
  if (updateTimer) {
    clearInterval(updateTimer);
  }
  
  // update every second
  updateTimer = setInterval(updateActiveStopwatches, 1000);
}

// Updates time display for running stopwatches
async function updateActiveStopwatches() {
  const runningStopwatches = await stopwatchManager.getRunningStopwatches();
  
  // Just update the time display without re-rendering everything
  runningStopwatches.forEach(stopwatch => {
    const timeElement = document.querySelector(`.stopwatch-time[data-id="${stopwatch.id}"]`);
    if (timeElement) {
      timeElement.textContent = stopwatch.getFormattedTotalDuration();
    }
  });
} 