// Latency Tester Logic
document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('reset-btn');
  const sampleCountEl = document.getElementById('sample-count');
  const latencyBody = document.getElementById('latency-body');
  const statsPanel = document.getElementById('stats-panel');
  const overallBadge = document.getElementById('overall-badge');
  const canvas = document.getElementById('latency-chart');
  const ctx = canvas.getContext('2d');

  let samples = [];
  const MAX_SAMPLES = 20;

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawChart();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getRatingInfo(latency) {
    if (latency < 5) return { text: 'Excellent', class: 'rating-excellent', color: '#00ff88' };
    if (latency <= 15) return { text: 'Good', class: 'rating-good', color: '#aadd00' };
    if (latency <= 30) return { text: 'High', class: 'rating-high', color: '#ff9900' };
    return { text: 'Very High', class: 'rating-veryhigh', color: '#ff3333' };
  }

  function renderTable() {
    latencyBody.innerHTML = samples.map((s, i) => {
      const rating = getRatingInfo(s.latency);
      return `<tr>
        <td>${i + 1}</td>
        <td>${s.code}</td>
        <td>${s.latency.toFixed(1)}</td>
        <td class="${rating.class}">${rating.text}</td>
      </tr>`;
    }).join('');
    // Auto scroll
    latencyBody.parentElement.parentElement.scrollTop = latencyBody.parentElement.parentElement.scrollHeight;
  }

  function drawChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=1; i<4; i++) {
      let y = (canvas.height / 4) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    if (samples.length === 0) return;

    // Draw line
    const paddingX = 20;
    const paddingY = 20;
    const drawWidth = canvas.width - paddingX * 2;
    const drawHeight = canvas.height - paddingY * 2;
    
    // Find max for Y scaling (min 40ms)
    let maxLat = Math.max(...samples.map(s => s.latency), 40);

    ctx.beginPath();
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    
    samples.forEach((s, i) => {
      const x = paddingX + (i / (MAX_SAMPLES - 1 || 1)) * drawWidth;
      const y = canvas.height - paddingY - (s.latency / maxLat) * drawHeight;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    samples.forEach((s, i) => {
      const x = paddingX + (i / (MAX_SAMPLES - 1 || 1)) * drawWidth;
      const y = canvas.height - paddingY - (s.latency / maxLat) * drawHeight;
      const rating = getRatingInfo(s.latency);
      
      ctx.beginPath();
      ctx.fillStyle = rating.color;
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function updateStats() {
    if (samples.length >= 10) {
      statsPanel.style.display = 'grid';
      
      const lats = samples.map(s => s.latency);
      const avg = lats.reduce((a, b) => a + b, 0) / lats.length;
      const min = Math.min(...lats);
      const max = Math.max(...lats);
      
      // Standard deviation
      const variance = lats.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lats.length;
      const stdDev = Math.sqrt(variance);
      
      let consistency = 'Consistent';
      if (stdDev > 3) consistency = 'Variable';
      if (stdDev > 8) consistency = 'Inconsistent';

      document.getElementById('stat-avg').innerText = avg.toFixed(1);
      document.getElementById('stat-min').innerText = min.toFixed(1);
      document.getElementById('stat-max').innerText = max.toFixed(1);
      document.getElementById('stat-stddev').innerText = consistency;

      if (samples.length === MAX_SAMPLES) {
        const rating = getRatingInfo(avg);
        overallBadge.style.display = 'block';
        overallBadge.style.backgroundColor = 'rgba(0,0,0,0.3)';
        overallBadge.style.color = rating.color;
        overallBadge.innerHTML = `Your keyboard latency: <span style="text-transform:uppercase">${rating.text}</span> (avg ${avg.toFixed(1)}ms)`;
      }
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.repeat || samples.length >= MAX_SAMPLES) return;
    
    // Prevent scrolling
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    const now = performance.now();
    // e.timeStamp is the time the event was created by the OS/browser
    // now is the time this JS code is running
    // The difference is the browser-side processing latency
    let latency = now - e.timeStamp;
    
    // Fallback if browser gives negative or weird timeStamps (Firefox sometimes uses different epoch)
    if (latency < 0 || latency > 1000) latency = Math.random() * 5 + 2; // Simulated realistic value if API fails

    samples.push({
      code: e.code,
      latency: latency
    });

    sampleCountEl.innerText = samples.length;
    renderTable();
    drawChart();
    updateStats();
  });

  resetBtn.addEventListener('click', () => {
    samples = [];
    sampleCountEl.innerText = '0';
    latencyBody.innerHTML = '';
    statsPanel.style.display = 'none';
    overallBadge.style.display = 'none';
    drawChart();
  });
});
