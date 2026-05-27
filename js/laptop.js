// Laptop Tester Logic
document.addEventListener('DOMContentLoaded', () => {
  const kb = new KeyboardTester('keyboard-container');
  // Set layout to laptop style (tkl basically, with CSS changes)
  kb.setLayout('tkl');
  
  // Add specific laptop class for styling
  document.querySelector('.keyboard-base').classList.add('layout-laptop');

  const osToggle = document.getElementById('os-toggle');
  const resetBtn = document.getElementById('reset-btn');
  const startGuidedBtn = document.getElementById('start-guided-btn');
  const guidedStepText = document.getElementById('guided-step-text');
  const diagnosisTip = document.getElementById('diagnosis-tip');
  const keyboardWrapper = document.querySelector('.keyboard-container-wrapper');

  let guidedMode = false;
  let currentZone = -1;
  const zones = [
    { name: 'Top Row (Esc + F keys)', rowIndex: 0 },
    { name: 'Number Row', rowIndex: 1 },
    { name: 'QWERTY Row', rowIndex: 2 },
    { name: 'ASDF Row', rowIndex: 3 },
    { name: 'ZXCV Row', rowIndex: 4 },
    { name: 'Modifiers & Spacebar', rowIndex: 5 }
  ];

  // Media Keys for Fn Combo test
  const mediaKeys = [
    'AudioVolumeMute', 'AudioVolumeDown', 'AudioVolumeUp',
    'MediaTrackPrevious', 'MediaPlayPause', 'MediaTrackNext'
  ];

  osToggle.addEventListener('change', (e) => {
    kb.setOS(e.target.value);
    document.querySelector('.keyboard-base').classList.add('layout-laptop');
  });

  resetBtn.addEventListener('click', () => {
    kb.reset();
    guidedMode = false;
    currentZone = -1;
    guidedStepText.innerText = 'Ready to test your keyboard?';
    startGuidedBtn.style.display = 'inline-block';
    startGuidedBtn.innerText = 'Start Guided Spill/Damage Test';
    keyboardWrapper.className = 'keyboard-container-wrapper';
    diagnosisTip.style.display = 'none';
    
    mediaKeys.forEach(code => {
      const el = document.getElementById(`fn-${code}`);
      if (el) {
        el.classList.remove('active');
        el.classList.add('not-detected');
        el.querySelector('small').innerText = 'Not detected';
      }
    });
  });

  function nextGuidedZone() {
    currentZone++;
    if (currentZone >= zones.length) {
      // Finished
      guidedMode = false;
      guidedStepText.innerText = 'Test Complete! Check the layout for any unlit (failed) keys.';
      startGuidedBtn.style.display = 'inline-block';
      startGuidedBtn.innerText = 'Restart Guided Test';
      keyboardWrapper.className = 'keyboard-container-wrapper';
      diagnosisTip.style.display = 'block';
      return;
    }

    guidedStepText.innerText = `Step ${currentZone + 1}: Test the ${zones[currentZone].name}`;
    keyboardWrapper.className = `keyboard-container-wrapper highlight-row zone-${zones[currentZone].rowIndex}`;
  }

  startGuidedBtn.addEventListener('click', () => {
    if (!guidedMode) {
      kb.reset();
      guidedMode = true;
      currentZone = -1;
      startGuidedBtn.style.display = 'inline-block';
      startGuidedBtn.innerText = 'Next Zone ➔';
      diagnosisTip.style.display = 'none';
    }
    nextGuidedZone();
  });

  document.addEventListener('keydown', (e) => {
    // Fn Combo detection
    if (mediaKeys.includes(e.code) || mediaKeys.includes(e.key)) {
      const codeToUse = mediaKeys.includes(e.code) ? e.code : e.key;
      const el = document.getElementById(`fn-${codeToUse}`);
      if (el) {
        el.classList.remove('not-detected');
        el.classList.add('active');
        el.querySelector('small').innerText = 'Working ✓';
      }
    }
  });

});
