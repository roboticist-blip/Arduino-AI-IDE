import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Copy, Download, Wand2, MessageSquare, Bug, 
  CheckCircle, Loader, ChevronUp, ChevronDown,
  RotateCcw, Settings2
} from 'lucide-react';
import useStore from '../hooks/useStore';
import { explainCode, fixCodeError, suggestImprovements } from '../services/aiService';
import toast from 'react-hot-toast';

const ARDUINO_SNIPPETS = [
  { label: 'pinMode', insert: 'pinMode(pin, OUTPUT);' },
  { label: 'digitalWrite', insert: 'digitalWrite(pin, HIGH);' },
  { label: 'digitalRead', insert: 'int val = digitalRead(pin);' },
  { label: 'analogWrite', insert: 'analogWrite(pin, value); // 0-255' },
  { label: 'analogRead', insert: 'int val = analogRead(A0); // 0-1023' },
  { label: 'delay', insert: 'delay(1000); // ms' },
  { label: 'millis', insert: 'unsigned long t = millis();' },
  { label: 'Serial.begin', insert: 'Serial.begin(9600);' },
  { label: 'Serial.println', insert: 'Serial.println(value);' },
  { label: 'for loop', insert: 'for (int i = 0; i < 10; i++) {\n  \n}' },
  { label: 'if/else', insert: 'if (condition) {\n  \n} else {\n  \n}' },
  { label: 'while', insert: 'while (condition) {\n  \n}' },
  { label: 'map()', insert: 'int result = map(value, fromLow, fromHigh, toLow, toHigh);' },
  { label: 'constrain()', insert: 'int result = constrain(value, min, max);' },
  { label: 'attachInterrupt', insert: 'attachInterrupt(digitalPinToInterrupt(pin), ISR, RISING);' },
];

