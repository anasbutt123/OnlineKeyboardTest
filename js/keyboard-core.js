// Keyboard Sound Synthesis using Web Audio API
class KeyboardSoundGenerator {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.volume = 0.9;
    this.switchType = 'clicky'; // 'clicky', 'linear', 'tactile', 'mute'
  }

  init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.createNoiseBuffer();
        }
      } catch (e) {
        console.warn("Web Audio API not supported or blocked:", e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch (e) {
        console.warn("Failed to resume AudioContext:", e);
      }
    }
  }

  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  setSwitchType(type) {
    this.switchType = type;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  playDown(code) {
    if (this.switchType === 'mute') return;
    this.init();
    if (!this.ctx || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    
    // Master volume node
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(this.ctx.destination);

    // Dynamic pitch multiplier depending on key size
    let freqMultiplier = 1.0;
    if (code === 'Space') {
      freqMultiplier = 0.85; // Much cleaner, less deep for spacebar
    } else if (['Enter', 'Backspace', 'ShiftLeft', 'ShiftRight', 'CapsLock'].includes(code)) {
      freqMultiplier = 0.92; // High-mid stabilizer keys
    } else if (code && (code.startsWith('Arrow') || code.startsWith('Numpad'))) {
      freqMultiplier = 0.98;
    }
    
    // Add subtle pitch variation to feel organic
    const randomVariation = 0.95 + Math.random() * 0.1;
    const finalMultiplier = freqMultiplier * randomVariation;

    // 1. Noise component for plastic clack impact
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    const noiseGain = this.ctx.createGain();

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    // 2. Resonant body component (sine wave)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);

    if (this.switchType === 'clicky') {
      // Crisp high-pitched mechanical switch click at actuation point
      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(6500 * randomVariation, now);
      clickFilter.Q.setValueAtTime(12, now);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0, now);
      clickGain.gain.linearRampToValueAtTime(0.45, now + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      const clickNoise = this.ctx.createBufferSource();
      clickNoise.buffer = this.noiseBuffer;
      clickNoise.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(masterGain);
      clickNoise.start(now, Math.random() * 1.5);
      clickNoise.stop(now + 0.05);

      // High-mid clack settings (eliminates deep boom)
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1500 * finalMultiplier, now);
      noiseFilter.Q.setValueAtTime(2.0, now);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      // Higher frequency body ping (instead of bass thump)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 * finalMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(350 * finalMultiplier, now + 0.03);
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.1, now + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    } else if (this.switchType === 'linear') {
      // Linear (Red switch) - snappy clack
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200 * finalMultiplier, now);
      noiseFilter.Q.setValueAtTime(1.5, now);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450 * finalMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(280 * finalMultiplier, now + 0.035);
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.15, now + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    } else if (this.switchType === 'tactile') {
      // Tactile (Brown switch) - crisp actuation & snappy sound
      const bumpFilter = this.ctx.createBiquadFilter();
      bumpFilter.type = 'bandpass';
      bumpFilter.frequency.setValueAtTime(1800 * randomVariation, now);
      bumpFilter.Q.setValueAtTime(4, now);

      const bumpGain = this.ctx.createGain();
      bumpGain.gain.setValueAtTime(0, now);
      bumpGain.gain.linearRampToValueAtTime(0.2, now + 0.001);
      bumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

      const bumpNoise = this.ctx.createBufferSource();
      bumpNoise.buffer = this.noiseBuffer;
      bumpNoise.connect(bumpFilter);
      bumpFilter.connect(bumpGain);
      bumpGain.connect(masterGain);
      bumpNoise.start(now, Math.random() * 1.5);
      bumpNoise.stop(now + 0.05);

      // Snappy clack settings
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1350 * finalMultiplier, now);
      noiseFilter.Q.setValueAtTime(1.8, now);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.48, now + 0.003);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500 * finalMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(300 * finalMultiplier, now + 0.035);
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.12, now + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    }

    noiseNode.start(now, Math.random() * 1.5);
    osc.start(now);

    noiseNode.stop(now + 0.08);
    osc.stop(now + 0.08);
  }

  playUp(code) {
    if (this.switchType === 'mute') return;
    this.init();
    if (!this.ctx || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    
    // Master volume node
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.6, now); // quieter release sound
    masterGain.connect(this.ctx.destination);

    // Dynamic pitch multiplier depending on key size
    let freqMultiplier = 1.0;
    if (code === 'Space') {
      freqMultiplier = 0.85;
    } else if (['Enter', 'Backspace', 'ShiftLeft', 'ShiftRight', 'CapsLock'].includes(code)) {
      freqMultiplier = 0.93;
    } else if (code && (code.startsWith('Arrow') || code.startsWith('Numpad'))) {
      freqMultiplier = 0.98;
    }
    
    const randomVariation = 0.95 + Math.random() * 0.1;
    const finalMultiplier = freqMultiplier * randomVariation;

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    const noiseGain = this.ctx.createGain();

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);

    if (this.switchType === 'clicky') {
      // Clicky release - high-pitched plastic housing snap
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1600 * finalMultiplier, now);
      noiseFilter.Q.setValueAtTime(2.0, now);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650 * finalMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(400 * finalMultiplier, now + 0.02);
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.08, now + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    } else if (this.switchType === 'linear') {
      // Linear release - snappy high-mid click
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400 * finalMultiplier, now);
      noiseFilter.Q.setValueAtTime(1.8, now);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 * finalMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(320 * finalMultiplier, now + 0.02);
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.08, now + 0.001);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    } else if (this.switchType === 'tactile') {
      // Tactile release - snappy top clack
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1500 * finalMultiplier, now);
      noiseFilter.Q.setValueAtTime(1.8, now);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580 * finalMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(360 * finalMultiplier, now + 0.02);
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.08, now + 0.001);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    }

    noiseNode.start(now, Math.random() * 1.5);
    osc.start(now);

    noiseNode.stop(now + 0.05);
    osc.stop(now + 0.05);
  }
}

