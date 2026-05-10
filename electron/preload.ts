import { ipcRenderer, contextBridge } from 'electron';

// --------- Expose some API to the Renderer process ---------
// We use contextBridge to expose a safe, limited API to the React app
// instead of enabling nodeIntegration, which is a major security risk.

contextBridge.exposeInMainWorld('electronAPI', {
  // Get App Version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Show Desktop Notification
  showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),
  
  // Example of receiving messages from the main process
  onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update-available', () => callback()),
  
  // Window Controls
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  }
});
