// Spacebar Counter Logic
document.addEventListener('DOMContentLoaded', () => {
  const modeBtns = document.querySelectorAll('.mode-btn');
  const timerDisplay = document.getElementById('timer');
  const counterDisplay = document.getElementById('counter');
  const cpsDisplay = document.getElementById('cps');
  const instruction = document.getElementById('instruction');
  const resultModal = document.getElementById('result-modal');
  const retryBtn = document.getElementById('retry-btn');
  
  const resTotal = document.getElementById('res-total');
  const resCps = document.getElementById('res-cps');
  const resRank = document.getElementById('res-rank');
  const resMsg = document.getElementById('res-msg');

  let duration = 5; // seconds (0 = unlimited)
  let timeRemaining = duration;
  let isRunning = false;
  let isFinished = false;
  let pressCount = 0;
  let startTime = 0;
  let timerInterval = null;
  let lastSpaceDown = false; // Prevent holding

  function formatTime(sec) {
    if (duration === 0) {
      // Stopwatch mode
      return sec.toFixed(2) + 's';
    }
    // Countdown mode
    return Math.max(0, sec).toFixed(2) + 's';
  }

  function setMode(sec) {
    duration = parseFloat(sec);
    reset();
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      modeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      setMode(e.target.getAttribute('data-time'));
    });
  });

  function start() {
    isRunning = true;
    startTime = performance.now();
    instruction.innerText = 'Keep Pressing!';
    instruction.style.animation = 'none';
    instruction.style.color = '#fff';
    instruction.style.borderColor = 'var(--accent-color)';
    
    timerInterval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      
      if (duration > 0) {
        timeRemaining = duration - elapsed;
        if (timeRemaining <= 0) {
          timeRemaining = 0;
          endTest();
        }
      } else {
        timeRemaining = elapsed; // Count up
      }
      
      timerDisplay.innerText = formatTime(timeRemaining);
      
      // Update CPS
      if (elapsed > 0) {
        const cps = pressCount / elapsed;
        cpsDisplay.innerText = cps.toFixed(2);
      }
    }, 100);
  }

  function endTest() {
    isRunning = false;
    isFinished = true;
    clearInterval(timerInterval);
    
    const finalCps = pressCount / duration;
    
    resTotal.innerText = pressCount;
    resCps.innerText = finalCps.toFixed(2);
    
    let rank = 'Beginner';
    if (finalCps >= 5) rank = 'Average';
    if (finalCps >= 8) rank = 'Fast';
    if (finalCps >= 12) rank = 'Pro';
    
    resRank.innerText = rank;
    
    if (finalCps < 6) resMsg.innerText = "Most people score 6-8 CPS. You scored a bit below average.";
    else if (finalCps <= 8) resMsg.innerText = "Most people score 6-8 CPS. You scored right in the average!";
    else resMsg.innerText = "Most people score 6-8 CPS. You scored well above average!";

    resultModal.style.display = 'flex';
  }

  function reset() {
    isRunning = false;
    isFinished = false;
    clearInterval(timerInterval);
    pressCount = 0;
    timeRemaining = duration === 0 ? 0 : duration;
    
    counterDisplay.innerText = '0';
    cpsDisplay.innerText = '0.00';
    timerDisplay.innerText = formatTime(timeRemaining);
    
    instruction.innerText = 'Press Spacebar to Start';
    instruction.style.animation = 'pulse 2s infinite alternate';
    instruction.style.color = '#888';
    instruction.style.borderColor = '#444';
    
    resultModal.style.display = 'none';
  }

  retryBtn.addEventListener('click', reset);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent scrolling down
      
      if (isFinished) return;
      if (!lastSpaceDown) {
        lastSpaceDown = true;
        
        if (!isRunning) {
          start();
        }
        
        pressCount++;
        counterDisplay.innerText = pressCount;
        
        // Manual bounce effect
        counterDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => { counterDisplay.style.transform = 'scale(1)'; }, 50);
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      lastSpaceDown = false;
    }
  });
});
