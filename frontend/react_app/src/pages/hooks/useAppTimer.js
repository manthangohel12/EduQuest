// Global App Timer Hook - tracks time across all pages and persists in localStorage
import { useState, useEffect } from 'react';

// Global timer state that persists across component unmounts
let globalTimer = null;
let globalStartTime = null;
let globalAccumulatedSeconds = 0;
let globalIntervalId = null;
let globalVisibilityState = 'visible';

// Debug flag - set to true to see detailed logs
const DEBUG_TIMER = true;
// Development mode - set to true for faster updates (every 5 seconds instead of 10)
const DEV_MODE = true;

// Initialize global timer if not already done
const initializeGlobalTimer = () => {
  if (globalTimer !== null) return; // Already initialized
  
  const LS_KEY = "appActiveMinutes";
  const LAST_ACTIVE_KEY = "lastActiveTime";
  
  // Load saved total minutes
  const savedMinutes = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
  globalTimer = savedMinutes;
  
  // Get last active time or start fresh
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  if (lastActive) {
    globalStartTime = parseInt(lastActive);
    // Calculate time since last active (if less than 24 hours)
    const now = Date.now();
    const timeSinceLastActive = Math.floor((now - globalStartTime) / 1000);
    if (timeSinceLastActive < 24 * 60 * 60) { // Less than 24 hours
      globalAccumulatedSeconds = timeSinceLastActive;
    }
  } else {
    globalStartTime = Date.now();
    localStorage.setItem(LAST_ACTIVE_KEY, String(globalStartTime));
  }
  
  // Start the global interval
  startGlobalInterval();
  
  // Set up global event listeners
  setupGlobalEventListeners();
  
  // if (DEBUG_TIMER) {
  //   console.log('🕒 Global timer initialized with', savedMinutes, 'minutes');
  //   console.log('🕒 Start time:', new Date(globalStartTime).toLocaleTimeString());
  //   console.log('🕒 Accumulated seconds:', globalAccumulatedSeconds);
  // }
};

// Start the global interval for updating time
const startGlobalInterval = () => {
  if (globalIntervalId) return; // Already running
  
  if (DEBUG_TIMER) {
    console.log('🕒 Starting global interval...');
  }
  
  globalIntervalId = setInterval(() => {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - globalStartTime) / 1000);
    const totalElapsedSeconds = globalAccumulatedSeconds + elapsedSeconds;
    
    // if (DEBUG_TIMER) {
    //   console.log('🕒 Interval check:', {
    //     elapsedSeconds,
    //     totalElapsedSeconds,
    //     globalAccumulatedSeconds,
    //     globalTimer
    //   });
    // }
    
    // Update every 60 seconds (1 minute)
    if (totalElapsedSeconds >= 60) {
      const newMinutes = Math.floor(totalElapsedSeconds / 60);
      globalTimer += newMinutes;
      
      // Save to localStorage
      const LS_KEY = "appActiveMinutes";
      localStorage.setItem(LS_KEY, String(globalTimer));
      
      // Update last active time
      globalStartTime = now;
      globalAccumulatedSeconds = totalElapsedSeconds % 60;
      
      // Notify all components using the hook
      notifyTimerUpdate(globalTimer);
      
      // if (DEBUG_TIMER) {
      //   console.log('🕒 Global timer updated:', globalTimer, 'minutes');
      //   console.log('🕒 New start time:', new Date(globalStartTime).toLocaleTimeString());
      //   console.log('🕒 New accumulated seconds:', globalAccumulatedSeconds);
      // }
    }
  }, DEV_MODE ? 5000 : 10000); // Check every 5 seconds in dev mode, 10 seconds in production
};

// Set up global event listeners
const setupGlobalEventListeners = () => {
  // Handle visibility changes
  const handleVisibilityChange = () => {
    const wasVisible = globalVisibilityState === 'visible';
    globalVisibilityState = document.visibilityState;
    
    if (wasVisible && globalVisibilityState !== 'visible') {
      // Tab became hidden - save current progress
      saveCurrentProgress();
    } else if (!wasVisible && globalVisibilityState === 'visible') {
      // Tab became visible - reset start time
      globalStartTime = Date.now();
      localStorage.setItem("lastActiveTime", String(globalStartTime));
    }
  };
  
  // Handle page unload
  const handleBeforeUnload = () => {
    saveCurrentProgress();
  };
  
  // Handle page focus/blur
  const handleFocus = () => {
    if (globalVisibilityState === 'visible') {
      globalStartTime = Date.now();
      localStorage.setItem("lastActiveTime", String(globalStartTime));
    }
  };
  
  const handleBlur = () => {
    saveCurrentProgress();
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
};

// Save current progress to localStorage
const saveCurrentProgress = () => {
  if (globalStartTime) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - globalStartTime) / 1000);
    const totalElapsedSeconds = globalAccumulatedSeconds + elapsedSeconds;
    
    if (totalElapsedSeconds >= 60) {
      const newMinutes = Math.floor(totalElapsedSeconds / 60);
      globalTimer += newMinutes;
      
      const LS_KEY = "appActiveMinutes";
      localStorage.setItem(LS_KEY, String(globalTimer));
      
      globalAccumulatedSeconds = totalElapsedSeconds % 60;
    }
    
    // Always save the last active time
    localStorage.setItem("lastActiveTime", String(now));
  }
};

