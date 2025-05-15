/**
 * Models for the stopwatch functionality
 */

import { generateUniqueId } from "./utils.js";
import { saveToStorage, loadFromStorage } from "./utils.js";

// where we store the data
const STORAGE_KEY = "stopwatches";

/**
 * Main stopwatch class
 */
export class StopwatchModel {
  /**
   * Make a new stopwatch
   */
  constructor(data = {}) {
    this.id = data.id || generateUniqueId("sw_");
    this.title = data.title || "Untitled Stopwatch";
    this.createdAt = data.createdAt || Date.now();
    this.sessions = data.sessions || [];
  }

  // add up all the time from each session
  getTotalDuration() {
    return this.sessions.reduce((total, session) => {
      const end = session.end || Date.now();
      return total + (end - session.start);
    }, 0);
  }

  // convert total ms to readable format
  getFormattedTotalDuration() {
    return formatDuration(this.getTotalDuration());
  }

  // check if there's a session with no end time
  isRunning() {
    return this.sessions.some(session => !session.end);
  }

  // add a new timing session
  startSession() {
    // don't start if already running
    if (this.isRunning()) {
      return null;
    }

    const newSession = {
      id: generateUniqueId("ses_"),
      start: Date.now(),
      end: null,
      stopwatchId: this.id
    };

    this.sessions.push(newSession);
    return newSession;
  }

  // end the current session
  stopSession() {
    const activeSessionIndex = this.sessions.findIndex(session => !session.end);
    if (activeSessionIndex === -1) {
      return null;
    }

    this.sessions[activeSessionIndex].end = Date.now();
    return this.sessions[activeSessionIndex];
  }

  // remove a session completely
  deleteSession(sessionId) {
    const initialLength = this.sessions.length;
    this.sessions = this.sessions.filter(session => session.id !== sessionId);
    return this.sessions.length !== initialLength;
  }

  // prep for saving to storage
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      createdAt: this.createdAt,
      sessions: this.sessions
    };
  }
}

// format time nicely as HH:MM:SS
export function formatDuration(duration) {
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

// handles loading/saving/crud operations
export class StopwatchManager {
  constructor() {
    this.stopwatches = [];
    this.loaded = false;
  }

  // get 'em from storage
  async loadStopwatches() {
    try {
      const data = await loadFromStorage([STORAGE_KEY]);
      const rawStopwatches = data[STORAGE_KEY] || [];
      
      this.stopwatches = rawStopwatches.map(
        stopwatchData => new StopwatchModel(stopwatchData)
      );
      
      this.loaded = true;
      return this.stopwatches;
    } catch (error) {
      // something went wrong, return empty list
      console.error('Failed to load stopwatches:', error);
      this.stopwatches = [];
      this.loaded = true;
      return [];
    }
  }

  // save 'em to storage
  async saveStopwatches() {
    try {
      const stopwatchesData = this.stopwatches.map(sw => sw.toJSON());
      await saveToStorage({ [STORAGE_KEY]: stopwatchesData });
    } catch (error) {
      // TODO: add proper error handling here later
      console.error('Failed to save stopwatches:', error);
    }
  }

  // create a new one
  async addStopwatch(data) {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    const newStopwatch = new StopwatchModel(data);
    this.stopwatches.push(newStopwatch);
    await this.saveStopwatches();
    return newStopwatch;
  }

  // find by id
  async getStopwatch(id) {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    return this.stopwatches.find(sw => sw.id === id) || null;
  }

  // remove one 
  async deleteStopwatch(id) {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    const initialLength = this.stopwatches.length;
    this.stopwatches = this.stopwatches.filter(sw => sw.id !== id);
    
    if (this.stopwatches.length !== initialLength) {
      await this.saveStopwatches();
      return true;
    }
    
    return false;
  }

  // change an existing one
  async updateStopwatch(id, data) {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    const index = this.stopwatches.findIndex(sw => sw.id === id);
    if (index === -1) {
      return null;
    }

    // just update the fields we got
    Object.keys(data).forEach(key => {
      this.stopwatches[index][key] = data[key];
    });

    await this.saveStopwatches();
    return this.stopwatches[index];
  }

  // get everything
  async getAllStopwatches() {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    return this.stopwatches;
  }

  // start timer
  async startStopwatch(id) {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    const stopwatch = this.stopwatches.find(sw => sw.id === id);
    if (!stopwatch) {
      return null;
    }

    const session = stopwatch.startSession();
    if (session) {
      await this.saveStopwatches();
      return session;
    }

    return null;
  }

  // stop timer
  async stopStopwatch(id) {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    const stopwatch = this.stopwatches.find(sw => sw.id === id);
    if (!stopwatch) {
      return null;
    }

    const session = stopwatch.stopSession();
    if (session) {
      await this.saveStopwatches();
      return session;
    }

    return null;
  }

  // which timers are currently active?
  async getRunningStopwatches() {
    if (!this.loaded) {
      await this.loadStopwatches();
    }

    return this.stopwatches.filter(sw => sw.isRunning());
  }
} 