export default function CodeEditor() {
  const { code, setCode, project, selectedLibraries, addConsoleLog } = useStore();
  const [aiPanel, setAiPanel] = useState(null); // null | 'explain' | 'fix' | 'improve'
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Arduino language tokens
    monaco.languages.register({ id: 'arduino' });
    monaco.languages.setMonarchTokensProvider('arduino', {
      keywords: [
        'void', 'int', 'long', 'float', 'double', 'char', 'bool', 'boolean',
        'byte', 'word', 'String', 'if', 'else', 'for', 'while', 'do', 'return',
        'break', 'continue', 'switch', 'case', 'default', 'const', 'static',
        '#include', '#define', '#ifndef', '#endif', 'setup', 'loop',
        'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'true', 'false',
        'Serial', 'Wire', 'SPI', 'PROGMEM', 'nullptr', 'null',
      ],
      tokenizer: {
        root: [
          [/#\w+/, 'keyword'],
          [/[a-zA-Z_]\w*(?=\()/, 'entity.name.function'],
          [/\b(HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|true|false|null|nullptr)\b/, 'constant'],
          [/\b(int|long|float|double|char|bool|boolean|byte|word|void|String|unsigned)\b/, 'keyword.type'],
          [/\b(if|else|for|while|do|return|break|continue|switch|case|default|const|static)\b/, 'keyword.control'],
          [/\/\/.*/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/'[^\\']'/, 'string'],
          [/\d+\.\d+([eE][-+]?\d+)?[fF]?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          [/[{}()\[\]]/, 'delimiter.bracket'],
          [/[<>](?!@symbols)/, 'delimiter'],
        ],
        comment: [
          [/[^/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[/*]/, 'comment'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
        ],
      },
    });

    // Set Arduino theme
    monaco.editor.defineTheme('arduino-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'keyword.type', foreground: '56b6c2' },
        { token: 'keyword.control', foreground: 'c678dd' },
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'number.float', foreground: 'd19a66' },
        { token: 'number.hex', foreground: 'd19a66' },
        { token: 'constant', foreground: 'e5c07b' },
        { token: 'entity.name.function', foreground: '61afef' },
        { token: 'delimiter.bracket', foreground: 'abb2bf' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#abb2bf',
        'editorLineNumber.foreground': '#495162',
        'editorCursor.foreground': '#00d4ff',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#161b22',
        'editorIndentGuide.background': '#1e2a3a',
        'editorIndentGuide.activeBackground': '#2d3748',
        'scrollbarSlider.background': '#2d374855',
        'scrollbarSlider.hoverBackground': '#4a557855',
      },
    });

    monaco.editor.setTheme('arduino-dark');

    // Auto-complete snippets
    monaco.languages.registerCompletionItemProvider('arduino', {
      provideCompletionItems: (model, position) => {
        return {
          suggestions: ARDUINO_SNIPPETS.map((s) => ({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insert,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: s.insert,
          })),
        };
      },
    });
  };

  const getSelectedText = () => {
    const editor = editorRef.current;
    if (!editor) return '';
    const selection = editor.getSelection();
    return editor.getModel().getValueInRange(selection);
  };

  const handleAIAction = async (action) => {
    setAiPanel(action);
    setAiResponse('');
    setAiLoading(true);

    try {
      let response = '';
      const selected = getSelectedText();

      if (action === 'explain') {
        response = await explainCode(code, selected);
      } else if (action === 'improve') {
        const data = await suggestImprovements(code, project.selectedBoard);
        response = data.improvements
          ?.map((imp) => `**[${imp.type.toUpperCase()}]** ${imp.description}\n\`\`\`cpp\n${imp.fix}\n\`\`\``)
          .join('\n\n') || 'No improvements suggested.';
      }

      setAiResponse(response);
      addConsoleLog(`[AI] ${action} completed`);
    } catch (err) {
      toast.error(`AI action failed: ${err.message}`);
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.ino`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sketch downloaded!');
  };

  const insertSnippet = (snippet) => {
    const editor = editorRef.current;
    if (!editor) return;
    const position = editor.getPosition();
    editor.executeEdits('snippet', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      text: snippet,
    }]);
    editor.focus();
    setShowSnippets(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border-b border-bg-border">
        {/* Library includes indicator */}
        {selectedLibraries.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-xs text-accent-cyan">{selectedLibraries.length} lib</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Snippets */}
        <div className="relative">
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <Settings2 size={13} />
            Snippets
            {showSnippets ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showSnippets && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-bg-panel border border-bg-border rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
              {ARDUINO_SNIPPETS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => insertSnippet(s.insert)}
                  className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                >
                  <div className="font-mono text-accent-cyan">{s.label}</div>
                  <div className="text-text-muted truncate mt-0.5">{s.insert.split('\n')[0]}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1 border border-bg-border rounded px-1">
          <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="text-text-muted hover:text-text-primary px-1 text-xs">A-</button>
          <span className="text-xs text-text-muted font-mono w-5 text-center">{fontSize}</span>
          <button onClick={() => setFontSize(f => Math.min(24, f + 1))} className="text-text-muted hover:text-text-primary px-1 text-xs">A+</button>
        </div>

        {/* AI Actions */}
        <button onClick={() => handleAIAction('explain')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-secondary hover:text-accent-cyan hover:bg-cyan-500/10 transition-colors">
          <MessageSquare size={13} /> Explain
        </button>
        <button onClick={() => handleAIAction('improve')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-secondary hover:text-accent-green hover:bg-green-500/10 transition-colors">
          <Wand2 size={13} /> Improve
        </button>

        {/* Copy/Download */}
        <button onClick={handleCopy} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors tooltip" data-tip="Copy code">
          <Copy size={14} />
        </button>
        <button onClick={handleDownload} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors tooltip" data-tip="Download .ino">
          <Download size={14} />
        </button>
      </div>

      {/* Editor + AI Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Monaco Editor */}
        <div className={`flex-1 overflow-hidden ${aiPanel ? 'w-3/5' : 'w-full'}`}>
          <Editor
            height="100%"
            language="arduino"
            theme="arduino-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            onMount={handleEditorMount}
            options={{
              fontSize,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              renderLineHighlight: 'all',
              cursorBlinking: 'phase',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              suggest: { showSnippets: true },
              quickSuggestions: true,
              parameterHints: { enabled: true },
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

        {/* AI Response Panel */}
        {aiPanel && (
          <div className="w-2/5 flex flex-col border-l border-bg-border bg-bg-secondary">
            <div className="flex items-center justify-between px-3 py-2 border-b border-bg-border">
              <span className="text-xs font-medium text-text-primary capitalize">
                {aiPanel === 'explain' ? '💡 Code Explanation' : '✨ Improvements'}
              </span>
              <button onClick={() => setAiPanel(null)} className="text-text-muted hover:text-text-primary text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Loader size={14} className="animate-spin text-accent-cyan" />
                  Analyzing code...
                </div>
              ) : (
                <div className="prose prose-sm text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">
                  {aiResponse || 'No response yet.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
