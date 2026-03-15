import React, { useState } from 'react';
import { Search, Plus, X, ExternalLink, ChevronDown, ChevronUp, BookOpen, Check, Star } from 'lucide-react';
import useStore from '../hooks/useStore';
import { ARDUINO_LIBRARIES } from '../data/arduinoData';
import toast from 'react-hot-toast';

export default function LibrariesPanel() {
  const { selectedLibraries, addLibrary, removeLibrary, code, setCode } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // all | selected

  const categories = ['All', ...new Set(ARDUINO_LIBRARIES.map((l) => l.category))];

  const filtered = ARDUINO_LIBRARIES.filter((lib) => {
    const matchSearch = lib.name.toLowerCase().includes(search.toLowerCase()) ||
      lib.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || lib.category === filterCategory;
    const matchView = viewMode === 'all' || selectedLibraries.some((s) => s.id === lib.id);
    return matchSearch && matchCat && matchView;
  });

  const handleToggle = (lib) => {
    const isSelected = selectedLibraries.some((l) => l.id === lib.id);
    if (isSelected) {
      removeLibrary(lib.id);
      // Remove #include from code
      const newCode = code.replace(`${lib.include}\n`, '').replace(lib.include, '');
      setCode(newCode);
      toast.success(`Removed ${lib.name}`);
    } else {
      addLibrary(lib);
      // Prepend #include to code
      if (!code.includes(lib.include)) {
        setCode(`${lib.include}\n${code}`);
      }
      toast.success(`Added ${lib.name}`);
    }
  };

  const generateIncludeBlock = () => {
    return selectedLibraries.map((l) => l.include).join('\n');
  };

  const copyIncludes = () => {
    navigator.clipboard.writeText(generateIncludeBlock());
    toast.success('Include statements copied!');
  };

  return (
    <div className="flex h-full bg-bg-primary">
      {/* Left: Library Browser */}
      <div className="flex flex-col flex-1 overflow-hidden border-r border-bg-border">
        {/* Search & Filters */}
        <div className="p-3 space-y-2 bg-bg-secondary border-b border-bg-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search libraries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-tertiary border border-bg-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 py-1 text-xs rounded transition-colors ${viewMode === 'all' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}`}
            >
              All Libraries ({ARDUINO_LIBRARIES.length})
            </button>
            <button
              onClick={() => setViewMode('selected')}
              className={`flex-1 py-1 text-xs rounded transition-colors ${viewMode === 'selected' ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}`}
            >
              Selected ({selectedLibraries.length})
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-bg-hover text-text-primary border border-bg-border'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Library List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">
              No libraries match your search
            </div>
          )}

          {filtered.map((lib) => {
            const isSelected = selectedLibraries.some((l) => l.id === lib.id);
            const isExpanded = expanded === lib.id;

            return (
              <div
                key={lib.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isSelected
                    ? 'border-accent-cyan/30 bg-cyan-500/5'
                    : 'border-bg-border bg-bg-panel hover:border-bg-hover'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{lib.name}</span>
                      {lib.official && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-cyan-500/10 text-accent-cyan border border-cyan-500/20">
                          <Check size={9} /> Official
                        </span>
                      )}
                      <span className="text-xs text-text-muted">v{lib.version}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">{lib.description}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded bg-bg-hover text-text-muted">{lib.category}</span>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : lib.id)}
                      className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => handleToggle(lib)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-accent-cyan text-bg-primary hover:bg-red-400'
                          : 'bg-bg-hover text-text-secondary hover:bg-accent-cyan/20 hover:text-accent-cyan border border-bg-border'
                      }`}
                    >
                      {isSelected ? <><X size={11} /> Remove</> : <><Plus size={11} /> Add</>}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-bg-border/50 pt-3">
                    {/* Include statement */}
                    <div>
                      <div className="text-xs text-text-muted mb-1">Include Statement</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-xs text-accent-green bg-bg-secondary rounded-lg px-3 py-1.5 block">
                          {lib.include}
                        </code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(lib.include); toast.success('Copied!'); }}
                          className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors text-xs"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    {/* Functions */}
                    {lib.functions && (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Key Functions</div>
                        <div className="flex flex-wrap gap-1">
                          {lib.functions.map((fn) => (
                            <span key={fn} className="font-mono text-xs px-2 py-0.5 rounded bg-bg-secondary text-accent-cyan border border-bg-border">
                              .{fn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Example */}
                    {lib.example && (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Quick Example</div>
                        <pre className="text-xs font-mono text-text-secondary bg-bg-secondary rounded-lg p-3 overflow-x-auto border border-bg-border">
                          {lib.example}
                        </pre>
                      </div>
                    )}

                    {/* Install instruction */}
                    {!lib.official && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <BookOpen size={12} className="text-accent-yellow flex-shrink-0" />
                        <p className="text-xs text-text-muted">
                          Install via Arduino Library Manager: <span className="text-text-secondary">Sketch → Include Library → Manage Libraries → Search "<strong>{lib.name}</strong>"</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Libraries Panel */}
      <div className="w-64 flex flex-col bg-bg-secondary">
        <div className="p-3 border-b border-bg-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Selected Libraries</span>
            <span className="badge badge-cyan">{selectedLibraries.length}</span>
          </div>
          {selectedLibraries.length > 0 && (
            <button
              onClick={copyIncludes}
              className="w-full py-1.5 rounded-lg text-xs bg-bg-hover hover:bg-bg-panel text-text-secondary hover:text-text-primary transition-colors border border-bg-border"
            >
              📋 Copy #includes
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {selectedLibraries.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs">
              <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
              No libraries selected yet.
              <br />Add libraries from the list.
            </div>
          ) : (
            <div className="space-y-1">
              {selectedLibraries.map((lib) => (
                <div key={lib.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-bg-border group">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">{lib.name}</div>
                    <div className="font-mono text-xs text-accent-green truncate">{lib.include}</div>
                  </div>
                  <button
                    onClick={() => handleToggle(lib)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-accent-red transition-all"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated includes block */}
        {selectedLibraries.length > 0 && (
          <div className="border-t border-bg-border p-3">
            <div className="text-xs text-text-muted mb-1">Generated #includes</div>
            <pre className="text-xs font-mono text-accent-green bg-bg-tertiary rounded-lg p-2 overflow-x-auto border border-bg-border max-h-32">
              {generateIncludeBlock()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
