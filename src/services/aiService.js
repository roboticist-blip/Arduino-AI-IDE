/**
 * Arduino AI Service — proxy-aware routing
 *
 * Routing:
 *  - Deployed host  → /api/claude  (our serverless/Express proxy)
 *  - Local dev      → direct Anthropic with dangerous-browser-access header
 */

const MODEL = 'claude-sonnet-4-20250514';
const PROXY_URL  = '/api/claude';
const DIRECT_URL = 'https://api.anthropic.com/v1/messages';

function getApiKey() {
  return (
    import.meta.env?.VITE_ANTHROPIC_API_KEY ||
    localStorage.getItem('anthropic_api_key') ||
    ''
  );
}

// Cache /api/health probe per page load
let _proxyAvailable = null;
async function isProxyAvailable() {
  if (_proxyAvailable !== null) return _proxyAvailable;
  try {
    const r = await fetch('/api/health', { method: 'GET' });
    _proxyAvailable = r.ok;
  } catch {
    _proxyAvailable = false;
  }
  return _proxyAvailable;
}

async function callClaude(systemPrompt, userPrompt, maxTokens = 4096) {
  const apiKey  = getApiKey();
  const useProxy = await isProxyAvailable();

  if (!useProxy && (!apiKey || apiKey === 'sk-ant-your-key-here')) {
    throw new Error('No API key configured. Click 🔑 in the top bar to add your Anthropic key.');
  }

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };

  const headers = { 'Content-Type': 'application/json' };
  let url;

  if (useProxy) {
    url = PROXY_URL;
    if (apiKey) headers['X-User-Api-Key'] = apiKey;
  } else {
    url = DIRECT_URL;
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content?.find((c) => c.type === 'text')?.text || '';
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  return JSON.parse(clean);
}

export async function analyzeProject(prompt, board) {
  const system = `You are an expert Arduino hardware engineer and firmware developer.
Analyze the user's Arduino project description and extract structured information.
Always respond with valid JSON only, no extra text.`;
  const user = `Analyze this Arduino project: "${prompt}"
Board: ${board.name} (${board.mcu})
Return JSON:
{
  "projectName": "Short project name",
  "summary": "2-3 sentence summary",
  "components": ["list of hardware components"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": "e.g. 1-2 hours",
  "powerRequirements": "voltage and current estimate",
  "keyFeatures": ["feature1"],
  "tags": ["tag1"]
}`;
  return parseJSON(await callClaude(system, user, 1000));
}

export async function selectPins(prompt, board, components) {
  const system = `You are an Arduino hardware engineer. Select optimal pins. Respond with valid JSON only.`;
  const boardInfo = `Board: ${board.name}\nDigital: 0-${board.digitalPins-1}\nPWM: ${board.pwmPins.join(', ')}\nAnalog: ${board.analogPins.join(', ')}\nI2C SDA/SCL: ${board.specialPins?.i2c?.sda}/${board.specialPins?.i2c?.scl}\nSPI MOSI/MISO/SCK: ${board.specialPins?.spi?.mosi}/${board.specialPins?.spi?.miso}/${board.specialPins?.spi?.sck}`;
  const user = `Project: "${prompt}"\nComponents: ${components.join(', ')}\n${boardInfo}\n\nReturn JSON:\n{"assignments":[{"component":"name","type":"type","pins":[{"componentPin":"pin","arduinoPin":"D2","pinNumber":2,"type":"digital|analog|pwm|i2c|spi|power|ground","description":"reason"}],"notes":"wiring note"}],"powerNotes":"power notes","warnings":["warning"]}`;
  return parseJSON(await callClaude(system, user, 2000));
}

export async function generateCode(prompt, board, pinAssignments, libraries) {
  const system = `You are a senior Arduino firmware engineer. Write clean, well-commented, complete, compilable Arduino sketches. Output ONLY code — no markdown, no explanation.`;
  const pinDefs = pinAssignments?.assignments?.map(a => a.pins.filter(p=>p.type!=='power'&&p.type!=='ground').map(p=>`// ${a.component} - ${p.componentPin}: ${p.arduinoPin}`).join('\n')).join('\n') || '';
  const libList = libraries.map(l => l.include).join('\n') || '// Standard libraries';
  const user = `Write a complete Arduino sketch for: "${prompt}"\nBoard: ${board.name}\nLibraries:\n${libList}\nPins:\n${pinDefs}\n\nRequirements: all pins as constants at top, proper setup/loop, Serial debugging, full comments.`;
  return await callClaude(system, user, 4096);
}

