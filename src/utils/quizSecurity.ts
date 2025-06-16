export const enterFullscreen = () => {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen();
  }
};

export const preventCopyPaste = (e: ClipboardEvent) => {
  e.preventDefault();
  return false;
};

export const setupQuizSecurity = (
  onFullscreenExit: () => void,
  onTabSwitch: () => void
) => {
  let lastFocusTime = Date.now();

  // Handle tab/window switching
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onTabSwitch();
    }
  };

  const handleFocus = () => {
    const now = Date.now();
    // If the time difference is more than 200ms, it's likely a tab switch
    if (now - lastFocusTime > 200) {
      onTabSwitch();
    }
    lastFocusTime = now;
  };

  // Prevent copy/paste
  document.addEventListener('copy', preventCopyPaste);
  document.addEventListener('paste', preventCopyPaste);
  document.addEventListener('cut', preventCopyPaste);

  // Prevent right click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Handle tab switching
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', () => {
    lastFocusTime = Date.now();
  });

  // Enter fullscreen
  enterFullscreen();

  // Handle fullscreen change attempts
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      onFullscreenExit();
    }
  });

  return () => {
    // Cleanup function
    document.removeEventListener('copy', preventCopyPaste);
    document.removeEventListener('paste', preventCopyPaste);
    document.removeEventListener('cut', preventCopyPaste);
    document.removeEventListener('contextmenu', (e) => e.preventDefault());
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    exitFullscreen();
  };
}; 