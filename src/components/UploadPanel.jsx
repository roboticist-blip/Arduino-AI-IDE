import React, { useState, useEffect } from 'react';
import { 
  Usb, Upload, CheckCircle, AlertCircle, Loader, 
  RefreshCw, Terminal, ChevronRight, Wifi, Zap,
  AlertTriangle, Play
} from 'lucide-react';
import useStore from '../hooks/useStore';
import { 
  isWebSerialSupported, requestPort, connectSerial, 
  disconnectSerial, uploadSketch, validateSketch,
  BAUD_RATES
} from '../services/uploadService';
import toast from 'react-hot-toast';

export default function UploadPanel() {
  const { 
    project, code, uploadState, setUploadState, addUploadLog,
    isSerialConnected, setSerialConnected, addConsoleLog
  } = useStore();

  const [port, setPort] = useState(null);
  const [selectedBaud, setSelectedBaud] = useState(115200);
  const [validation, setValidation] = useState(null);

  const webSerialSupported = isWebSerialSupported();

  useEffect(() => {
    // Run validation whenever code changes
    if (code) {
      const result = validateSketch(code);
      setValidation(result);
    }
  }, [code]);

  const handleConnect = async () => {
    if (!webSerialSupported) {
      toast.error('Web Serial not supported. Use Chrome or Edge browser.');
      return;
    }

    try {
      const selectedPort = await requestPort();
      await connectSerial(selectedPort, selectedBaud);
      setPort(selectedPort);
      setSerialConnected(true);
      toast.success('Board connected!');
      addConsoleLog('[SERIAL] Board connected successfully');
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`);
      addConsoleLog(`[ERROR] ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSerial();
      setPort(null);
      setSerialConnected(false);
      toast.success('Disconnected');
      addConsoleLog('[SERIAL] Disconnected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpload = async () => {
    if (!validation?.valid) {
      toast.error('Please fix code errors before uploading');
      return;
    }

    setUploadState({ status: 'compiling', progress: 0, message: 'Starting...', logs: [] });
    addConsoleLog('[UPLOAD] Starting upload process...');

    try {
      await uploadSketch(code, project.selectedBoard, port, ({ status, progress, message }) => {
        setUploadState({ status, progress, message });
        addUploadLog(message);
        addConsoleLog(`[${status.toUpperCase()}] ${message}`);
      });

      setUploadState({ status: 'success', progress: 100, message: 'Upload complete!' });
      toast.success('Sketch uploaded successfully!');
    } catch (err) {
      setUploadState({ status: 'error', progress: 0, message: err.message });
      toast.error(`Upload failed: ${err.message}`);
      addConsoleLog(`[ERROR] Upload failed: ${err.message}`);
    }
  };

  const { status, progress, message, logs } = uploadState;
  const isUploading = status === 'compiling' || status === 'uploading';

  const statusConfig = {
    idle: { color: 'text-text-muted', icon: null, bg: '' },
    compiling: { color: 'text-accent-cyan', icon: Loader, bg: 'bg-cyan-500/5 border-cyan-500/20' },
    uploading: { color: 'text-accent-orange', icon: Loader, bg: 'bg-orange-500/5 border-orange-500/20' },
    success: { color: 'text-accent-green', icon: CheckCircle, bg: 'bg-green-500/5 border-green-500/20' },
    error: { color: 'text-accent-red', icon: AlertCircle, bg: 'bg-red-500/5 border-red-500/20' },
  };

  const cfg = statusConfig[status] || statusConfig.idle;

  return (
    <div className="flex h-full bg-bg-primary overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Upload to Board</h2>
          <p className="text-sm text-text-secondary">Compile and upload your sketch directly from the browser</p>
        </div>

        {/* Web Serial Warning */}
        {!webSerialSupported && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <AlertTriangle size={18} className="text-accent-yellow flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-text-primary text-sm mb-1">Web Serial API Not Available</div>
              <p className="text-xs text-text-secondary">
                Direct upload requires Chrome or Edge browser with Web Serial API support.
                You can still download the .ino file and upload manually via Arduino IDE.
              </p>
              <button
                onClick={() => {
                  const blob = new Blob([code], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `${project.name.replace(/\s+/g, '_')}.ino`; a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Sketch downloaded!');
                }}
                className="mt-2 flex items-center gap-1 text-xs text-accent-cyan hover:underline"
              >
                Download .ino file <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Board & Port Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Board */}
          <div className="p-4 rounded-xl bg-bg-panel border border-bg-border">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent-cyan" />
              <span className="text-sm font-medium text-text-primary">Selected Board</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-text-primary font-medium">{project.selectedBoard?.name}</div>
              <div className="text-xs text-text-muted font-mono">{project.selectedBoard?.fqbn}</div>
              <div className="flex gap-3 text-xs">
                <span className="text-text-muted">MCU: <span className="text-text-secondary">{project.selectedBoard?.mcu}</span></span>
                <span className="text-text-muted">Clock: <span className="text-text-secondary">{project.selectedBoard?.clockSpeed}</span></span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-text-muted">Flash: <span className="text-text-secondary">{project.selectedBoard?.flash}</span></span>
                <span className="text-text-muted">SRAM: <span className="text-text-secondary">{project.selectedBoard?.sram}</span></span>
              </div>
            </div>
          </div>

          {/* Port */}
          <div className="p-4 rounded-xl bg-bg-panel border border-bg-border">
            <div className="flex items-center gap-2 mb-3">
              <Usb size={16} className="text-accent-green" />
              <span className="text-sm font-medium text-text-primary">Serial Port</span>
            </div>
            <div className="space-y-3">
              {/* Baud Rate */}
              <div>
                <label className="text-xs text-text-muted block mb-1">Baud Rate</label>
                <select
                  value={selectedBaud}
                  onChange={(e) => setSelectedBaud(Number(e.target.value))}
                  className="w-full bg-bg-tertiary border border-bg-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50"
                >
                  {BAUD_RATES.map((b) => (
                    <option key={b} value={b}>{b.toLocaleString()} baud</option>
                  ))}
                </select>
              </div>

              {/* Connect/Disconnect */}
              {!isSerialConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={!webSerialSupported}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm hover:bg-accent-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Usb size={14} /> Connect Board
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-accent-green">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    Board connected
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-1.5 rounded-lg text-xs text-text-muted hover:text-accent-red hover:bg-red-500/10 transition-colors border border-bg-border"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sketch Validation */}
        {validation && (
          <div className={`p-4 rounded-xl border ${validation.valid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {validation.valid
                ? <CheckCircle size={15} className="text-accent-green" />
                : <AlertCircle size={15} className="text-accent-red" />}
              <span className="text-sm font-medium text-text-primary">
                {validation.valid ? 'Sketch looks valid' : `${validation.errors.length} error(s) found`}
              </span>
            </div>
            {validation.errors.map((e, i) => (
              <div key={i} className="text-xs text-accent-red flex items-center gap-1 mt-1">
                <ChevronRight size={11} /> {e}
              </div>
            ))}
            {validation.warnings.map((w, i) => (
              <div key={i} className="text-xs text-accent-yellow flex items-center gap-1 mt-1">
                <AlertTriangle size={11} /> {w}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading || !validation?.valid}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all
            bg-accent-cyan text-bg-primary hover:bg-cyan-300 active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
        >
          {isUploading
            ? <><Loader size={16} className="animate-spin" /> {status === 'compiling' ? 'Compiling...' : 'Uploading...'}</>
            : <><Upload size={16} /> Upload Sketch</>}
        </button>

        {/* Progress */}
        {status !== 'idle' && (
          <div className={`p-4 rounded-xl border ${cfg.bg} animate-fade-in-up`}>
            <div className="flex items-center gap-2 mb-2">
              {cfg.icon && <cfg.icon size={15} className={`${cfg.color} ${isUploading ? 'animate-spin' : ''}`} />}
              <span className={`text-sm font-medium ${cfg.color}`}>{message}</span>
              <span className="ml-auto text-xs font-mono text-text-muted">{progress}%</span>
            </div>
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Upload Log */}
        {logs.length > 0 && (
          <div className="rounded-xl bg-bg-secondary border border-bg-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-bg-border">
              <Terminal size={13} className="text-text-muted" />
              <span className="text-xs text-text-secondary font-medium">Upload Log</span>
              <button
                onClick={() => setUploadState({ ...uploadState, logs: [] })}
                className="ml-auto text-xs text-text-muted hover:text-text-primary"
              >
                Clear
              </button>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto font-mono text-xs text-text-secondary space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-text-muted">{new Date(log.time).toLocaleTimeString()}</span>
                  <span className={log.text.includes('error') || log.text.includes('Error') ? 'text-accent-red' : 
                    log.text.includes('complete') || log.text.includes('100%') ? 'text-accent-green' : 'text-text-secondary'}>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Upload Instructions */}
        <div className="p-4 rounded-xl bg-bg-panel border border-bg-border">
          <div className="font-medium text-text-primary text-sm mb-3 flex items-center gap-2">
            <Play size={14} className="text-accent-cyan" />
            Manual Upload Instructions
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            {[
              'Download the .ino sketch file using the Code Editor → Download button',
              'Open Arduino IDE (or Arduino IDE 2.x) on your computer',
              'Install required libraries via Sketch → Include Library → Manage Libraries',
              `Select your board: Tools → Board → "${project.selectedBoard?.name}"`,
              'Select the correct port: Tools → Port',
              'Click Upload (→) or press Ctrl+U',
            ].map((step, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-mono text-accent-cyan font-bold w-4 flex-shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