export async function generateSchematic(prompt, board, pinAssignments) {
  const system = `You are an electronics engineer. Generate React Flow circuit JSON only.`;
  const user = `Project: "${prompt}"\nBoard: ${board.name}\nPins: ${JSON.stringify(pinAssignments?.assignments||[])}\n\nReturn React Flow JSON:\n{"nodes":[{"id":"arduino","type":"arduinoBoard","data":{"label":"${board.name}","boardId":"${board.id}"},"position":{"x":400,"y":250}}],"edges":[],"layout":"horizontal"}\n\nPlace board in center, components around it.`;
  return parseJSON(await callClaude(system, user, 2000));
}

export async function selectLibraries(prompt, components) {
  const system = `You are an Arduino library expert. Select best libraries. Respond with valid JSON only.`;
  const user = `Project: "${prompt}"\nComponents: ${components.join(', ')}\nReturn JSON:\n{"libraries":[{"name":"Library","id":"id","reason":"why","include":"#include <Lib.h>","priority":"required|optional","installCommand":"manager name"}]}`;
  return parseJSON(await callClaude(system, user, 1000));
}

export async function generateFullProject(prompt, board, onProgress) {
  let progress = 0;
  const tick = (stage, message, weight) => {
    progress += weight;
    onProgress?.({ stage, message, progress: Math.min(progress, 99) });
  };

  tick('analyzing', 'Analyzing project requirements...', 0);
  const analysis = await analyzeProject(prompt, board);
  tick('analyzing', `Project identified: ${analysis.projectName}`, 15);

  const libData = await selectLibraries(prompt, analysis.components);
  tick('libraries', 'Libraries selected', 15);

  const pins = await selectPins(prompt, board, analysis.components);
  tick('pins', 'Pin assignments complete', 20);

  let schematic = { nodes: [], edges: [], layout: 'horizontal' };
  try {
    schematic = await generateSchematic(prompt, board, pins);
  } catch (e) { console.warn('Schematic fallback:', e.message); }
  tick('schematic', 'Wiring diagram generated', 20);

  const code = await generateCode(prompt, board, pins, libData.libraries || []);
  onProgress?.({ stage: 'done', message: 'Generation complete!', progress: 100 });

  return { analysis, libraries: libData.libraries || [], pinAssignments: pins, schematic, code };
}

export async function explainCode(code, selectedText) {
  return await callClaude(
    'You are an Arduino tutor. Explain code clearly for makers.',
    `Explain this Arduino code:\n\`\`\`cpp\n${selectedText || code}\n\`\`\`\nUse bullet points, be concise.`,
    800
  );
}

export async function fixCodeError(code, errorMessage) {
  return await callClaude(
    'You are an Arduino debugger. Fix errors. Return ONLY corrected code, no markdown.',
    `Fix this error:\n${errorMessage}\n\nCode:\n${code}`,
    4096
  );
}

export async function suggestImprovements(code, board) {
  return parseJSON(await callClaude(
    'You are a senior Arduino engineer doing code review.',
    `Review for ${board.name}:\n${code}\nReturn JSON: {"improvements":[{"type":"performance|safety|readability|memory","description":"...","fix":"code"}]}`,
    1500
  ));
}

export async function chatWithAI(messages, board, code) {
  const apiKey  = getApiKey();
  const useProxy = await isProxyAvailable();
  const system = `You are an expert Arduino engineer in ArduinoAI IDE. Board: ${board.name} (${board.mcu}). Code context: ${code?.substring(0,400)}...`;
  const headers = { 'Content-Type': 'application/json' };
  let url;
  if (useProxy) { url = PROXY_URL; if (apiKey) headers['X-User-Api-Key'] = apiKey; }
  else { url = DIRECT_URL; headers['x-api-key'] = apiKey; headers['anthropic-version'] = '2023-06-01'; headers['anthropic-dangerous-direct-browser-access'] = 'true'; }
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: messages.map(m=>({role:m.role,content:m.content})) }) });
  if (!r.ok) throw new Error(`API error ${r.status}`);
  const d = await r.json();
  return d.content?.find(c=>c.type==='text')?.text || '';
}
