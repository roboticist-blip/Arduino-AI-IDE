import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Check, X, AlertCircle, Zap, Cpu, GitBranch, Upload } from 'lucide-react';

export default function ApiKeyModal({ onClose }) {
  const [key, setKey]     = useState('');
  const [show, setShow]   = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep]   = useState('welcome'); // welcome | key

  useEffect(() => {
    const stored = localStorage.getItem('anthropic_api_key') || '';
    setKey(stored);
    // Skip welcome if they already have a key (they're changing it)
    if (stored) setStep('key');
  }, []);

  const handleSave = () => {
    if (!key.trim()) return;
    localStorage.setItem('anthropic_api_key', key.trim());
    setSaved(true);
    setTimeout(() => { onClose?.(); }, 900);
  };

  const handleSkip = () => {
    // Allow using the app without a key — they'll see the banner
    onClose?.();
  };

  const handleClear = () => {
    localStorage.removeItem('anthropic_api_key');
    setKey('');
  };

  const isValid = key.startsWith('sk-ant-') || key.startsWith('sk-');

  // ── Welcome screen ─────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center z-50 p-6">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-2xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Zap size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-text-primary tracking-tight">
                <span className="text-accent-cyan" style={{ textShadow: '0 0 30px rgba(0,212,255,0.4)' }}>Arduino</span>
                <span className="text-white">AI</span>
                <span className="text-text-muted text-3xl ml-2 font-normal">IDE</span>
              </h1>
              <p className="text-text-secondary mt-2 text-lg">
                Describe your project → get working hardware + code in seconds
              </p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '✨', label: 'AI Generation', desc: 'Prompt → full project' },
              { icon: '📌', label: 'Pin Selector', desc: 'Optimal pin assignments' },
              { icon: '🔌', label: 'Schematic', desc: 'Visual wiring diagram' },
              { icon: '⬆️', label: 'Direct Upload', desc: 'Flash via Web Serial' },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-2xl bg-bg-panel border border-bg-border text-left">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-semibold text-text-primary">{f.label}</div>
                <div className="text-xs text-text-muted mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={() => setStep('key')}
              className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent-cyan text-bg-primary font-bold text-lg hover:bg-cyan-300 active:scale-[0.98] transition-all shadow-xl shadow-cyan-500/30"
            >
              <Key size={20} /> Get Started — Add API Key
            </button>
            <button
              onClick={handleSkip}
              className="block mx-auto text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip for now (AI features won't work)
            </button>
          </div>

          <p className="text-xs text-text-muted">
            Powered by{' '}
            <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
              Claude AI
            </a>
            {' '}· Open source ·{' '}
            <a href="https://github.com/roboticist-blip/Arduino-AI-IDE" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
              GitHub
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── API Key screen ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-panel border border-bg-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Key size={16} className="text-purple-400" />
            </div>
            <div>
              <div className="font-semibold text-text-primary">Anthropic API Key</div>
              <div className="text-xs text-text-muted">Required to power AI features</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info box */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Your key is stored <strong className="text-text-primary">only in your browser</strong> (localStorage).
              It travels to Anthropic's servers through our secure proxy — never exposed in client-side logs.
              Get a free key at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                className="text-accent-cyan hover:underline inline-flex items-center gap-0.5 font-medium">
                console.anthropic.com <ExternalLink size={10} />
              </a>
            </p>
          </div>

          {/* Steps to get key */}
          <div className="space-y-2 text-xs text-text-muted">
            {[
              'Go to console.anthropic.com → sign up free',
              'Dashboard → API Keys → Create Key',
              'Copy and paste below',
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-bg-hover border border-bg-border flex items-center justify-center text-accent-cyan font-bold flex-shrink-0">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Key input */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">Your API Key</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isValid && handleSave()}
                placeholder="sk-ant-api03-..."
                autoFocus
                className="w-full bg-bg-tertiary border border-bg-border rounded-xl px-4 pr-10 py-3 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent-cyan/60 transition-colors"
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-0.5"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="h-5 mt-1">
              {key && !isValid && (
                <p className="text-xs text-accent-yellow flex items-center gap-1">
                  <AlertCircle size={11} /> Key should start with "sk-ant-"
                </p>
              )}
              {key && isValid && (
                <p className="text-xs text-accent-green flex items-center gap-1">
                  <Check size={11} /> Looks good!
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {key && (
              <button onClick={handleClear}
                className="px-3 py-2.5 rounded-xl text-xs text-text-muted hover:text-accent-red hover:bg-red-500/10 transition-colors border border-bg-border">
                Clear
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isValid || saved}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-cyan text-bg-primary font-semibold text-sm hover:bg-cyan-300 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              {saved
                ? <><Check size={15} /> Saved! Loading...</>
                : <><Key size={15} /> Save & Start Building</>}
            </button>
          </div>

          <button onClick={handleSkip} className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors pt-1">
            Skip — I'll add it later
          </button>
        </div>
      </div>
    </div>
  );
}
