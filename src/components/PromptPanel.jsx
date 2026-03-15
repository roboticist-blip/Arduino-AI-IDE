import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Lightbulb, Zap, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import useStore from '../hooks/useStore';
import { generateFullProject } from '../services/aiService';
import toast from 'react-hot-toast';

const EXAMPLE_PROMPTS = [
  "Build a weather station that reads temperature, humidity, and pressure from BME280 sensor and displays data on an OLED screen",
  "Create an automatic plant watering system that monitors soil moisture and activates a pump when soil is dry",
  "Make a Bluetooth-controlled RGB LED strip with smooth color transitions and brightness control",
  "Design a motion-activated security camera with IR sensor, buzzer alarm, and email notifications",
  "Build a smart home controller with multiple relay modules to control lights and fans via smartphone",
  "Create a line-following robot with IR sensors and DC motors with PID control",
  "Make an ultrasonic parking sensor with LED bar graph and buzzer that beeps faster when closer",
  "Build a MIDI controller with multiple potentiometers and buttons for music production",
];

export default function PromptPanel() {
  const { project, setProject, aiState, setAIState, setCode, setSchematic, addLibrary, setActiveTab, addConsoleLog } = useStore();
  const [prompt, setPrompt] = useState(project.prompt || '');
  const [result, setResult] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your project first!');
      return;
    }

    const board = project.selectedBoard;
    setProject({ prompt });
    setAIState({ isGenerating: true, stage: 'analyzing', progress: 0, messages: [] });
    setResult(null);

    try {
      const data = await generateFullProject(prompt, board, ({ stage, message, progress }) => {
        setAIState({ isGenerating: true, stage, progress, messages: [] });
        addConsoleLog(`[AI] ${message}`);
      });

      // Apply results
      setCode(data.code);
      setSchematic(data.schematic || {});
      data.libraries?.forEach((lib) => addLibrary(lib));
      setProject({ name: data.analysis?.projectName || project.name, description: data.analysis?.summary || '' });

      setResult(data);
      setAIState({ isGenerating: false, stage: 'done', progress: 100 });
      toast.success('Project generated successfully!');
    } catch (err) {
      console.error(err);
      setAIState({ isGenerating: false, stage: 'error', progress: 0 });
      toast.error(`Generation failed: ${err.message}`);
      addConsoleLog(`[ERROR] ${err.message}`);
    }
  };

  const { isGenerating, stage, progress } = aiState;

  const stageLabels = {
    analyzing: '🔍 Analyzing project requirements...',
    libraries: '📦 Selecting libraries...',
    pins: '📌 Assigning optimal pins...',
    schematic: '🔌 Generating wiring diagram...',
    code: '💻 Writing Arduino code...',
    done: '✅ Generation complete!',
    error: '❌ Generation failed',
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-4xl mx-auto w-full px-6 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-accent-cyan text-xs font-medium mb-4">
            <Sparkles size={12} />
            AI-Powered Arduino Development
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Describe Your <span className="text-accent-cyan text-glow-cyan">Arduino Project</span>
          </h1>
          <p className="text-text-secondary text-sm max-w-xl mx-auto">
            From prompt to upload — AI selects pins, generates schematics, writes code, and picks libraries.
          </p>
        </div>

        {/* Prompt Input */}
        <div className="relative mb-6">
          <div className={`rounded-2xl border-2 transition-all overflow-hidden
            ${isGenerating ? 'border-accent-cyan/50 shadow-lg shadow-cyan-500/10' : 'border-bg-border hover:border-bg-hover focus-within:border-accent-cyan/50'}`}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handleGenerate(); }}
              placeholder="Describe your Arduino project in detail...&#10;&#10;Example: Build a temperature and humidity monitor using DHT22 sensor that displays readings on 16x2 LCD and logs data to SD card every 30 seconds"
              disabled={isGenerating}
              rows={5}
              className="w-full bg-bg-secondary text-text-primary placeholder-text-muted px-4 pt-4 pb-2 resize-none focus:outline-none text-sm leading-relaxed font-sans"
            />

            {/* Board & Generate Row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border-t border-bg-border">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                <span>Board: <span className="text-text-secondary">{project.selectedBoard?.name}</span></span>
              </div>
              <div className="flex-1" />
              <span className="text-xs text-text-muted">Ctrl+Enter to generate</span>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-cyan text-bg-primary font-semibold text-sm
                  hover:bg-cyan-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
              >
                {isGenerating
                  ? <Loader size={14} className="animate-spin" />
                  : <Sparkles size={14} />}
                {isGenerating ? 'Generating...' : 'Generate Project'}
              </button>
            </div>
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mb-6 p-4 rounded-xl bg-bg-panel border border-bg-border animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <Loader size={16} className="text-accent-cyan animate-spin" />
              <span className="text-sm text-text-primary font-medium">
                {stageLabels[stage] || 'Generating...'}
              </span>
              <span className="ml-auto text-xs font-mono text-accent-cyan">{progress}%</span>
            </div>
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Generation Results Summary */}
        {result && !isGenerating && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/5 border border-green-500/20 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-accent-green mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-text-primary mb-1">{result.analysis?.projectName || 'Project Generated!'}</div>
                <p className="text-sm text-text-secondary mb-3">{result.analysis?.summary}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {[
                    { label: 'Difficulty', value: result.analysis?.difficulty },
                    { label: 'Est. Time', value: result.analysis?.estimatedTime },
                    { label: 'Libraries', value: `${result.libraries?.length || 0} selected` },
                    { label: 'Components', value: `${result.analysis?.components?.length || 0} parts` },
                  ].map((item) => (
                    <div key={item.label} className="bg-bg-tertiary rounded-lg p-2">
                      <div className="text-xs text-text-muted">{item.label}</div>
                      <div className="text-sm font-medium text-text-primary capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>

                {result.pinAssignments?.warnings?.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-3">
                    <AlertCircle size={13} className="text-accent-yellow mt-0.5" />
                    <div className="text-xs text-text-secondary">
                      {result.pinAssignments.warnings.map((w, i) => <div key={i}>{w}</div>)}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('code')} className="px-3 py-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs hover:bg-accent-cyan/20 transition-colors flex items-center gap-1">
                    View Code <ArrowRight size={11} />
                  </button>
                  <button onClick={() => setActiveTab('schematic')} className="px-3 py-1.5 rounded-lg bg-bg-hover text-text-secondary text-xs hover:text-text-primary transition-colors flex items-center gap-1">
                    View Schematic <ArrowRight size={11} />
                  </button>
                  <button onClick={() => setActiveTab('libraries')} className="px-3 py-1.5 rounded-lg bg-bg-hover text-text-secondary text-xs hover:text-text-primary transition-colors flex items-center gap-1">
                    Libraries <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example Prompts */}
        {!isGenerating && !result && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-accent-yellow" />
              <span className="text-sm text-text-secondary font-medium">Example Projects</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="text-left p-3 rounded-xl border border-bg-border bg-bg-panel hover:border-cyan-500/30 hover:bg-bg-hover transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <Zap size={12} className="text-accent-cyan mt-0.5 flex-shrink-0 group-hover:text-accent-green transition-colors" />
                    <p className="text-xs text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">
                      {ex}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
