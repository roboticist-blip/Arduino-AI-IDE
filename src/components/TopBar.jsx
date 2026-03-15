import React, { useState } from 'react';
import { 
  Zap, Save, FolderOpen, Upload, Key,
  Terminal, ChevronDown, Wifi, WifiOff,
  Download, RefreshCw
} from 'lucide-react';
import useStore from '../hooks/useStore';
import toast from 'react-hot-toast';

export default function TopBar({ onOpenApiKey }) {
  const { project, activeTab, setActiveTab, consoleOpen, toggleConsole, isSerialConnected } = useStore();
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const tabs = [
    { id: 'prompt',    label: 'AI Prompt',      icon: '✨' },
    { id: 'schematic', label: 'Schematic',       icon: '🔌' },
    { id: 'code',      label: 'Code Editor',     icon: '</>' },
    { id: 'libraries', label: 'Libraries',       icon: '📦' },
    { id: 'upload',    label: 'Upload',          icon: '⬆' },
    { id: 'monitor',   label: 'Serial Monitor',  icon: '📟' },
  ];

  const handleSave = () => {
    const state = useStore.getState();
    const saveData = {
      project: state.project,
      code: state.code,
      schematic: state.schematic,
      selectedLibraries: state.selectedLibraries,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.project.name.replace(/\s+/g, '_')}.aidproject`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Project saved!');
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.aidproject,.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const store = useStore.getState();
          if (data.project) store.setProject(data.project);
          if (data.code) store.setCode(data.code);
          if (data.schematic) store.setSchematic(data.schematic);
          if (data.selectedLibraries) data.selectedLibraries.forEach((lib) => store.addLibrary(lib));
          toast.success('Project loaded!');
        } catch {
          toast.error('Failed to load project file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportCode = () => {
    const code = useStore.getState().code;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${useStore.getState().project.name.replace(/\s+/g, '_')}.ino`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arduino sketch exported!');
  };

  return (
    <div className="flex flex-col border-b border-bg-border bg-bg-secondary">
      {/* Top Row */}
      <div className="flex items-center h-12 px-4 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide text-text-primary hidden sm:block">
            <span className="text-accent-cyan">Arduino</span>
            <span className="text-text-secondary">AI</span>
            <span className="ml-1 text-xs text-text-muted font-normal">IDE</span>
          </span>
        </div>

        {/* Project Name / Menu */}
        <div className="flex items-center gap-1 relative">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            onClick={() => setShowProjectMenu(!showProjectMenu)}
          >
            <span className="max-w-32 truncate">{project.name}</span>
            <ChevronDown size={12} />
          </button>

          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-bg-panel border border-bg-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-up">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                onClick={() => { handleSave(); setShowProjectMenu(false); }}>
                <Save size={13} /> Save Project
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                onClick={() => { handleLoad(); setShowProjectMenu(false); }}>
                <FolderOpen size={13} /> Load Project
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                onClick={() => { handleExportCode(); setShowProjectMenu(false); }}>
                <Download size={13} /> Export .ino
              </button>
              <div className="border-t border-bg-border" />
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-red hover:bg-bg-hover transition-colors"
                onClick={() => { useStore.getState().resetProject(); setShowProjectMenu(false); toast.success('Project reset'); }}>
                <RefreshCw size={13} /> New Project
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Board Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-bg-border">
          <div className="w-2 h-2 rounded-full bg-accent-cyan" />
          <span className="text-xs text-text-secondary font-mono hidden md:block">
            {project.selectedBoard?.name || 'No Board'}
          </span>
        </div>

        {/* Serial Status */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs
          ${isSerialConnected
            ? 'bg-green-500/10 border-green-500/30 text-accent-green'
            : 'bg-bg-tertiary border-bg-border text-text-muted'}`}>
          {isSerialConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:block">{isSerialConnected ? 'Connected' : 'No Port'}</span>
        </div>

        {/* Console toggle */}
        <button
          onClick={toggleConsole}
          className={`p-2 rounded transition-colors tooltip ${consoleOpen ? 'text-accent-cyan bg-cyan-500/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
          data-tip="Toggle Console"
        >
          <Terminal size={15} />
        </button>

        {/* API Key button */}
        <button
          onClick={onOpenApiKey}
          className="p-2 rounded transition-colors tooltip text-text-muted hover:text-purple-400 hover:bg-purple-500/10"
          data-tip="API Key Settings"
        >
          <Key size={15} />
        </button>

        {/* Upload CTA */}
        <button
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 transition-colors text-xs font-medium"
        >
          <Upload size={12} />
          Upload
        </button>
      </div>

      {/* Tab Row */}
      <div className="flex items-center px-4 gap-1 h-9 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'text-accent-cyan border-b-2 border-accent-cyan bg-bg-tertiary'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
