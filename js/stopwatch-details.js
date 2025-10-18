/**
 * Details page for individual stopwatches
 */

import { StopwatchManager, formatDuration } from "./StopwatchModel.js";

// manage stopwatches
const stopwatchManager = new StopwatchManager();

// keeps track of what we're viewing
let currentStopwatchId = null;
let currentStopwatch = null;

// DOM elements - loaded after init
let stopwatchTitleElement = null;
let totalTimeElement = null;
let sessionCountElement = null;
let sessionsContainer = null;
let startStopBtn = null;
let playIcon = null;
let pauseIcon = null;
let backButton = null;
let loadingContainer = null;
let stopwatchInfoSection = null;
let addSessionBtn = null;
let sessionModal = null;
let sessionForm = null;
let sessionTitleInput = null;
let sessionStartDateInput = null;
let sessionEndDateInput = null;
let closeSessionModalBtn = null;
let cancelSessionBtn = null;
let sessionModalTitle = null;

// update timer for running stopwatches
let updateTimer = null;

// current session being edited (null for new session)
let currentEditingSessionId = null;

// nicely format a time for display
function formatDate(timestamp) {
  const date = new Date(timestamp);

  // include seconds since we're timing stuff
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  return date.toLocaleDateString("en-US", options);
}

// figure out how long a session lasted
function formatSessionDuration(start, end) {
  const duration = (end || Date.now()) - start;
  return formatDuration(duration);
}

// page init
async function initPage() {
  // grab all the elements we need
  stopwatchTitleElement = document.getElementById("stopwatchTitle");
  totalTimeElement = document.getElementById("totalTime");
  sessionCountElement = document.getElementById("sessionCount");
  sessionsContainer = document.getElementById("sessionsContainer");
  startStopBtn = document.getElementById("startStopBtn");
  playIcon = document.getElementById("playIcon");
  pauseIcon = document.getElementById("pauseIcon");
  backButton = document.getElementById("backButton");
  loadingContainer = document.getElementById("loadingContainer");
  stopwatchInfoSection = document.getElementById("stopwatchInfo");
  addSessionBtn = document.getElementById("addSessionBtn");
  sessionModal = document.getElementById("sessionModal");
  sessionForm = document.getElementById("sessionForm");
  sessionTitleInput = document.getElementById("sessionTitle");
  sessionStartDateInput = document.getElementById("sessionStartDate");
  sessionEndDateInput = document.getElementById("sessionEndDate");
  closeSessionModalBtn = document.getElementById("closeSessionModal");
  cancelSessionBtn = document.getElementById("cancelSessionBtn");
  sessionModalTitle = document.getElementById("sessionModalTitle");

  // get the ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentStopwatchId = urlParams.get("id");

  if (!currentStopwatchId) {
    showError("No stopwatch ID specified");
    return;
  }

  // hook up buttons etc
  setupEventListeners();

  // load the data
  showLoading(true);
  await loadStopwatchData();
  showLoading(false);

  // start the update timer
  startUpdateTimer();
}

// wire up event handlers
function setupEventListeners() {
  // back button - just close the tab
  backButton.addEventListener("click", () => {
    window.close();
  });

  // start/stop button
  startStopBtn.addEventListener("click", handleStartStop);

  // add session button
  addSessionBtn.addEventListener("click", openAddSessionModal);

  // modal controls
  closeSessionModalBtn.addEventListener("click", closeSessionModal);
  cancelSessionBtn.addEventListener("click", closeSessionModal);
  sessionModal.addEventListener("click", (e) => {
    if (e.target === sessionModal) {
      closeSessionModal();
    }
  });

  // session form submission
  sessionForm.addEventListener("submit", handleSessionFormSubmit);
}

// toggle running state of the stopwatch
async function handleStartStop() {
  if (!currentStopwatch) return;

  if (currentStopwatch.isRunning()) {
    // stop it
    await stopwatchManager.stopStopwatch(currentStopwatchId);
  } else {
    // start it
    await stopwatchManager.startStopwatch(currentStopwatchId);
  }

  // reload with updated data
  await loadStopwatchData();
}

// load stopwatch and sessions from storage
async function loadStopwatchData() {
  currentStopwatch = await stopwatchManager.getStopwatch(currentStopwatchId);

  if (!currentStopwatch) {
    showError("Stopwatch not found");
    return;
  }

  // set tab title to match stopwatch
  document.title = `${currentStopwatch.title} - Tokime`;

  // show the sections now that we have data
  stopwatchInfoSection.style.display = "block";
  sessionsContainer.style.display = "block";

  // update the display
  updateStopwatchUI();

  // show the session list
  renderSessions();
}

// update all the UI elements with current data
function updateStopwatchUI() {
  if (!currentStopwatch) return;

  stopwatchTitleElement.textContent = currentStopwatch.title;
  totalTimeElement.textContent = currentStopwatch.getFormattedTotalDuration();
  sessionCountElement.textContent = currentStopwatch.sessions.length;

  // update button based on current state
  const isRunning = currentStopwatch.isRunning();
  playIcon.style.display = isRunning ? "none" : "block";
  pauseIcon.style.display = isRunning ? "block" : "none";
  startStopBtn.title = isRunning ? "Stop" : "Start";
}