if (!window.keyboardSoundGen) {
  window.keyboardSoundGen = new KeyboardSoundGenerator();
}

// Keyboard Data and Core Logic
const KEYBOARD_DATA = {
  full: [
    // Row 1 (Esc, F1-F12, etc)
    [
      { code: 'Escape', label: 'Esc', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w1' },
      { code: 'F1', label: 'F1', class: 'key-w1' },
      { code: 'F2', label: 'F2', class: 'key-w1' },
      { code: 'F3', label: 'F3', class: 'key-w1' },
      { code: 'F4', label: 'F4', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { code: 'F5', label: 'F5', class: 'key-w1' },
      { code: 'F6', label: 'F6', class: 'key-w1' },
      { code: 'F7', label: 'F7', class: 'key-w1' },
      { code: 'F8', label: 'F8', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { code: 'F9', label: 'F9', class: 'key-w1' },
      { code: 'F10', label: 'F10', class: 'key-w1' },
      { code: 'F11', label: 'F11', class: 'key-w1' },
      { code: 'F12', label: 'F12', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { nav: true, code: 'PrintScreen', label: 'PrtSc', class: 'key-w1' },
      { nav: true, code: 'ScrollLock', label: 'ScrLk', class: 'key-w1' },
      { nav: true, code: 'Pause', label: 'Pause', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { code: 'Space', spacer: true, class: 'key-w4' }
    ],
    // Row 2 (Numbers)
    [
      { code: 'Backquote', label: '~<br>`', class: 'key-w1' },
      { code: 'Digit1', label: '!<br>1', class: 'key-w1' },
      { code: 'Digit2', label: '@<br>2', class: 'key-w1' },
      { code: 'Digit3', label: '#<br>3', class: 'key-w1' },
      { code: 'Digit4', label: '$<br>4', class: 'key-w1' },
      { code: 'Digit5', label: '%<br>5', class: 'key-w1' },
      { code: 'Digit6', label: '^<br>6', class: 'key-w1' },
      { code: 'Digit7', label: '&<br>7', class: 'key-w1' },
      { code: 'Digit8', label: '*<br>8', class: 'key-w1' },
      { code: 'Digit9', label: '(<br>9', class: 'key-w1' },
      { code: 'Digit0', label: ')<br>0', class: 'key-w1' },
      { code: 'Minus', label: '_<br>-', class: 'key-w1' },
      { code: 'Equal', label: '+<br>=', class: 'key-w1' },
      { code: 'Backspace', label: 'Backspace', class: 'key-w2' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { nav: true, code: 'Insert', label: 'Ins', class: 'key-w1' },
      { nav: true, code: 'Home', label: 'Home', class: 'key-w1' },
      { nav: true, code: 'PageUp', label: 'PgUp', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { num: true, code: 'NumLock', label: 'Num', class: 'key-w1' },
      { num: true, code: 'NumpadDivide', label: '/', class: 'key-w1' },
      { num: true, code: 'NumpadMultiply', label: '*', class: 'key-w1' },
      { num: true, code: 'NumpadSubtract', label: '-', class: 'key-w1' }
    ],
    // Row 3 (QWERTY)
    [
      { code: 'Tab', label: 'Tab', class: 'key-w1-5' },
      { code: 'KeyQ', label: 'Q', class: 'key-w1' },
      { code: 'KeyW', label: 'W', class: 'key-w1' },
      { code: 'KeyE', label: 'E', class: 'key-w1' },
      { code: 'KeyR', label: 'R', class: 'key-w1' },
      { code: 'KeyT', label: 'T', class: 'key-w1' },
      { code: 'KeyY', label: 'Y', class: 'key-w1' },
      { code: 'KeyU', label: 'U', class: 'key-w1' },
      { code: 'KeyI', label: 'I', class: 'key-w1' },
      { code: 'KeyO', label: 'O', class: 'key-w1' },
      { code: 'KeyP', label: 'P', class: 'key-w1' },
      { code: 'BracketLeft', label: '{<br>[', class: 'key-w1' },
      { code: 'BracketRight', label: '}<br>]', class: 'key-w1' },
      { code: 'Backslash', label: '|<br>\\', class: 'key-w1-5' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { nav: true, code: 'Delete', label: 'Del', class: 'key-w1' },
      { nav: true, code: 'End', label: 'End', class: 'key-w1' },
      { nav: true, code: 'PageDown', label: 'PgDn', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { num: true, code: 'Numpad7', label: '7', class: 'key-w1' },
      { num: true, code: 'Numpad8', label: '8', class: 'key-w1' },
      { num: true, code: 'Numpad9', label: '9', class: 'key-w1' },
      { num: true, code: 'NumpadAdd', label: '+', class: 'key-w1 key-h2' } // Requires special CSS handling or just normal in row
    ],
    // Row 4 (ASDF)
    [
      { code: 'CapsLock', label: 'Caps Lock', class: 'key-w1-75' },
      { code: 'KeyA', label: 'A', class: 'key-w1' },
      { code: 'KeyS', label: 'S', class: 'key-w1' },
      { code: 'KeyD', label: 'D', class: 'key-w1' },
      { code: 'KeyF', label: 'F', class: 'key-w1' },
      { code: 'KeyG', label: 'G', class: 'key-w1' },
      { code: 'KeyH', label: 'H', class: 'key-w1' },
      { code: 'KeyJ', label: 'J', class: 'key-w1' },
      { code: 'KeyK', label: 'K', class: 'key-w1' },
      { code: 'KeyL', label: 'L', class: 'key-w1' },
      { code: 'Semicolon', label: ':<br>;', class: 'key-w1' },
      { code: 'Quote', label: '"<br>\'', class: 'key-w1' },
      { code: 'Enter', label: 'Enter', class: 'key-w2-25' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { code: 'Space', spacer: true, class: 'key-w3' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { num: true, code: 'Numpad4', label: '4', class: 'key-w1' },
      { num: true, code: 'Numpad5', label: '5', class: 'key-w1' },
      { num: true, code: 'Numpad6', label: '6', class: 'key-w1' },
      { num: true, code: 'Space', spacer: true, class: 'key-w1' } // Placeholder for NumpadAdd height
    ],
    // Row 5 (ZXCV)
    [
      { code: 'ShiftLeft', label: 'Shift', class: 'key-w2-25' },
      { code: 'KeyZ', label: 'Z', class: 'key-w1' },
      { code: 'KeyX', label: 'X', class: 'key-w1' },
      { code: 'KeyC', label: 'C', class: 'key-w1' },
      { code: 'KeyV', label: 'V', class: 'key-w1' },
      { code: 'KeyB', label: 'B', class: 'key-w1' },
      { code: 'KeyN', label: 'N', class: 'key-w1' },
      { code: 'KeyM', label: 'M', class: 'key-w1' },
      { code: 'Comma', label: '<<br>,', class: 'key-w1' },
      { code: 'Period', label: '><br>.', class: 'key-w1' },
      { code: 'Slash', label: '?<br>/', class: 'key-w1' },
      { code: 'ShiftRight', label: 'Shift', class: 'key-w2-75' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { nav: true, code: 'Space', spacer: true, class: 'key-w1' },
      { nav: true, code: 'ArrowUp', label: '▲', class: 'key-w1' },
      { nav: true, code: 'Space', spacer: true, class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { num: true, code: 'Numpad1', label: '1', class: 'key-w1' },
      { num: true, code: 'Numpad2', label: '2', class: 'key-w1' },
      { num: true, code: 'Numpad3', label: '3', class: 'key-w1' },
      { num: true, code: 'NumpadEnter', label: 'Enter', class: 'key-w1 key-h2' }
    ],
    // Row 6 (Modifiers)
    [
      { code: 'ControlLeft', label: 'Ctrl', class: 'key-w1-25', macLabel: 'ctrl' },
      { code: 'MetaLeft', label: 'Win', class: 'key-w1-25', macLabel: 'cmd' },
      { code: 'AltLeft', label: 'Alt', class: 'key-w1-25', macLabel: 'opt' },
      { code: 'Space', label: '', class: 'key-w6-25' },
      { code: 'AltRight', label: 'Alt', class: 'key-w1-25', macLabel: 'opt' },
      { code: 'MetaRight', label: 'Win', class: 'key-w1-25', macLabel: 'cmd' },
      { code: 'ContextMenu', label: 'Menu', class: 'key-w1-25' },
      { code: 'ControlRight', label: 'Ctrl', class: 'key-w1-25', macLabel: 'ctrl' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { nav: true, code: 'ArrowLeft', label: '◄', class: 'key-w1' },
      { nav: true, code: 'ArrowDown', label: '▼', class: 'key-w1' },
      { nav: true, code: 'ArrowRight', label: '►', class: 'key-w1' },
      { code: 'Space', spacer: true, class: 'key-w0-5' },
      { num: true, code: 'Numpad0', label: '0', class: 'key-w2' },
      { num: true, code: 'NumpadDecimal', label: '.', class: 'key-w1' },
      { num: true, code: 'Space', spacer: true, class: 'key-w1' } // Placeholder for NumpadEnter height
    ]
  ]
};

class KeyboardTester {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.layout = 'full';
    this.os = 'win';
    this.testedKeys = new Set();
    this.pressedKeys = new Set();
    this.stuckTimers = {};
    this.totalKeys = 104; // Approximated full layout count
    this.onKeyUpdate = null; // Callback for UI updates
    this.onStuckKey = null; // Callback for stuck key alert

    this.render();
    this.attachEvents();
  }

  setLayout(layoutType) {
    this.layout = layoutType;
    if (this.layout === 'full') this.totalKeys = 104;
    if (this.layout === 'tkl') this.totalKeys = 87;
    if (this.layout === '60') this.totalKeys = 61;
    this.render();
    this.reset();
  }

  setOS(osType) {
    this.os = osType;
    this.render(); // Re-render to update labels
  }

  reset() {
    this.testedKeys.clear();
    this.pressedKeys.clear();
    Object.values(this.stuckTimers).forEach(clearTimeout);
    this.stuckTimers = {};
    
    document.querySelectorAll('.key').forEach(el => {
      el.classList.remove('pressed', 'tested', 'stuck');
    });
    
    if (this.onKeyUpdate) this.onKeyUpdate(this.testedKeys.size, this.totalKeys);
  }

  render() {
    if (!this.container) return;
    
    let html = `<div class="keyboard-base layout-${this.layout}">`;
    html += `<div class="kb-main">`;

    KEYBOARD_DATA.full.forEach((row, i) => {
      html += `<div class="keyboard-row f-row-${i}">`;
      row.forEach(key => {
        if (key.spacer) {
          html += `<div class="spacer ${key.class}"></div>`;
          return;
        }

        // Apply OS specific labels
        let label = key.label;
        if (this.os === 'mac' && key.macLabel) {
          label = key.macLabel;
        }

        // Add section classes for hiding via CSS
        let classes = `key ${key.class}`;
        if (key.nav) classes += ' kb-nav-key';
        if (key.num) classes += ' kb-num-key';
        if (i === 0) classes += ' f-row-key';
        
        // Preserve tested state if re-rendered
        if (this.testedKeys.has(key.code)) classes += ' tested';

        html += `<div class="${classes}" id="key-${key.code}" data-code="${key.code}">
                  ${label}
                 </div>`;
      });
      html += `</div>`;
    });

    html += `</div></div>`;
    this.container.innerHTML = html;

    // Set default switch type based on page context (e.g. Mechanical page has active switch type buttons)
    const activeBtn = document.querySelector('.switch-btn.active');
    if (activeBtn && window.keyboardSoundGen) {
      window.keyboardSoundGen.setSwitchType(activeBtn.getAttribute('data-type').toLowerCase());
    } else if (window.keyboardSoundGen) {
      window.keyboardSoundGen.setSwitchType('clicky');
    }

    // Auto-adjust scaling for responsiveness
    setTimeout(adjustKeyboardScale, 0);
  }

  isTesterVisible() {
    if (!this.container) return false;
    const rect = this.container.getBoundingClientRect();
    return (
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom > 0
    );
  }

  attachEvents() {
    // Resume AudioContext and synchronize mechanical tester switch button clicks
    document.addEventListener('click', (e) => {
      if (window.keyboardSoundGen) {
        window.keyboardSoundGen.init();
      }
      const btn = e.target.closest('.switch-btn');
      if (btn) {
        const type = btn.getAttribute('data-type').toLowerCase();
        if (window.keyboardSoundGen) {
          window.keyboardSoundGen.setSwitchType(type);
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (this.isTesterVisible()) {
        // Prevent all browser shortcuts (Alt menu, F-keys, scrolling) while actively testing
        e.preventDefault();
      }

      const isNewPress = !this.pressedKeys.has(e.code);

      this.pressedKeys.add(e.code);
      this.testedKeys.add(e.code);

      const el = document.getElementById(`key-${e.code}`);
      if (el) {
        el.classList.add('pressed');
        el.classList.remove('stuck'); // Reset stuck on new press
      }

      // Play switch click sound
      if (isNewPress && window.keyboardSoundGen) {
        window.keyboardSoundGen.playDown(e.code);
      }

      // Stuck key timer
      if (this.stuckTimers[e.code]) clearTimeout(this.stuckTimers[e.code]);
      this.stuckTimers[e.code] = setTimeout(() => {
        if (this.pressedKeys.has(e.code)) {
          if (el) el.classList.add('stuck');
          if (this.onStuckKey) this.onStuckKey(e.code, el ? el.innerText : e.code);
        }
      }, 3000);

      if (this.onKeyUpdate) this.onKeyUpdate(this.testedKeys.size, this.totalKeys, e, 'down');
    });

    document.addEventListener('keyup', (e) => {
      if (this.isTesterVisible()) {
        e.preventDefault(); // Crucial for stopping Windows Alt menu on key release
      }

      const wasPressed = this.pressedKeys.has(e.code);

      this.pressedKeys.delete(e.code);
      if (this.stuckTimers[e.code]) {
        clearTimeout(this.stuckTimers[e.code]);
        delete this.stuckTimers[e.code];
      }

      const el = document.getElementById(`key-${e.code}`);
      if (el) {
        el.classList.remove('pressed', 'stuck');
        el.classList.add('tested');
      }

      // Play switch release sound
      if (wasPressed && window.keyboardSoundGen) {
        window.keyboardSoundGen.playUp(e.code);
      }

      if (this.onKeyUpdate) this.onKeyUpdate(this.testedKeys.size, this.totalKeys, e, 'up');
    });
    
    // Attempt to handle lost focus (e.g. alt-tabbing) to clear keys
    window.addEventListener('blur', () => {
      this.pressedKeys.forEach(code => {
        const el = document.getElementById(`key-${code}`);
        if (el) el.classList.remove('pressed');
      });
      this.pressedKeys.clear();
      Object.values(this.stuckTimers).forEach(clearTimeout);
      this.stuckTimers = {};
    });
  }
}

function adjustKeyboardScale() {
  const wrappers = document.querySelectorAll('.keyboard-container-wrapper');
  wrappers.forEach(wrapper => {
    const base = wrapper.querySelector('.keyboard-base');
    if (!base) return;

    // Reset temporary styles to get correct measurements
    base.style.transform = '';
    base.style.margin = '0 auto';
    wrapper.style.height = '';

    // Force reflow and get actual layout height before scaling
    const baseHeight = base.offsetHeight;
    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const baseWidth = base.getBoundingClientRect().width;

    if (baseWidth > wrapperWidth && wrapperWidth > 0) {
      const scale = wrapperWidth / baseWidth;
      base.style.transform = `scale(${scale})`;
      base.style.transformOrigin = 'top center';
      base.style.margin = '0 auto';

      // Lock height of wrapper to match scaled height with 15px safety padding for shadows
      wrapper.style.height = `${(baseHeight * scale) + 15}px`;
    }
  });
}

// Attach event listeners
window.addEventListener('resize', adjustKeyboardScale);
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(adjustKeyboardScale, 50);
});
window.addEventListener('load', () => {
  setTimeout(adjustKeyboardScale, 150);
});
