// Create a custom hook for app timing - put this in a separate file like useAppTimer.js
import { useState, useEffect } from 'react';

export const useAppTimer = () => {
  const [appMinutes, setAppMinutes] = useState(0);
  
  useEffect(() => {
    const LS_KEY = "appActiveMinutes";
    
    // Load saved minutes immediately on mount
    const savedMinutes = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
    console.log("Loading saved minutes:", savedMinutes); // Debug log
    setAppMinutes(savedMinutes);
    
    let accumulatedSeconds = 0;
    let lastUpdateTime = Date.now();
    let isVisible = document.visibilityState === 'visible';
    
    const saveToStorage = (minutes) => {
      localStorage.setItem(LS_KEY, String(minutes));
      console.log("Saved to storage:", minutes); // Debug log
    };
    
    const updateTimer = () => {
      if (isVisible) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateTime) / 1000);
        accumulatedSeconds += elapsedSeconds;
        
        // Update every 60 seconds
        if (accumulatedSeconds >= 60) {
          const newMinutes = Math.floor(accumulatedSeconds / 60);
          const totalMinutes = savedMinutes + Math.floor((accumulatedSeconds) / 60);
          
          setAppMinutes(totalMinutes);
          saveToStorage(totalMinutes);
          
          // Reset accumulated seconds, keeping remainder
          accumulatedSeconds = accumulatedSeconds % 60;
        }
      }
      lastUpdateTime = Date.now();
    };
    
    // Update every 10 seconds to be more responsive
    const intervalId = setInterval(updateTimer, 10000);
    
    // Handle visibility changes
    const handleVisibilityChange = () => {
      const wasVisible = isVisible;
      isVisible = document.visibilityState === 'visible';
      
      if (wasVisible && !isVisible) {
        // Tab became hidden - save progress
        updateTimer();
      } else if (!wasVisible && isVisible) {
        // Tab became visible - reset timer
        lastUpdateTime = Date.now();
      }
    };
    
    // Handle page unload to save final time
    const handleBeforeUnload = () => {
      updateTimer();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateTimer(); // Final save
    };
  }, []); // Empty dependency array is important
  
  return appMinutes;
};