// display the list of sessions
function renderSessions() {
  sessionsContainer.innerHTML = "";

  if (!currentStopwatch || currentStopwatch.sessions.length === 0) {
    // show empty state
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <h3>No Sessions</h3>
      <p>Press the play button to start recording time for this stopwatch.</p>
    `;
    sessionsContainer.appendChild(emptyState);
    return;
  }

  // sort newest first
  const sortedSessions = [...currentStopwatch.sessions].sort(
    (a, b) => b.start - a.start
  );

  // create DOM for each session
  const fragment = document.createDocumentFragment();
  sortedSessions.forEach((session) => {
    const sessionElement = document.createElement("div");
    sessionElement.className = "session-item";
    sessionElement.dataset.sessionId = session.id;

    const startDate = formatDate(session.start);
    const duration = formatSessionDuration(session.start, session.end);
    const isActive = !session.end;

    if (isActive) {
      sessionElement.classList.add("active-session");
    }

    // HTML for the session
    sessionElement.innerHTML = `
      ${
        session.title ? `<div class="session-title">${session.title}</div>` : ""
      }
      <div class="session-date">
        Start: ${startDate}
        ${isActive ? '<span class="active-badge">ACTIVE</span>' : ""}
      </div>
      <div class="session-duration">${duration}</div>
      ${
        isActive
          ? ""
          : `<div class="session-end-time">End: ${formatDate(
              session.end
            )}</div>`
      }
      <div class="session-actions">
        <button class="session-action-btn edit-btn" data-session-id="${
          session.id
        }" title="Edit Session">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="session-action-btn delete-btn" data-session-id="${
          session.id
        }" title="Delete Session">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `;

    fragment.appendChild(sessionElement);
  });

  sessionsContainer.appendChild(fragment);

  // add event listeners to action buttons
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sessionId = btn.dataset.sessionId;
      openEditSessionModal(sessionId);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sessionId = btn.dataset.sessionId;
      handleDeleteSession(sessionId);
    });
  });
}

// start timer to update display
function startUpdateTimer() {
  // clear any existing timer
  if (updateTimer) {
    clearInterval(updateTimer);
  }

  // update once per second
  updateTimer = setInterval(async () => {
    if (currentStopwatch && currentStopwatch.isRunning()) {
      updateActiveSessionsUI();
    }
  }, 1000);
}

// just update the times without full reload
function updateActiveSessionsUI() {
  if (!currentStopwatch) return;

  // update total counter
  totalTimeElement.textContent = currentStopwatch.getFormattedTotalDuration();

  // update each running session
  const activeSessionElements = document.querySelectorAll(".active-session");
  const activeSessions = currentStopwatch.sessions.filter((s) => !s.end);

  activeSessionElements.forEach((element, index) => {
    if (index < activeSessions.length) {
      const session = activeSessions[index];
      const durationElement = element.querySelector(".session-duration");
      if (durationElement) {
        durationElement.textContent = formatSessionDuration(
          session.start,
          null
        );
      }
    }
  });
}

// toggle loading spinner
function showLoading(show) {
  loadingContainer.style.display = show ? "flex" : "none";
  stopwatchInfoSection.style.display = show ? "none" : "block";
  sessionsContainer.style.display = show ? "none" : "block";
}

// display error message
function showError(message) {
  sessionsContainer.innerHTML = `
    <div class="empty-state">
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
  sessionsContainer.style.display = "block";
}

// convert timestamp to datetime-local format
function timestampToDateTimeLocal(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// open modal for adding a new session
function openAddSessionModal() {
  currentEditingSessionId = null;
  sessionModalTitle.textContent = "Add Session";

  // reset form
  sessionForm.reset();
  sessionTitleInput.value = "";
  sessionStartDateInput.value = timestampToDateTimeLocal(Date.now());
  sessionEndDateInput.value = "";

  sessionModal.style.display = "flex";
}

// open modal for editing an existing session
function openEditSessionModal(sessionId) {
  const session = currentStopwatch.sessions.find((s) => s.id === sessionId);
  if (!session) return;

  currentEditingSessionId = sessionId;
  sessionModalTitle.textContent = "Edit Session";

  // populate form with existing data
  sessionTitleInput.value = session.title || "";
  sessionStartDateInput.value = timestampToDateTimeLocal(session.start);
  sessionEndDateInput.value = session.end
    ? timestampToDateTimeLocal(session.end)
    : "";

  sessionModal.style.display = "flex";
}

// close the modal
function closeSessionModal() {
  sessionModal.style.display = "none";
  sessionForm.reset();
  currentEditingSessionId = null;
}

// handle session form submission
async function handleSessionFormSubmit(e) {
  e.preventDefault();

  const title = sessionTitleInput.value.trim();
  const startDate = new Date(sessionStartDateInput.value).getTime();
  const endDate = sessionEndDateInput.value
    ? new Date(sessionEndDateInput.value).getTime()
    : null;

  // validate dates
  if (isNaN(startDate)) {
    alert("Please enter a valid start date and time");
    return;
  }

  if (endDate && endDate <= startDate) {
    alert("End time must be after start time");
    return;
  }

  if (currentEditingSessionId) {
    // update existing session
    const updates = {
      title: title,
      start: startDate,
      end: endDate,
    };
    currentStopwatch.updateSession(currentEditingSessionId, updates);
  } else {
    // add new session
    currentStopwatch.addManualSession({
      title: title,
      start: startDate,
      end: endDate,
    });
  }

  // save to storage
  await stopwatchManager.saveStopwatches();

  // close modal and reload
  closeSessionModal();
  await loadStopwatchData();
}

// delete a session
async function handleDeleteSession(sessionId) {
  if (!confirm("Are you sure you want to delete this session?")) {
    return;
  }

  currentStopwatch.deleteSession(sessionId);
  await stopwatchManager.saveStopwatches();
  await loadStopwatchData();
}

// init when ready
document.addEventListener("DOMContentLoaded", initPage);
