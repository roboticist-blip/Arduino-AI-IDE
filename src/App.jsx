import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ConsolePanel from './components/ConsolePanel';
import ApiKeyModal from './components/ApiKeyModal';
import useStore from './hooks/useStore';
import { Key } from 'lucide-react';

export default function App() {
  const consoleOpen = useStore((s) => s.consoleOpen);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const envKey = import.meta.env?.VITE_ANTHROPIC_API_KEY;
    const storedKey = localStorage.getItem('anthropic_api_key');
    const key = envKey || storedKey;
    const valid = key && key !== 'sk-ant-your-key-here' && key.length > 20;
    setHasApiKey(!!valid);
    if (!valid) setShowApiKey(true);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-primary">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2030',
            color: '#e6edf3',
            border: '1px solid #1e2a3a',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#0a0e14' } },
          error: { iconTheme: { primary: '#ff4757', secondary: '#0a0e14' } },
        }}
      />

      {showApiKey && <ApiKeyModal onClose={() => setShowApiKey(false)} />}

      <TopBar onOpenApiKey={() => setShowApiKey(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {!hasApiKey && !showApiKey && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/20 text-xs text-accent-yellow">
              <Key size={12} />
              <span>No API key configured — AI features won't work.</span>
              <button onClick={() => setShowApiKey(true)} className="ml-1 underline hover:text-white transition-colors">
                Add API key
              </button>
            </div>
          )}
          <MainContent />
          {consoleOpen && <ConsolePanel />}
        </div>
      </div>
    </div>
  );
}
