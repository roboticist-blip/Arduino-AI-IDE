import React, { useState } from 'react';
import { Cpu, Package, Wrench, ChevronRight, ChevronDown, Star, Check } from 'lucide-react';
import useStore from '../hooks/useStore';
import { ARDUINO_BOARDS, ARDUINO_LIBRARIES, COMPONENT_TEMPLATES } from '../data/arduinoData';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { sidebarTab, setSidebarTab, setSelectedBoard, project, selectedLibraries, addLibrary, removeLibrary } = useStore();
  const [expandedLib, setExpandedLib] = useState(null);
  const [boardSearch, setBoardSearch] = useState('');
  const [libSearch, setLibSearch] = useState('');

  const tabs = [
    { id: 'boards', label: 'Boards', icon: Cpu },
    { id: 'components', label: 'Parts', icon: Wrench },
    { id: 'libraries', label: 'Libraries', icon: Package },
  ];

  const filteredBoards = ARDUINO_BOARDS.filter((b) =>
    b.name.toLowerCase().includes(boardSearch.toLowerCase())
  );

  const filteredLibs = ARDUINO_LIBRARIES.filter((l) =>
    l.name.toLowerCase().includes(libSearch.toLowerCase()) ||
    l.category.toLowerCase().includes(libSearch.toLowerCase())
  );

  const libCategories = [...new Set(filteredLibs.map((l) => l.category))];

  return (
    <div className="w-56 flex flex-col bg-bg-secondary border-r border-bg-border overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-bg-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSidebarTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
              ${sidebarTab === t.id ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <t.icon size={14} className="mb-0.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Boards Tab */}
      {sidebarTab === 'boards' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search boards..."
              value={boardSearch}
              onChange={(e) => setBoardSearch(e.target.value)}
              className="w-full bg-bg-tertiary border border-bg-border rounded px-2 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {filteredBoards.map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  setSelectedBoard(board);
                  toast.success(`Board set to ${board.name}`);
                }}
                className={`w-full text-left p-2 rounded-lg border transition-all
                  ${project.selectedBoard?.id === board.id
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-text-primary'
                    : 'border-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{board.name}</span>
                  <div className="flex items-center gap-1">
                    {board.popular && <Star size={9} className="text-accent-yellow fill-current" />}
                    {project.selectedBoard?.id === board.id && <Check size={11} className="text-accent-cyan" />}
                  </div>
                </div>
                <div className="text-xs text-text-muted mt-0.5">{board.mcu}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-text-muted">{board.clockSpeed}</span>
                  <span className="text-xs text-text-muted">{board.flash}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Board Details */}
          {project.selectedBoard && (
            <div className="border-t border-bg-border p-2 bg-bg-tertiary">
              <div className="text-xs font-medium text-text-primary mb-1">{project.selectedBoard.name}</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['MCU', project.selectedBoard.mcu],
                  ['Clock', project.selectedBoard.clockSpeed],
                  ['Flash', project.selectedBoard.flash],
                  ['SRAM', project.selectedBoard.sram],
                  ['Voltage', project.selectedBoard.operatingVoltage],
                  ['Analog', project.selectedBoard.analogPins?.length],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-text-muted">{label}</div>
                    <div className="text-xs text-text-primary font-mono">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Components Tab */}
      {sidebarTab === 'components' && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-text-muted px-1 pb-2">Drag components to schematic</div>
          <div className="space-y-1">
            {COMPONENT_TEMPLATES.map((comp) => (
              <div
                key={comp.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('component', JSON.stringify(comp))}
                className="flex items-center gap-2 p-2 rounded-lg border border-bg-border hover:border-bg-hover bg-bg-tertiary hover:bg-bg-hover cursor-grab active:cursor-grabbing transition-all group"
              >
                <span className="text-lg">{comp.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text-primary truncate">{comp.name}</div>
                  <div className="text-xs text-text-muted">{comp.category}</div>
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: comp.color }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Libraries Tab */}
      {sidebarTab === 'libraries' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search libraries..."
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              className="w-full bg-bg-tertiary border border-bg-border rounded px-2 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>

          {/* Selected count */}
          {selectedLibraries.length > 0 && (
            <div className="mx-2 mb-2 px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-xs text-accent-cyan font-medium">{selectedLibraries.length} library selected</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {libCategories.map((cat) => (
              <div key={cat} className="mb-2">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-1 py-1.5 sticky top-0 bg-bg-secondary">
                  {cat}
                </div>
                {filteredLibs.filter((l) => l.category === cat).map((lib) => {
                  const isSelected = selectedLibraries.some((l) => l.id === lib.id);
                  const isExpanded = expandedLib === lib.id;

                  return (
                    <div key={lib.id} className={`rounded-lg border mb-1 overflow-hidden transition-all
                      ${isSelected ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-bg-border bg-bg-tertiary hover:border-bg-hover'}`}>
                      <div
                        className="flex items-center gap-2 p-2 cursor-pointer"
                        onClick={() => setExpandedLib(isExpanded ? null : lib.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-text-primary truncate">{lib.name}</span>
                            {lib.official && <span className="text-xs text-accent-cyan">✓</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                removeLibrary(lib.id);
                                toast.success(`Removed ${lib.name}`);
                              } else {
                                addLibrary(lib);
                                toast.success(`Added ${lib.name}`);
                              }
                            }}
                            className={`w-5 h-5 rounded flex items-center justify-center text-xs transition-colors
                              ${isSelected ? 'bg-accent-cyan text-bg-primary' : 'bg-bg-hover text-text-muted hover:text-text-primary'}`}
                          >
                            {isSelected ? '✓' : '+'}
                          </button>
                          {isExpanded ? <ChevronDown size={11} className="text-text-muted" /> : <ChevronRight size={11} className="text-text-muted" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-2 pb-2 space-y-1 border-t border-bg-border">
                          <p className="text-xs text-text-muted pt-1">{lib.description}</p>
                          <div className="font-mono text-xs text-accent-green bg-bg-secondary rounded px-2 py-1">{lib.include}</div>
                          {lib.functions && (
                            <div className="text-xs text-text-muted">
                              <div className="font-medium text-text-secondary mb-0.5">Functions:</div>
                              {lib.functions.slice(0, 4).map((f) => (
                                <div key={f} className="font-mono text-accent-cyan/80">.{f}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
