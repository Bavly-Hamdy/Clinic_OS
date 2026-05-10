import { useState, useEffect } from 'react';

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.windowControls) {
      setIsElectron(true);
      // Also add a class to the body for global CSS targeting
      document.body.classList.add('is-electron');
      return () => {
        document.body.classList.remove('is-electron');
      };
    }
  }, []);

  return isElectron;
}
