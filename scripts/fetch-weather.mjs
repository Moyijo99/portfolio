// Ingestion + classification step for the Abuja Weather Intelligence pipeline.
// Run on a schedule by .github/workflows/update-weather.yml, writes data/weather.json,
// which the portfolio's Live Data section reads client-side.

const LAT = 9.0765;
const LON = 7.3986;
const OUT_PATH = new URL('../data/weather.json', import.meta.url);

const WMO_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

function classifyRisk(precipProbabilityPct, precipMm) {
  if (precipProbabilityPct >= 70 || precipMm >= 4) return 'High';
  if (precipProbabilityPct >= 35 || precipMm >= 0.5) return 'Moderate';
  return 'Low';
}

async function main() {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', LAT);
  url.searchParams.set('longitude', LON);
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('hourly', 'precipitation_probability');
  url.searchParams.set('timezone', 'Africa/Lagos');
  url.searchParams.set('forecast_days', '1');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status} ${res.statusText}`);
  }
  const raw = await res.json();

  const currentHourIso = raw.current.time.slice(0, 13);
  const hourIndex = raw.hourly.time.findIndex((t) => t.slice(0, 13) === currentHourIso);
  const precipProbability = hourIndex >= 0 ? raw.hourly.precipitation_probability[hourIndex] : 0;

  const record = {
    fetchedAt: new Date().toISOString(),
    location: 'Abuja, Nigeria',
    coordinates: { lat: LAT, lon: LON },
    temperatureC: raw.current.temperature_2m,
    windSpeedKmh: raw.current.wind_speed_10m,
    precipitationMm: raw.current.precipitation,
    precipitationProbabilityPct: precipProbability,
    conditions: WMO_CODES[raw.current.weather_code] ?? `WMO code ${raw.current.weather_code}`,
    riskLevel: classifyRisk(precipProbability, raw.current.precipitation),
    source: 'open-meteo.com',
  };

  await import('node:fs/promises').then((fs) =>
    fs.mkdir(new URL('../data/', import.meta.url), { recursive: true })
  );
  const fs = await import('node:fs/promises');
  await fs.writeFile(OUT_PATH, JSON.stringify(record, null, 2) + '\n');

  console.log('Wrote data/weather.json:', record);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
