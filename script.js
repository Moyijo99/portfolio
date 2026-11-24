(function () {
  // ---------- footer year ----------
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Abuja clock (WAT) ----------
  const clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    try {
      clock.textContent = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Lagos',
      });
    } catch (err) {
      clock.textContent = '--:--';
    }
  }
  tick();
  setInterval(tick, 30000);

  // ---------- copy email ----------
  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('moyeedjo@gmail.com');
        copyBtn.textContent = 'Copied ✓';
      } catch (err) {
        copyBtn.textContent = 'Copy failed';
      }
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
    });
  }

  // ---------- live weather (written hourly by the GitHub Actions job) ----------
  function relativeTime(iso) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const riskClass = { Low: 'risk-low', Moderate: 'risk-moderate', High: 'risk-high' };
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  async function loadLiveWeather() {
    try {
      const res = await fetch('data/weather.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      const temp = Math.round(d.temperatureC);

      set('w-temp', `${temp}°`);
      set('w-cond', d.conditions);
      set('w-pop', `${d.precipitationProbabilityPct}%`);
      set('w-mm', `${d.precipitationMm} mm`);
      set('w-wind', `${d.windSpeedKmh} km/h`);
      set('w-updated', `last run ${relativeTime(d.fetchedAt)} · pulled from ${d.source}`);

      const risk = document.getElementById('w-risk');
      if (risk) {
        risk.textContent = `● Risk: ${d.riskLevel}`;
        if (riskClass[d.riskLevel]) risk.classList.add(riskClass[d.riskLevel]);
      }

      set('strip-weather', `${temp}°C · ${String(d.conditions).toUpperCase()} ↗`);
    } catch (err) {
      set('w-cond', 'Pipeline unreachable right now');
      set('w-updated', 'refreshes hourly — check back shortly');
    }
  }

  loadLiveWeather();
})();
