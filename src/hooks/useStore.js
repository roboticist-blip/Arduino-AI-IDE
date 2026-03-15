import { create } from 'zustand';
import { ARDUINO_BOARDS } from '../data/arduinoData';

const useStore = create((set, get) => ({
  // ─── Project State ───────────────────────────────
  project: {
    name: 'Untitled Project',
    prompt: '',
    description: '',
    selectedBoard: ARDUINO_BOARDS[0],
    createdAt: new Date().toISOString(),
  },

  // ─── Code Editor ────────────────────────────────
  code: `// ArduinoAI IDE - Generated Code
// Describe your project to get started

void setup() {
  Serial.begin(9600);
  Serial.println("ArduinoAI IDE Ready!");
}

void loop() {
  // Your code here
  delay(1000);
}`,

  // ─── Schematic / Wiring ─────────────────────────
  schematic: {
    nodes: [],
    edges: [],
    pinAssignments: {},
  },

  // ─── Libraries ──────────────────────────────────
  selectedLibraries: [],

  // ─── Serial Monitor ─────────────────────────────
  serialLog: [],
  isSerialConnected: false,
  serialPort: null,
  serialBaudRate: 9600,

  // ─── Upload ─────────────────────────────────────
  uploadState: {
    status: 'idle', // idle | compiling | uploading | success | error
    progress: 0,
    message: '',
    logs: [],
  },

  // ─── AI Generation ──────────────────────────────
  aiState: {
    isGenerating: false,
    stage: '', // analyzing | pins | schematic | code | libraries | done
    progress: 0,
    messages: [],
  },

  // ─── UI State ───────────────────────────────────
  activeTab: 'prompt', // prompt | schematic | code | libraries | upload
  sidebarTab: 'boards', // boards | components | libraries
  theme: 'dark',
  consoleOpen: false,
  consoleLogs: [],

  // ─── Actions ────────────────────────────────────

  setCode: (code) => set({ code }),

  setProject: (updates) =>
    set((s) => ({ project: { ...s.project, ...updates } })),

  setSelectedBoard: (board) =>
    set((s) => ({ project: { ...s.project, selectedBoard: board } })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  setSchematic: (schematic) =>
    set((s) => ({ schematic: { ...s.schematic, ...schematic } })),

  addLibrary: (lib) =>
    set((s) => {
      const exists = s.selectedLibraries.find((l) => l.id === lib.id);
      if (exists) return s;
      return { selectedLibraries: [...s.selectedLibraries, lib] };
    }),

  removeLibrary: (libId) =>
    set((s) => ({
      selectedLibraries: s.selectedLibraries.filter((l) => l.id !== libId),
    })),

  addSerialLog: (entry) =>
    set((s) => ({
      serialLog: [...s.serialLog.slice(-500), { ...entry, timestamp: new Date().toISOString() }],
    })),

  clearSerialLog: () => set({ serialLog: [] }),

  setSerialConnected: (status) => set({ isSerialConnected: status }),

  setSerialBaudRate: (rate) => set({ serialBaudRate: rate }),

  setUploadState: (updates) =>
    set((s) => ({ uploadState: { ...s.uploadState, ...updates } })),

  addUploadLog: (log) =>
    set((s) => ({
      uploadState: {
        ...s.uploadState,
        logs: [...s.uploadState.logs.slice(-100), { text: log, time: new Date().toISOString() }],
      },
    })),

  setAIState: (updates) =>
    set((s) => ({ aiState: { ...s.aiState, ...updates } })),

  addAIMessage: (msg) =>
    set((s) => ({
      aiState: {
        ...s.aiState,
        messages: [...s.aiState.messages, { ...msg, id: Date.now() }],
      },
    })),

  clearAIMessages: () =>
    set((s) => ({ aiState: { ...s.aiState, messages: [] } })),

  addConsoleLog: (log) =>
    set((s) => ({
      consoleLogs: [...s.consoleLogs.slice(-200), { text: log, time: new Date().toISOString() }],
      consoleOpen: true,
    })),

  toggleConsole: () => set((s) => ({ consoleOpen: !s.consoleOpen })),

  // Reset project
  resetProject: () =>
    set({
      project: {
        name: 'Untitled Project',
        prompt: '',
        description: '',
        selectedBoard: ARDUINO_BOARDS[0],
        createdAt: new Date().toISOString(),
      },
      code: `void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  // Your code\n}`,
      schematic: { nodes: [], edges: [], pinAssignments: {} },
      selectedLibraries: [],
      uploadState: { status: 'idle', progress: 0, message: '', logs: [] },
      aiState: { isGenerating: false, stage: '', progress: 0, messages: [] },
    }),
}));

export default useStore;
