// Netlify serverless function: 10-Year Treasury yield history (^TNX) from Yahoo,
// server-side so it stays current (FRED only publishes end-of-day, a day behind).
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

exports.handler = async () => {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=6mo";
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error("Yahoo " + res.status);
    const data = await res.json();
    const r = data.chart.result[0];
    const ts = r.timestamp || [];
    const cl = (r.indicators.quote[0] || {}).close || [];

    // One point per day (skip gaps), correctly-scaled yield in percent.
    const map = new Map();
    for (let i = 0; i < ts.length; i++) {
      const v = cl[i];
      if (v == null) continue;
      const day = new Date(ts[i] * 1000).toISOString().slice(0, 10);
      map.set(day, Math.round(v * 1000) / 1000);
    }
    const series = [...map].map(([time, value]) => ({ time, value }));
    const last = series.length ? series[series.length - 1].value : null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ series, last })
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: String(e) })
    };
  }
};
