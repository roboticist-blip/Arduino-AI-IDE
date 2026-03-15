import React, { useRef, useEffect } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import useStore from '../hooks/useStore';

export default function ConsolePanel() {
  const { consoleLogs, toggleConsole, addConsoleLog } = useStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const getLogColor = (text) => {
    if (text.includes('[ERROR]')) return 'text-accent-red';
    if (text.includes('[UPLOAD]') || text.includes('[COMPIL')) return 'text-accent-orange';
    if (text.includes('[AI]')) return 'text-accent-cyan';
    if (text.includes('[SERIAL]')) return 'text-accent-green';
    if (text.includes('complete') || text.includes('success')) return 'text-accent-green';
    return 'text-text-secondary';
  };

  return (
    <div className="h-40 flex flex-col bg-bg-secondary border-t border-bg-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-bg-border bg-bg-tertiary">
        <span className="text-xs font-medium text-text-secondary">Console</span>
        <span className="badge badge-cyan text-xs">{consoleLogs.length}</span>
        <div className="flex-1" />
        <button
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="Clear console"
          onClick={() => useStore.setState({ consoleLogs: [] })}
        >
          <Trash2 size={12} />
        </button>
        <button onClick={toggleConsole} className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* Log content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-0.5">
        {consoleLogs.length === 0 ? (
          <div className="text-text-muted">No console output yet.</div>
        ) : (
          consoleLogs.map((log, i) => (
            <div key={i} className={`flex gap-2 ${getLogColor(log.text)}`}>
              <span className="text-text-muted opacity-50 w-16 flex-shrink-0 select-none">
                {new Date(log.time).toLocaleTimeString()}
              </span>
              <span>{log.text}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
