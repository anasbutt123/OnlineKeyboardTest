// Mechanical Tester Logic
document.addEventListener('DOMContentLoaded', () => {
  const kb = new KeyboardTester('keyboard-container');
  
  const layoutToggle = document.getElementById('layout-toggle');
  const resetBtn = document.getElementById('reset-btn');
  const stuckAlert = document.getElementById('stuck-alert');
  const chatterAlert = document.getElementById('chatter-alert');
  
  const statTotal = document.getElementById('stat-total');
  const statUnique = document.getElementById('stat-unique');
  const statFlagged = document.getElementById('stat-flagged');
  const statTime = document.getElementById('stat-time');
  const statsBody = document.getElementById('stats-body');

  let keyStats = {};
  let totalPresses = 0;
  let flaggedCount = 0;
  let sessionStartTime = Date.now();
  let timerInterval = null;

  // Switch selector logic (cosmetic)
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  function updateTimer() {
    const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    statTime.innerText = `${m}:${s}`;
  }

  function renderTable() {
    const rows = Object.keys(keyStats).sort().map(code => {
      const stat = keyStats[code];
      const avg = stat.count > 0 ? Math.round(stat.totalHoldTime / stat.count) : 0;
      const isSticking = avg > 500;
      let status = 'Normal';
      let rowClass = '';

      if (stat.chatterDetected) {
        status = '⚠ Chatter';
        rowClass = 'flagged-row';
      } else if (isSticking) {
        status = '⚠ Sticking';
        rowClass = 'flagged-row';
      }

      return `<tr class="${rowClass}">
        <td>${code}</td>
        <td>${stat.count}</td>
        <td>${avg}</td>
        <td>${status}</td>
      </tr>`;
    });
    
    statsBody.innerHTML = rows.join('');
    
    // Update flagged count
    flaggedCount = Object.values(keyStats).filter(s => s.chatterDetected || (s.count > 0 && (s.totalHoldTime / s.count) > 500)).length;
    statFlagged.innerText = flaggedCount;
    if (flaggedCount > 0) statFlagged.style.color = '#ffcc00';
    else statFlagged.style.color = 'var(--text-color)';
  }

  // Hook into keydown
  document.addEventListener('keydown', (e) => {
    // Start timer on first press
    if (totalPresses === 0 && !timerInterval) {
      sessionStartTime = Date.now();
      timerInterval = setInterval(updateTimer, 1000);
    }

    if (!e.repeat) {
      totalPresses++;
      statTotal.innerText = totalPresses;

      if (!keyStats[e.code]) {
        keyStats[e.code] = { count: 0, totalHoldTime: 0, lastDown: 0, chatterDetected: false };
      }
      
      const now = performance.now();
      const stat = keyStats[e.code];

      // Chatter detection (< 50ms between press releases, or press-to-press if fast enough)
      if (stat.lastDown > 0 && (now - stat.lastDown) < 50) {
        stat.chatterDetected = true;
        chatterAlert.innerText = `⚠ Key chatter detected on [${e.code}]. This switch may be failing.`;
        chatterAlert.style.display = 'block';
        setTimeout(() => { chatterAlert.style.display = 'none'; }, 4000);
      }

      stat.lastDown = now;
      stat.count++;

      // Update tooltip title
      const el = document.getElementById(`key-${e.code}`);
      if (el) {
        el.title = `Pressed: ${stat.count} times`;
      }
    }
  });

  // Hook into keyup
  document.addEventListener('keyup', (e) => {
    if (keyStats[e.code] && keyStats[e.code].lastDown > 0) {
      const holdTime = performance.now() - keyStats[e.code].lastDown;
      keyStats[e.code].totalHoldTime += holdTime;
      // Do not reset lastDown, we need it for next press for chatter detect, but we need a way to distinguish.
      // Actually lastDown is fine, chatter is if next keydown is too fast after this keydown.
      renderTable();
    }
  });

  kb.onKeyUpdate = (testedCount) => {
    statUnique.innerText = testedCount;
  };

  kb.onStuckKey = (code, label) => {
    stuckAlert.innerText = `⚠ Possible stuck key detected: [${label || code}]`;
    stuckAlert.classList.add('visible');
    setTimeout(() => { stuckAlert.classList.remove('visible'); }, 5000);
  };

  layoutToggle.addEventListener('change', (e) => {
    kb.setLayout(e.target.value);
  });

  resetBtn.addEventListener('click', () => {
    kb.reset();
    keyStats = {};
    totalPresses = 0;
    flaggedCount = 0;
    
    statTotal.innerText = '0';
    statUnique.innerText = '0';
    statFlagged.innerText = '0';
    statFlagged.style.color = 'var(--text-color)';
    statTime.innerText = '00:00';
    statsBody.innerHTML = '';
    
    clearInterval(timerInterval);
    timerInterval = null;
    
    stuckAlert.classList.remove('visible');
    chatterAlert.style.display = 'none';
  });
});
