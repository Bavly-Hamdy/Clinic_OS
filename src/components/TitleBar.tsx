import { Minus, Square, X, ActivitySquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const [isElectron, setIsElectron] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    // Check if we are running inside Electron by looking for our custom API
    if (window.electronAPI && window.electronAPI.windowControls) {
      setIsElectron(true);
      // Set a CSS variable so any fixed element (navbar, dialogs, etc.) can offset themselves
      document.documentElement.style.setProperty('--titlebar-height', '32px');
      document.body.style.paddingTop = '32px';
      
      return () => {
        document.documentElement.style.removeProperty('--titlebar-height');
        document.body.style.paddingTop = '0px';
      };
    }
  }, []);

  // If not running in Electron (e.g., normal web browser), don't render the title bar
  if (!isElectron) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[32px] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center select-none z-[9999]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Brand & Logo & Navigation */}
      <div className="flex items-center gap-2 px-2 h-full">
        {/* Global Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Back"
        >
          {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-2 ms-1">
          <ActivitySquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
            Clinic Hub
          </span>
        </div>
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
