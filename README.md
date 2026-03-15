# ArduinoAI IDE 🤖⚡

> **AI-Powered Arduino Development Environment** — Describe your project in plain English and get complete pin assignments, wiring schematics, library selection, and production-ready code — all in one browser-based IDE.

![ArduinoAI IDE](https://img.shields.io/badge/ArduinoAI-IDE-00d4ff?style=flat-square&logo=arduino)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20AI-a855f7?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🧠 **AI Project Generation** | Describe your project → AI analyzes, designs, and codes everything |
| 📌 **Intelligent Pin Selection** | AI picks optimal pins based on component requirements and board specs |
| 🔌 **Visual Schematic Editor** | Drag-and-drop wiring diagram with React Flow canvas |
| 💻 **Monaco Code Editor** | Full-featured editor with Arduino syntax highlighting, autocomplete & snippets |
| 📦 **Library Manager** | Browse, search, and add official Arduino libraries with one click |
| ⬆️ **Direct Upload** | Upload sketches directly via Web Serial API (Chrome/Edge) |
| 📟 **Serial Monitor** | Full-featured serial monitor with send/receive, timestamps, and log export |
| 🔍 **AI Code Tools** | Explain code, suggest improvements, fix errors with AI assistance |
| 💾 **Project Save/Load** | Save entire projects as `.aidproject` files and reload them |
| 🖥️ **9 Official Boards** | Arduino Uno, Nano, Mega, Leonardo, Micro, MKR1000, Zero, Due, Portenta H7 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x  
- An **Anthropic API key** (Claude AI)

### Installation

```bash
# Clone the repository
git clone https://github.com/roboticist-blip/Arduino-AI-IDE.git
cd arduino-ai-ide

# Install dependencies
npm install

# Set your Anthropic API key
# Option 1: Environment variable
export ANTHROPIC_API_KEY=your_key_here

# Option 2: Create a .env file
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env

# Start the development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Project Structure

```
arduino-ai-ide/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite bundler config
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
│
├── public/
│   └── vite.svg
│
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root app component
    │
    ├── styles/
    │   └── globals.css           # Global CSS, Tailwind, animations
    │
    ├── data/
    │   └── arduinoData.js        # Boards, libraries & component database
    │
    ├── hooks/
    │   └── useStore.js           # Zustand global state management
    │
    ├── services/
    │   ├── aiService.js          # Claude AI API calls (generation, chat, etc.)
    │   └── uploadService.js      # Web Serial API + upload simulation
    │
    └── components/
        ├── TopBar.jsx            # Top navigation bar with tabs
        ├── Sidebar.jsx           # Left sidebar (boards/parts/libraries)
        ├── MainContent.jsx       # Tab router for main panels
        ├── PromptPanel.jsx       # AI prompt input & generation UI
        ├── CodeEditor.jsx        # Monaco editor with Arduino support
        ├── SchematicView.jsx     # React Flow wiring diagram
        ├── LibrariesPanel.jsx    # Full library browser & manager
        ├── UploadPanel.jsx       # Board connection & sketch upload
        ├── SerialMonitor.jsx     # Real-time serial communication
        └── ConsolePanel.jsx      # Bottom debug console
```

---

## 🧠 How AI Generation Works

The AI generation pipeline runs in 5 sequential steps, each calling the Claude API:

```
User Prompt
    │
    ▼
Step 1: analyzeProject()
    → Project name, components, difficulty, features
    │
    ▼
Step 2: selectLibraries()
    → Best libraries for the components detected
    │
    ▼
Step 3: selectPins()
    → Optimal pin assignments considering PWM, I2C, SPI, interrupts
    │
    ▼
Step 4: generateSchematic()
    → React Flow node/edge data for wiring diagram
    │
    ▼
Step 5: generateCode()
    → Complete, compilable Arduino .ino sketch
    │
    ▼
Complete Project ✅
```

Each step passes context from the previous step, ensuring coherent and conflict-free output.

---

## 🔌 Supported Boards

| Board | MCU | Flash | SRAM | Clock |
|-------|-----|-------|------|-------|
| Arduino Uno | ATmega328P | 32KB | 2KB | 16 MHz |
| Arduino Nano | ATmega328P | 32KB | 2KB | 16 MHz |
| Arduino Mega 2560 | ATmega2560 | 256KB | 8KB | 16 MHz |
| Arduino Leonardo | ATmega32u4 | 32KB | 2.5KB | 16 MHz |
| Arduino Micro | ATmega32u4 | 32KB | 2.5KB | 16 MHz |
| Arduino MKR1000 | SAMD21G | 256KB | 32KB | 48 MHz |
| Arduino Zero | SAMD21G18 | 256KB | 32KB | 48 MHz |
| Arduino Due | AT91SAM3X8E | 512KB | 96KB | 84 MHz |
| Arduino Portenta H7 | STM32H747XI | 2MB | 1MB | 480 MHz |

---

## 📦 Built-in Library Database

20+ official and community libraries across categories:

- **Communication**: Wire (I2C), SPI, SoftwareSerial
- **Display**: LiquidCrystal, LiquidCrystal_I2C, U8g2
- **Sensors**: DHT, OneWire, DallasTemperature, HCSR04, MPU6050, BMP280
- **Actuators**: Servo, Stepper
- **Wireless/IoT**: WiFi, ESP8266WiFi, PubSubClient (MQTT)
- **Storage**: SD, EEPROM
- **LEDs**: Adafruit NeoPixel
- **Timing**: TimerOne

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite 4** | Build tool & dev server |
| **Tailwind CSS 3** | Styling |
| **Zustand** | State management |
| **Monaco Editor** | Code editing (same as VS Code) |
| **React Flow** | Schematic/wiring diagram canvas |
| **Claude API** | AI generation (claude-sonnet-4) |
| **Web Serial API** | Direct board upload via browser |
| **react-hot-toast** | Notifications |

---

## ⚙️ Configuration

### API Key Setup

The app calls the Anthropic Claude API directly from the browser. Set your key via:

```js
// Option 1: Vite env variable (recommended)
// .env file:
VITE_ANTHROPIC_API_KEY=sk-ant-...

// Access in code:
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

> ⚠️ **Security Note**: For production use, proxy API calls through a backend server to keep your API key secret. The current implementation is intended for local/development use.

### Adding Custom Boards

Edit `src/data/arduinoData.js` and add to the `ARDUINO_BOARDS` array:

```js
{
  id: 'my_board',
  name: 'My Custom Board',
  fqbn: 'vendor:arch:boardname',
  mcu: 'ATmega328P',
  clockSpeed: '16 MHz',
  flash: '32KB',
  sram: '2KB',
  eeprom: '1KB',
  operatingVoltage: '5V',
  inputVoltage: '7-12V',
  digitalPins: 14,
  pwmPins: [3, 5, 6, 9, 10, 11],
  analogPins: ['A0', 'A1', 'A2', 'A3'],
  specialPins: {
    serial: { tx: 1, rx: 0 },
    spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
    i2c: { sda: 'A4', scl: 'A5' },
    interrupt: [2, 3],
  },
  popular: false,
  description: 'My custom board description.',
}
```

### Adding Custom Libraries

Edit `src/data/arduinoData.js` and add to the `ARDUINO_LIBRARIES` array:

```js
{
  id: 'my_library',
  name: 'My Library',
  category: 'Sensors',
  description: 'Library for my sensor module.',
  include: '#include <MyLibrary.h>',
  version: '1.0.0',
  official: false,
  functions: ['begin()', 'read()', 'write(data)'],
  example: `MyLibrary sensor;\nsensor.begin();\nfloat val = sensor.read();`,
}
```

---

## 🔄 Workflow Example

1. **Open ArduinoAI IDE** in Chrome/Edge
2. **Select your board** from the sidebar (e.g., Arduino Uno)
3. **Type your project prompt** in the AI Prompt tab:
   > *"Build a temperature and humidity monitor using DHT22 that shows readings on a 16x2 LCD and logs data to an SD card every minute"*
4. **Click "Generate Project"** — AI runs all 5 steps
5. **Review the schematic** in the Schematic tab — drag components to adjust layout
6. **Check the code** in the Code Editor — use AI tools to explain or improve
7. **Review libraries** in the Libraries tab — add/remove as needed
8. **Connect your board** in the Upload tab via USB
9. **Click Upload** to flash the sketch
10. **Open Serial Monitor** to debug and interact with your Arduino

---

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| AI Generation | ✅ | ✅ | ✅ | ✅ |
| Code Editor | ✅ | ✅ | ✅ | ✅ |
| Schematic View | ✅ | ✅ | ✅ | ✅ |
| **Direct Upload** | ✅ | ✅ | ❌ | ❌ |
| **Serial Monitor** | ✅ | ✅ | ❌ | ❌ |

> Direct upload and Serial Monitor require the Web Serial API, available only in Chromium-based browsers. For Firefox/Safari, download the `.ino` file and use Arduino IDE.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Ideas for Contribution

- [ ] Real backend compiler integration (Arduino CLI)
- [ ] 3D component models for schematic view
- [ ] More board support (ESP32, ESP8266, STM32)
- [ ] Project templates gallery
- [ ] Multi-file sketch support
- [ ] Git integration
- [ ] Component simulation (Wokwi-style)
- [ ] BOM (Bill of Materials) export

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Anthropic Claude](https://anthropic.com) — AI backbone
- [Arduino](https://arduino.cc) — The amazing maker platform
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VS Code in the browser
- [React Flow](https://reactflow.dev) — Schematic canvas
- [Tailwind CSS](https://tailwindcss.com) — Utility-first styling

---

<p align="center">Built with ❤️ for the maker community</p>
An AI powered IDE to develop the arduino projects completely from scratch
