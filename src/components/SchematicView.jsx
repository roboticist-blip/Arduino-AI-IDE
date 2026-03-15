import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Cpu, Plus, Trash2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import useStore from '../hooks/useStore';
import { ARDUINO_BOARDS, PIN_COLORS, COMPONENT_TEMPLATES } from '../data/arduinoData';
import toast from 'react-hot-toast';

// ─── Custom Node: Arduino Board ──────────────────────────────────
function ArduinoBoardNode({ data }) {
  const board = ARDUINO_BOARDS.find((b) => b.id === data.boardId) || ARDUINO_BOARDS[0];

  return (
    <div className="bg-bg-panel border-2 border-cyan-500/50 rounded-xl p-3 min-w-48 shadow-lg shadow-cyan-500/10">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-bg-border">
        <div className="w-6 h-6 rounded bg-accent-cyan/20 flex items-center justify-center">
          <Cpu size={12} className="text-accent-cyan" />
        </div>
        <div>
          <div className="text-xs font-bold text-text-primary">{board.name}</div>
          <div className="text-xs text-text-muted">{board.mcu}</div>
        </div>
      </div>

      {/* Pin Grid */}
      <div className="grid grid-cols-2 gap-1">
        {/* Digital Pins */}
        <div>
          <div className="text-xs text-text-muted mb-1">Digital</div>
          {Array.from({ length: Math.min(board.digitalPins, 14) }, (_, i) => (
            <div key={i} className="flex items-center gap-1 mb-0.5">
              <div
                className="w-3 h-3 rounded-full border text-center text-xs flex items-center justify-center cursor-pointer hover:scale-125 transition-transform"
                style={{
                  backgroundColor: board.pwmPins?.includes(i) ? PIN_COLORS.pwm + '33' : PIN_COLORS.digital + '22',
                  borderColor: board.pwmPins?.includes(i) ? PIN_COLORS.pwm : PIN_COLORS.digital,
                }}
                title={board.pwmPins?.includes(i) ? `D${i} (PWM)` : `D${i}`}
              />
              <span className="text-xs font-mono" style={{ color: board.pwmPins?.includes(i) ? PIN_COLORS.pwm : PIN_COLORS.digital }}>
                D{i}{board.pwmPins?.includes(i) ? '~' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Analog Pins */}
        <div>
          <div className="text-xs text-text-muted mb-1">Analog</div>
          {board.analogPins?.map((pin) => (
            <div key={pin} className="flex items-center gap-1 mb-0.5">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: PIN_COLORS.analog + '22', borderColor: PIN_COLORS.analog }}
              />
              <span className="text-xs font-mono" style={{ color: PIN_COLORS.analog }}>{pin}</span>
            </div>
          ))}
          <div className="mt-1">
            <div className="text-xs text-text-muted mb-1">Power</div>
            {['3.3V', '5V', 'GND', 'VIN'].map((p) => (
              <div key={p} className="flex items-center gap-1 mb-0.5">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{
                    backgroundColor: p === 'GND' ? PIN_COLORS.ground + '22' : PIN_COLORS.power + '22',
                    borderColor: p === 'GND' ? PIN_COLORS.ground : PIN_COLORS.power,
                  }}
                />
                <span className="text-xs font-mono" style={{ color: p === 'GND' ? PIN_COLORS.ground : PIN_COLORS.power }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Special pins */}
      <div className="mt-2 pt-2 border-t border-bg-border grid grid-cols-2 gap-1">
        {board.specialPins?.i2c && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIN_COLORS.i2c }} />
            <span className="text-xs" style={{ color: PIN_COLORS.i2c }}>SDA:{board.specialPins.i2c.sda}</span>
          </div>
        )}
        {board.specialPins?.i2c && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIN_COLORS.i2c }} />
            <span className="text-xs" style={{ color: PIN_COLORS.i2c }}>SCL:{board.specialPins.i2c.scl}</span>
          </div>
        )}
        {board.specialPins?.spi && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIN_COLORS.spi }} />
            <span className="text-xs" style={{ color: PIN_COLORS.spi }}>MOSI:{board.specialPins.spi.mosi}</span>
          </div>
        )}
        {board.specialPins?.spi && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIN_COLORS.spi }} />
            <span className="text-xs" style={{ color: PIN_COLORS.spi }}>MISO:{board.specialPins.spi.miso}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom Node: Component ───────────────────────────────────────
