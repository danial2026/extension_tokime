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

// update timer for running stopwatches
let updateTimer = null;

// nicely format a time for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  
  // include seconds since we're timing stuff
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
}

// figure out how long a session lasted
function formatSessionDuration(start, end) {
  const duration = (end || Date.now()) - start;
  return formatDuration(duration);
}

// page init
async function initPage() {
  // grab all the elements we need
  stopwatchTitleElement = document.getElementById('stopwatchTitle');
  totalTimeElement = document.getElementById('totalTime');
  sessionCountElement = document.getElementById('sessionCount');
  sessionsContainer = document.getElementById('sessionsContainer');
  startStopBtn = document.getElementById('startStopBtn');
  playIcon = document.getElementById('playIcon');
  pauseIcon = document.getElementById('pauseIcon');
  backButton = document.getElementById('backButton');
  loadingContainer = document.getElementById('loadingContainer');
  stopwatchInfoSection = document.getElementById('stopwatchInfo');
  
  // get the ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentStopwatchId = urlParams.get('id');
  
  if (!currentStopwatchId) {
    showError('No stopwatch ID specified');
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
  backButton.addEventListener('click', () => {
    window.close();
  });
  
  // start/stop button
  startStopBtn.addEventListener('click', handleStartStop);
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
    showError('Stopwatch not found');
    return;
  }
  
  // set tab title to match stopwatch
  document.title = `${currentStopwatch.title} - Tokime`;
  
  // show the sections now that we have data
  stopwatchInfoSection.style.display = 'block';
  sessionsContainer.style.display = 'block';
  
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
  playIcon.style.display = isRunning ? 'none' : 'block';
  pauseIcon.style.display = isRunning ? 'block' : 'none';
  startStopBtn.title = isRunning ? 'Stop' : 'Start';
}

// display the list of sessions
function renderSessions() {
  sessionsContainer.innerHTML = '';
  
  if (!currentStopwatch || currentStopwatch.sessions.length === 0) {
    // show empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <h3>No Sessions</h3>
      <p>Press the play button to start recording time for this stopwatch.</p>
    `;
    sessionsContainer.appendChild(emptyState);
    return;
  }
  
  // sort newest first
  const sortedSessions = [...currentStopwatch.sessions]
    .sort((a, b) => b.start - a.start);
  
  // create DOM for each session
  const fragment = document.createDocumentFragment();
  sortedSessions.forEach(session => {
    const sessionElement = document.createElement('div');
    sessionElement.className = 'session-item';
    
    const startDate = formatDate(session.start);
    const duration = formatSessionDuration(session.start, session.end);
    const isActive = !session.end;
    
    if (isActive) {
      sessionElement.classList.add('active-session');
    }
    
    // HTML for the session
    sessionElement.innerHTML = `
      <div class="session-date">
        Start: ${startDate}
        ${isActive ? '<span class="active-badge">ACTIVE</span>' : ''}
      </div>
      <div class="session-duration">${duration}</div>
      ${isActive ? '' : `<div class="session-end-time">End: ${formatDate(session.end)}</div>`}
    `;
    
    fragment.appendChild(sessionElement);
  });
  
  sessionsContainer.appendChild(fragment);
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
  const activeSessionElements = document.querySelectorAll('.active-session');
  const activeSessions = currentStopwatch.sessions.filter(s => !s.end);
  
  activeSessionElements.forEach((element, index) => {
    if (index < activeSessions.length) {
      const session = activeSessions[index];
      const durationElement = element.querySelector('.session-duration');
      if (durationElement) {
        durationElement.textContent = formatSessionDuration(session.start, null);
      }
    }
  });
}

// toggle loading spinner
function showLoading(show) {
  loadingContainer.style.display = show ? 'flex' : 'none';
  stopwatchInfoSection.style.display = show ? 'none' : 'block';
  sessionsContainer.style.display = show ? 'none' : 'block';
}

// display error message
function showError(message) {
  sessionsContainer.innerHTML = `
    <div class="empty-state">
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
  sessionsContainer.style.display = 'block';
}

// init when ready
document.addEventListener('DOMContentLoaded', initPage); 