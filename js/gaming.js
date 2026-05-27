// Gaming / NKRO Tester Logic
document.addEventListener('DOMContentLoaded', () => {
  const kb = new KeyboardTester('keyboard-container');
  document.querySelector('.keyboard-base').classList.add('gaming-rgb-board');
  
  const currentHeld = document.getElementById('current-held');
  const maxRolloverText = document.getElementById('max-rollover-text');
  const presetBtns = document.querySelectorAll('.preset-btn[data-preset]');
  const clearComboBtn = document.getElementById('clear-combo-btn');
  const comboResultBadge = document.getElementById('combo-result-badge');
  const shareBtn = document.getElementById('share-btn');

  let maxKeys = 0;
  
  // Presets mapping to event.code
  const PRESETS = {
    'fps': ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'ControlLeft'],
    'fps-ext': ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'ControlLeft', 'KeyR', 'KeyG'],
    'moba': ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'Digit1', 'Digit2', 'Digit3', 'Digit4'],
    'homerow': ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']
  };

  let activeCombo = null;
  let comboTimer = null;
  let comboTested = false;

  function updateCounters() {
    const activeCount = kb.pressedKeys.size;
    currentHeld.innerText = activeCount;
    
    if (activeCount > maxKeys) {
      maxKeys = activeCount;
      if (maxKeys >= 10) {
        maxRolloverText.innerText = `Your keyboard supports N-Key Rollover (NKRO) — ${maxKeys} keys registered!`;
        maxRolloverText.style.color = 'var(--accent-color)';
      } else {
        maxRolloverText.innerText = `Max keys registered at once: ${maxKeys} (${maxKeys}KRO detected)`;
      }
    }
  }

  function setCombo(comboName) {
    clearCombo();
    activeCombo = PRESETS[comboName];
    
    // Highlight targets
    activeCombo.forEach(code => {
      const el = document.getElementById(`key-${code}`);
      if (el) el.classList.add('combo-target');
    });
    
    clearComboBtn.style.display = 'inline-block';
  }

  function clearCombo() {
    activeCombo = null;
    comboTested = false;
    clearTimeout(comboTimer);
    
    document.querySelectorAll('.key').forEach(el => {
      el.classList.remove('combo-target', 'ghosting-error');
    });
    
    presetBtns.forEach(b => b.classList.remove('active'));
    clearComboBtn.style.display = 'none';
    comboResultBadge.className = 'combo-badge';
  }

  function checkCombo() {
    if (!activeCombo || comboTested) return;
    
    // Count how many required keys are currently held
    let heldTargets = 0;
    activeCombo.forEach(code => {
      if (kb.pressedKeys.has(code)) {
        heldTargets++;
      }
    });

    // If they hold all of them
    if (heldTargets === activeCombo.length) {
      comboTested = true;
      comboResultBadge.innerText = 'PASS — All keys registered';
      comboResultBadge.className = 'combo-badge pass';
      return;
    }
    
    // If they hold most of them, start a 2-second timer to finalize
    if (heldTargets >= activeCombo.length - 2 && heldTargets > 0) {
      if (!comboTimer) {
        comboTimer = setTimeout(() => {
          if (comboTested) return;
          // After 2 seconds, evaluate
          let missingCount = 0;
          activeCombo.forEach(code => {
            if (!kb.pressedKeys.has(code)) {
              missingCount++;
              const el = document.getElementById(`key-${code}`);
              if (el) el.classList.add('ghosting-error');
            }
          });
          
          comboTested = true;
          comboResultBadge.innerText = `FAIL — ${missingCount} keys dropped (Ghosting detected)`;
          comboResultBadge.className = 'combo-badge fail';
        }, 1500); // 1.5s is usually enough
      }
    } else {
      clearTimeout(comboTimer);
      comboTimer = null;
    }
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      presetBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      setCombo(e.target.getAttribute('data-preset'));
    });
  });

  clearComboBtn.addEventListener('click', clearCombo);

  // Hook into keydown/up via DOM since kb.pressedKeys updates there
  document.addEventListener('keydown', () => {
    setTimeout(() => {
      updateCounters();
      checkCombo();
    }, 10);
  });
  
  document.addEventListener('keyup', () => {
    setTimeout(() => {
      updateCounters();
      if (!comboTested && activeCombo) {
        // Only stop timer if they release keys before testing finished
        clearTimeout(comboTimer);
        comboTimer = null;
      }
    }, 10);
  });

  shareBtn.addEventListener('click', () => {
    let result = `My keyboard passed the NKRO test — ${maxKeys} simultaneous keys registered! Tested at KeyboardTester.io`;
    if (maxKeys < 6) {
      result = `My keyboard only supports ${maxKeys}KRO. Time for an upgrade? Tested at KeyboardTester.io`;
    }
    
    navigator.clipboard.writeText(result).then(() => {
      const originalText = shareBtn.innerText;
      shareBtn.innerText = 'Copied to Clipboard!';
      setTimeout(() => { shareBtn.innerText = originalText; }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });
});
