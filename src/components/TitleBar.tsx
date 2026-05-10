import { Minus, Square, X, ActivitySquare } from 'lucide-react';
import { useElectron } from '@/hooks/useElectron';

// Type definition for our electronAPI to avoid TypeScript errors
declare global {
  interface Window {
    electronAPI?: {
      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    };
  }
}

export function TitleBar() {
  const isElectron = useElectron();

  useEffect(() => {
    if (isElectron) {
      document.body.style.paddingTop = 'var(--electron-titlebar-height)';
    } else {
      document.body.style.paddingTop = '0px';
    }
  }, [isElectron]);

  // If not running in Electron (e.g., normal web browser), don't render the title bar
  if (!isElectron) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[32px] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center select-none z-[9999]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 px-3 h-full">
        <ActivitySquare className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
          ClinicOS
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => window.electronAPI?.windowControls.minimize()}
          className="h-full px-4 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Minimize"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => window.electronAPI?.windowControls.maximize()}
          className="h-full px-4 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Maximize"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={() => window.electronAPI?.windowControls.close()}
          className="h-full px-4 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