function ComponentNode({ data, selected }) {
  const template = COMPONENT_TEMPLATES.find((c) => c.id === data.componentType) || COMPONENT_TEMPLATES[0];

  return (
    <div className={`bg-bg-panel rounded-xl p-3 min-w-32 shadow-lg border-2 transition-all
      ${selected ? 'border-accent-cyan shadow-cyan-500/20' : 'border-bg-border'}`}
      style={{ borderColor: selected ? '#00d4ff' : template.color + '44' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{template.icon}</span>
        <div>
          <div className="text-xs font-medium text-text-primary">{data.label}</div>
          <div className="text-xs text-text-muted">{template.category}</div>
        </div>
      </div>
      <div className="space-y-1">
        {template.pins.map((pin) => (
          <div key={pin} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: template.color }} />
            <span className="text-xs font-mono text-text-muted">{pin}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = {
  arduinoBoard: ArduinoBoardNode,
  component: ComponentNode,
};

// ─── Default Board Node ────────────────────────────────────────────
function buildDefaultNodes(board) {
  return [
    {
      id: 'arduino',
      type: 'arduinoBoard',
      position: { x: 300, y: 150 },
      data: { label: board.name, boardId: board.id },
      draggable: true,
    },
  ];
}

export default function SchematicView() {
  const { schematic, setSchematic, project } = useStore();
  const board = project.selectedBoard;

  const defaultNodes = buildDefaultNodes(board);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    schematic?.nodes?.length ? schematic.nodes : defaultNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(schematic?.edges || []);
  const [selectedComp, setSelectedComp] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#00d4ff', strokeWidth: 2 },
      label: params.sourceHandle || '',
      labelStyle: { fill: '#8b949e', fontSize: 10 },
      labelBgStyle: { fill: '#161b22' },
    }, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('component');
      if (!raw) return;

      const comp = JSON.parse(raw);
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 60,
        y: event.clientY - bounds.top - 40,
      };

      const newNode = {
        id: `${comp.id}_${Date.now()}`,
        type: 'component',
        position,
        data: { label: comp.name, componentType: comp.id, pins: comp.pins },
        draggable: true,
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added ${comp.name} to schematic`);
    },
    [setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSaveSchematic = () => {
    setSchematic({ nodes, edges });
    toast.success('Schematic saved!');
  };

  const handleReset = () => {
    setNodes(defaultNodes);
    setEdges([]);
    setSchematic({ nodes: defaultNodes, edges: [] });
    toast.success('Schematic reset');
  };

  const handleExportSVG = () => {
    toast.success('Export feature coming soon!');
  };

  const deleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.id === 'arduino'));
    setEdges((eds) => eds.filter((e) => !e.selected));
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border-b border-bg-border">
        <span className="text-xs text-text-muted">Drag components from the left sidebar into the canvas</span>
        <div className="flex-1" />
        <button onClick={deleteSelected}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-accent-red hover:bg-red-500/10 transition-colors">
          <Trash2 size={12} /> Delete Selected
        </button>
        <button onClick={handleExportSVG}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
          <Download size={12} /> Export
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
          <RefreshCw size={12} /> Reset
        </button>
        <button onClick={handleSaveSchematic}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs hover:bg-accent-cyan/20 transition-colors">
          Save Schematic
        </button>
      </div>

      {/* Pin Legend */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-bg-secondary/50 border-b border-bg-border overflow-x-auto">
        {Object.entries(PIN_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 whitespace-nowrap">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-text-muted capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 overflow-hidden" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ background: '#0a0e14' }}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#00d4ff', strokeWidth: 2 },
          }}
          connectionLineStyle={{ stroke: '#00d4ff', strokeWidth: 2 }}
          deleteKeyCode="Delete"
        >
          <Background color="#1e2a3a" gap={20} size={1} variant="dots" />
          <Controls
            style={{
              background: '#1a2030',
              border: '1px solid #1e2a3a',
              borderRadius: '8px',
            }}
          />
          <MiniMap
            style={{
              background: '#0d1117',
              border: '1px solid #1e2a3a',
              borderRadius: '8px',
            }}
            nodeColor={(node) => node.type === 'arduinoBoard' ? '#00d4ff33' : '#1a2030'}
          />
          <Panel position="top-right">
            <div className="bg-bg-panel border border-bg-border rounded-lg p-2 text-xs text-text-muted max-w-48">
              <div className="font-medium text-text-secondary mb-1">💡 Tips</div>
              <div>• Drag parts from sidebar</div>
              <div>• Connect pins by dragging</div>
              <div>• Delete key removes selected</div>
              <div>• Scroll to zoom</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Pin Assignments Table (if AI generated) */}
      {schematic?.pinAssignments?.assignments?.length > 0 && (
        <div className="border-t border-bg-border bg-bg-secondary max-h-40 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-medium text-text-secondary border-b border-bg-border">
            AI Pin Assignments
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left px-3 py-1">Component</th>
                <th className="text-left px-3 py-1">Pin</th>
                <th className="text-left px-3 py-1">Arduino</th>
                <th className="text-left px-3 py-1">Type</th>
                <th className="text-left px-3 py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {schematic.pinAssignments.assignments.flatMap((a) =>
                a.pins.map((p, i) => (
                  <tr key={`${a.component}-${i}`} className="border-t border-bg-border/50 hover:bg-bg-hover">
                    <td className="px-3 py-1 text-text-primary">{a.component}</td>
                    <td className="px-3 py-1 font-mono text-text-secondary">{p.componentPin}</td>
                    <td className="px-3 py-1 font-mono" style={{ color: PIN_COLORS[p.type] || '#8b949e' }}>{p.arduinoPin}</td>
                    <td className="px-3 py-1">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: (PIN_COLORS[p.type] || '#8b949e') + '22', color: PIN_COLORS[p.type] || '#8b949e' }}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-text-muted max-w-40 truncate">{p.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
