// Netlify serverless function: fetch real U.S. index levels from Yahoo Finance
// server-side (Finnhub's free tier doesn't provide raw indices).

const SYMBOLS = [
  { yahoo: "%5EGSPC", label: "S&P 500" },
  { yahoo: "%5EDJI",  label: "DOW" },
  { yahoo: "%5EIXIC", label: "NASDAQ" }
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchOne(s) {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + s.yahoo + "?interval=1d&range=1d";
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(s.label + " " + res.status);
  const data = await res.json();
  const meta = data.chart.result[0].meta;
  const price = meta.regularMarketPrice;
  const prev = (meta.chartPreviousClose != null ? meta.chartPreviousClose : meta.previousClose);
  const chgPct = prev ? ((price - prev) / prev) * 100 : 0;
  return { label: s.label, price, chgPct };
}

exports.handler = async () => {
  const results = await Promise.allSettled(SYMBOLS.map(fetchOne));
  const quotes = results
    .filter(r => r.status === "fulfilled" && isFinite(r.value.price))
    .map(r => r.value);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ quotes })
  };
};
