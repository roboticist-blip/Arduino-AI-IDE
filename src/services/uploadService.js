/**
 * Arduino Upload Service
 * Uses the Web Serial API to communicate with Arduino boards
 * Simulates the avrdude upload process
 */

let serialPort = null;
let serialReader = null;
let serialWriter = null;
let readLoopActive = false;

export const BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 250000];

/**
 * Check if Web Serial API is supported
 */
export function isWebSerialSupported() {
  return 'serial' in navigator;
}

/**
 * List available serial ports
 */
export async function listPorts() {
  if (!isWebSerialSupported()) {
    throw new Error('Web Serial API not supported in this browser. Use Chrome or Edge.');
  }
  const ports = await navigator.serial.getPorts();
  return ports.map((p) => ({
    port: p,
    info: p.getInfo?.() || {},
  }));
}

/**
 * Request user to select a serial port
 */
export async function requestPort() {
  if (!isWebSerialSupported()) {
    throw new Error('Web Serial API not supported. Please use Chrome or Edge browser.');
  }
  return await navigator.serial.requestPort({
    filters: [
      { usbVendorId: 0x2341 }, // Arduino
      { usbVendorId: 0x1a86 }, // CH340 (Nano clones)
      { usbVendorId: 0x0403 }, // FTDI
      { usbVendorId: 0x10c4 }, // CP2102
    ],
  });
}

/**
 * Connect to serial port
 */
export async function connectSerial(port, baudRate = 9600) {
  try {
    if (serialPort) {
      await disconnectSerial();
    }

    await port.open({ baudRate });
    serialPort = port;

    return true;
  } catch (err) {
    console.error('Serial connect error:', err);
    throw new Error(`Failed to connect: ${err.message}`);
  }
}

/**
 * Disconnect from serial port
 */
export async function disconnectSerial() {
  try {
    readLoopActive = false;
    if (serialReader) {
      await serialReader.cancel();
      serialReader = null;
    }
    if (serialWriter) {
      await serialWriter.close();
      serialWriter = null;
    }
    if (serialPort) {
      await serialPort.close();
      serialPort = null;
    }
  } catch (err) {
    console.warn('Disconnect error (may be normal):', err);
  }
}

/**
 * Start reading from serial port
 */
export async function startSerialRead(onData, onError) {
  if (!serialPort) throw new Error('Not connected to any port');

  readLoopActive = true;
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
  serialReader = textDecoder.readable.getReader();

  const readLoop = async () => {
    try {
      while (readLoopActive) {
        const { value, done } = await serialReader.read();
        if (done || !readLoopActive) break;
        if (value) onData(value);
      }
    } catch (err) {
      if (readLoopActive) {
        onError?.(err.message);
      }
    }
  };

  readLoop();
}

/**
 * Write data to serial port
 */
export async function writeSerial(data) {
  if (!serialPort) throw new Error('Not connected');
  const encoder = new TextEncoder();
  const writer = serialPort.writable.getWriter();
  await writer.write(encoder.encode(data + '\n'));
  writer.releaseLock();
}

/**
 * Simulate Arduino upload process
 * In production, this would use a local agent (avrdude) via WebSocket
 */
export async function uploadSketch(code, board, port, onProgress) {
  const steps = [
    { label: 'Verifying sketch...', progress: 10, delay: 800 },
    { label: 'Compiling for ' + board.name + '...', progress: 25, delay: 1200 },
    { label: `Compiling sketch... (${board.mcu})`, progress: 40, delay: 900 },
    { label: 'Linking...', progress: 55, delay: 600 },
    { label: `Sketch uses ${Math.floor(Math.random() * 5000 + 2000)} bytes (${Math.floor(Math.random() * 15 + 5)}%) of program storage space.`, progress: 65, delay: 400 },
    { label: 'Connecting to ' + board.name + '...', progress: 70, delay: 800 },
    { label: 'Forcing reset using DTR...', progress: 75, delay: 500 },
    { label: 'Writing 0x1 bytes...', progress: 80, delay: 300 },
    { label: 'Uploading to board...', progress: 88, delay: 1000 },
    { label: 'avrdude: 100% complete', progress: 95, delay: 600 },
    { label: 'Upload complete!', progress: 100, delay: 200 },
  ];

  onProgress?.({ status: 'compiling', progress: 0, message: 'Starting build...' });

  for (const step of steps) {
    await new Promise((r) => setTimeout(r, step.delay));
    onProgress?.({
      status: step.progress < 65 ? 'compiling' : step.progress < 100 ? 'uploading' : 'success',
      progress: step.progress,
      message: step.label,
    });
  }

  return { success: true, message: 'Upload complete!' };
}

/**
 * Generate AVR hex string representation (simulated)
 */
export function codeToHex(code, board) {
  // In a real implementation, this would call a backend compiler
  // For demo, we show a placeholder hex representation
  const encoder = new TextEncoder();
  const bytes = encoder.encode(code);
  let hex = ':020000040000FA\n';

  for (let i = 0; i < Math.min(bytes.length, 64); i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const addr = i.toString(16).padStart(4, '0').toUpperCase();
    const len = chunk.length.toString(16).padStart(2, '0').toUpperCase();
    const data = Array.from(chunk).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    const checksum = (
      256 -
      ((chunk.length + parseInt(addr.slice(0, 2), 16) + parseInt(addr.slice(2), 16) +
        Array.from(chunk).reduce((a, b) => a + b, 0)) % 256)
    ) % 256;
    hex += `:${len}${addr}00${data}${checksum.toString(16).padStart(2, '0').toUpperCase()}\n`;
  }

  hex += ':00000001FF';
  return hex;
}

/**
 * Validate Arduino sketch before upload (basic checks)
 */
export function validateSketch(code) {
  const errors = [];
  const warnings = [];

  if (!code.includes('void setup()')) {
    errors.push('Missing setup() function');
  }
  if (!code.includes('void loop()')) {
    errors.push('Missing loop() function');
  }
  if (code.includes('delay(0)')) {
    warnings.push('delay(0) has no effect — did you mean a different duration?');
  }

  // Check for common mistakes
  const intChecks = code.match(/int\s+\w+\s*=\s*\d+\.\d+/g);
  if (intChecks) {
    warnings.push('Assigning float literal to int variable — value will be truncated');
  }

  return { valid: errors.length === 0, errors, warnings };
}
