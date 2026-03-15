import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Usb, Send, Trash2, Download, Pause, Play, 
  Settings, ChevronDown, Wifi, WifiOff
} from 'lucide-react';
import useStore from '../hooks/useStore';
import { 
  requestPort, connectSerial, disconnectSerial, 
  startSerialRead, writeSerial, BAUD_RATES,
  isWebSerialSupported
} from '../services/uploadService';
import toast from 'react-hot-toast';

const LINE_ENDINGS = [
  { label: 'No Line Ending', value: '' },
  { label: 'Newline (\\n)', value: '\n' },
  { label: 'Carriage Return (\\r)', value: '\r' },
  { label: 'Both NL & CR', value: '\r\n' },
];

export default function SerialMonitor() {
  const { isSerialConnected, setSerialConnected, serialLog, addSerialLog, clearSerialLog, serialBaudRate, setSerialBaudRate } = useStore();
  const [port, setPort] = useState(null);
  const [input, setInput] = useState('');
  const [autoscroll, setAutoscroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lineEnding, setLineEnding] = useState('\n');
  const [baud, setBaud] = useState(9600);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [displayLog, setDisplayLog] = useState([]);
  const logEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isPaused) {
      setDisplayLog([...serialLog]);
    }
  }, [serialLog, isPaused]);

  useEffect(() => {
    if (autoscroll && !isPaused) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayLog, autoscroll, isPaused]);

  const handleConnect = async () => {
    if (!isWebSerialSupported()) {
      toast.error('Web Serial API not supported. Use Chrome or Edge.');
      return;
    }

    try {
      const selectedPort = await requestPort();
      await connectSerial(selectedPort, baud);
      setPort(selectedPort);
      setSerialConnected(true);
      setSerialBaudRate(baud);

      await startSerialRead(
        (data) => {
          addSerialLog({ type: 'rx', text: data });
        },
        (err) => {
          addSerialLog({ type: 'error', text: `Error: ${err}` });
        }
      );

      toast.success('Serial monitor connected!');
      addSerialLog({ type: 'system', text: `--- Connected at ${baud} baud ---` });
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSerial();
      setPort(null);
      setSerialConnected(false);
      addSerialLog({ type: 'system', text: '--- Disconnected ---' });
      toast.success('Disconnected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !isSerialConnected) return;
    try {
      await writeSerial(input + lineEnding);
      addSerialLog({ type: 'tx', text: input });
      setInput('');
    } catch (err) {
      toast.error(`Send failed: ${err.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleExportLog = () => {
    const content = displayLog.map((e) =>
      `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.type.toUpperCase()}: ${e.text}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'serial_log.txt'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Log exported!');
  };

  const getEntryStyle = (type) => {
    switch (type) {
      case 'rx': return 'text-text-primary';
      case 'tx': return 'text-accent-cyan';
      case 'system': return 'text-text-muted italic';
      case 'error': return 'text-accent-red';
      default: return 'text-text-secondary';
    }
  };

  const getEntryPrefix = (type) => {
    switch (type) {
      case 'rx': return '← ';
      case 'tx': return '→ ';
      case 'system': return '  ';
      case 'error': return '✗ ';
      default: return '  ';
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border-b border-bg-border flex-wrap">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs
          ${isSerialConnected
            ? 'bg-green-500/10 border-green-500/30 text-accent-green'
            : 'bg-bg-tertiary border-bg-border text-text-muted'}`}>
          {isSerialConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isSerialConnected ? `Connected — ${baud} baud` : 'Disconnected'}
        </div>

        {/* Baud rate */}
        {!isSerialConnected && (
          <select
            value={baud}
            onChange={(e) => setBaud(Number(e.target.value))}
            className="bg-bg-tertiary border border-bg-border rounded px-2 py-1 text-xs text-text-secondary focus:outline-none"
          >
            {BAUD_RATES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        {/* Connect / Disconnect */}
        {!isSerialConnected ? (
          <button onClick={handleConnect}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs hover:bg-accent-cyan/20 transition-colors">
            <Usb size={12} /> Connect
          </button>
        ) : (
          <button onClick={handleDisconnect}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-accent-red hover:bg-red-500/10 transition-colors">
            <Usb size={12} /> Disconnect
          </button>
        )}

        <div className="flex-1" />

        {/* Timestamps toggle */}
        <button
          onClick={() => setShowTimestamps(!showTimestamps)}
          className={`text-xs px-2 py-1 rounded transition-colors ${showTimestamps ? 'text-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}
        >
          Timestamps
        </button>

        {/* Pause */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`p-1.5 rounded transition-colors ${isPaused ? 'text-accent-orange bg-orange-500/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>

        {/* Clear */}
        <button onClick={clearSerialLog} className="p-1.5 rounded text-text-muted hover:text-accent-red hover:bg-red-500/10 transition-colors" title="Clear">
          <Trash2 size={14} />
        </button>

        {/* Export */}
        <button onClick={handleExportLog} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors" title="Export log">
          <Download size={14} />
        </button>
      </div>

      {/* Log Area */}
      <div
        className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed bg-bg-secondary"
        onScroll={(e) => {
          const el = e.target;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          setAutoscroll(atBottom);
        }}
      >
        {displayLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Usb size={32} className="mb-3 opacity-20" />
            <p className="text-sm">Serial monitor is empty</p>
            <p className="text-xs mt-1">Connect a board and data will appear here</p>
          </div>
        ) : (
          <>
            {displayLog.map((entry, i) => (
              <div key={i} className={`flex gap-2 hover:bg-bg-tertiary/30 px-1 rounded ${getEntryStyle(entry.type)}`}>
                {showTimestamps && entry.timestamp && (
                  <span className="text-text-muted opacity-50 select-none w-20 flex-shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                )}
                <span className="select-none opacity-60 w-4 flex-shrink-0">{getEntryPrefix(entry.type)}</span>
                <span className="break-all">{entry.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </>
        )}
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border-t border-bg-border">
        <select
          value={lineEnding}
          onChange={(e) => setLineEnding(e.target.value)}
          className="bg-bg-tertiary border border-bg-border rounded px-2 py-1.5 text-xs text-text-secondary focus:outline-none"
        >
          {LINE_ENDINGS.map((le) => <option key={le.label} value={le.value}>{le.label}</option>)}
        </select>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSerialConnected ? 'Type a message and press Enter...' : 'Connect a board to send data'}
          disabled={!isSerialConnected}
          className="flex-1 bg-bg-tertiary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 disabled:opacity-50 font-mono"
        />

        <button
          onClick={handleSend}
          disabled={!isSerialConnected || !input.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-cyan text-bg-primary text-sm font-medium hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={13} /> Send
        </button>
      </div>
    </div>
  );
}
