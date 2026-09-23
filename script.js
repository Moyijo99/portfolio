(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  if (stored) {
    applyTheme(stored);
  } else if (prefersDark) {
    applyTheme('dark');
  }

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  function relativeTime(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const riskClass = { Low: 'risk-low', Moderate: 'risk-moderate', High: 'risk-high' };

  async function loadLiveWeather() {
    const card = document.getElementById('live-weather-card');
    if (!card) return;
    try {
      const res = await fetch('data/weather.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      card.innerHTML = `
        <div class="live-main">
          <div class="live-temp">${Math.round(data.temperatureC)}°C</div>
          <div class="live-meta">
            <div class="live-location">${data.location}</div>
            <div class="live-conditions">${data.conditions}</div>
          </div>
          <div class="risk-badge ${riskClass[data.riskLevel] || ''}">${data.riskLevel} precipitation risk</div>
        </div>
        <div class="live-stats">
          <div class="live-stat"><span class="live-stat-num">${data.windSpeedKmh} km/h</span><span class="live-stat-label">wind speed</span></div>
          <div class="live-stat"><span class="live-stat-num">${data.precipitationProbabilityPct}%</span><span class="live-stat-label">precipitation chance</span></div>
          <div class="live-stat"><span class="live-stat-num">${data.precipitationMm} mm</span><span class="live-stat-label">precipitation now</span></div>
        </div>
        <p class="live-updated">Last refreshed ${relativeTime(data.fetchedAt)} · pulled from ${data.source}</p>
      `;
    } catch (err) {
      card.innerHTML = `<p class="live-status">Pipeline hasn't run yet, or is unreachable from here. It refreshes hourly — check back shortly.</p>`;
    }
  }

  loadLiveWeather();
})();
