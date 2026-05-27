// Homepage specific logic
document.addEventListener('DOMContentLoaded', () => {
  const kb = new KeyboardTester('keyboard-container');
  
  const layoutToggle = document.getElementById('layout-toggle');
  const osToggle = document.getElementById('os-toggle');
  const resetBtn = document.getElementById('reset-btn');
  const progressCount = document.getElementById('progress-count');
  const totalCount = document.getElementById('total-count');
  const allTestedMsg = document.getElementById('all-tested-msg');
  const eventLog = document.getElementById('event-log');
  const stuckAlert = document.getElementById('stuck-alert');

  // Add a way to manually log events (avoids creating 100 DOM nodes rapidly)
  const MAX_LOGS = 15;
  let logEntries = [];

  function appendLog(code, type) {
    const time = new Date().toISOString().split('T')[1].substring(0, 12);
    const logStr = `[${time}] ${code} - ${type}`;
    logEntries.unshift({text: logStr, type: type});
    if (logEntries.length > MAX_LOGS) logEntries.pop();
    
    eventLog.innerHTML = logEntries.map(l => 
      `<div class="log-entry ${l.type}">${l.text}</div>`
    ).join('');
  }

  kb.onKeyUpdate = (testedCount, maxKeys, event, type) => {
    progressCount.innerText = testedCount;
    totalCount.innerText = maxKeys;
    
    if (testedCount >= maxKeys) {
      allTestedMsg.style.display = 'inline';
    } else {
      allTestedMsg.style.display = 'none';
    }

    if (event) {
      appendLog(event.code, type);
    }
  };

  kb.onStuckKey = (code, label) => {
    stuckAlert.innerText = `⚠ Possible stuck key detected: [${label || code}]`;
    stuckAlert.classList.add('visible');
    
    // Hide alert after 5 seconds if no longer stuck (handled manually or re-pressed)
    setTimeout(() => {
      stuckAlert.classList.remove('visible');
    }, 5000);
  };

  layoutToggle.addEventListener('change', (e) => {
    kb.setLayout(e.target.value);
    totalCount.innerText = kb.totalKeys;
    progressCount.innerText = '0';
    allTestedMsg.style.display = 'none';
    logEntries = [];
    eventLog.innerHTML = '';
  });

  osToggle.addEventListener('change', (e) => {
    kb.setOS(e.target.value);
  });

  resetBtn.addEventListener('click', () => {
    kb.reset();
    progressCount.innerText = '0';
    allTestedMsg.style.display = 'none';
    stuckAlert.classList.remove('visible');
    logEntries = [];
    eventLog.innerHTML = '';
  });

  // Init labels
  totalCount.innerText = kb.totalKeys;
});