// Store callbacks for components to get notified of timer updates
const timerUpdateCallbacks = new Set();

// Notify all components of timer updates
const notifyTimerUpdate = (newMinutes) => {
  timerUpdateCallbacks.forEach(callback => {
    try {
      callback(newMinutes);
    } catch (error) {
      console.error('Error in timer update callback:', error);
    }
  });
};

// Subscribe to timer updates
const subscribeToTimerUpdates = (callback) => {
  timerUpdateCallbacks.add(callback);
  return () => {
    timerUpdateCallbacks.delete(callback);
  };
};

export const useAppTimer = () => {
  const [appMinutes, setAppMinutes] = useState(() => {
    // Initialize with current global timer value
    if (globalTimer === null) {
      initializeGlobalTimer();
    }
    return globalTimer || 0;
  });
  
  useEffect(() => {
    // Subscribe to timer updates
    const unsubscribe = subscribeToTimerUpdates((newMinutes) => {
      setAppMinutes(newMinutes);
    });
    
    // Ensure global timer is initialized
    if (globalTimer === null) {
      initializeGlobalTimer();
      setAppMinutes(globalTimer || 0);
    }
    
    return unsubscribe;
  }, []);
  
  return appMinutes;
};

// Export utility functions for manual control
export const getAppTimer = () => globalTimer || 0;

export const resetAppTimer = () => {
  globalTimer = 0;
  globalStartTime = Date.now();
  globalAccumulatedSeconds = 0;
  
  localStorage.setItem("appActiveMinutes", "0");
  localStorage.setItem("lastActiveTime", String(globalStartTime));
  
  notifyTimerUpdate(globalTimer);
  return globalTimer;
};

export const addAppTime = (minutes) => {
  if (minutes > 0) {
    globalTimer += minutes;
    localStorage.setItem("appActiveMinutes", String(globalTimer));
    notifyTimerUpdate(globalTimer);
  }
  return globalTimer;
};

// Test function to manually verify timer is working
export const testAppTimer = () => {
  // console.log('🧪 Testing App Timer...');
  // console.log('🧪 Current timer value:', globalTimer);
  // console.log('🧪 Start time:', globalStartTime ? new Date(globalStartTime).toLocaleTimeString() : 'Not set');
  // console.log('🧪 Accumulated seconds:', globalAccumulatedSeconds);
  // console.log('🧪 Interval ID:', globalIntervalId);
  // console.log('🧪 Visibility state:', globalVisibilityState);
  // console.log('🧪 LocalStorage appActiveMinutes:', localStorage.getItem("appActiveMinutes"));
  // console.log('🧪 LocalStorage lastActiveTime:', localStorage.getItem("lastActiveTime"));
  
  // Force a timer update for testing
  if (globalStartTime) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - globalStartTime) / 1000);
    const totalElapsedSeconds = globalAccumulatedSeconds + elapsedSeconds;
    // console.log('🧪 Time since start:', elapsedSeconds, 'seconds');
    // console.log('🧪 Total elapsed:', totalElapsedSeconds, 'seconds');
    // console.log('🧪 Minutes to add:', Math.floor(totalElapsedSeconds / 60));
  }
  
  return {
    globalTimer,
    globalStartTime,
    globalAccumulatedSeconds,
    globalIntervalId,
    globalVisibilityState
  };
};

// Get debug info
export const getTimerDebugInfo = () => {
  return {
    globalTimer,
    globalStartTime: globalStartTime ? new Date(globalStartTime).toLocaleTimeString() : null,
    globalAccumulatedSeconds,
    globalIntervalId: globalIntervalId ? 'Running' : 'Not running',
    globalVisibilityState,
    localStorage: {
      appActiveMinutes: localStorage.getItem("appActiveMinutes"),
      lastActiveTime: localStorage.getItem("lastActiveTime")
    }
  };
};
