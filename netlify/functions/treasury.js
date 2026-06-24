// Netlify serverless function: fetch the U.S. 10-Year Treasury quote from CNBC
// server-side (no browser CORS limits), and return just the fields we need.
exports.handler = async () => {
  const url =
    "https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol" +
    "?symbols=US10Y&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json&events=1";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://www.cnbc.com/quotes/US10Y",
        "Origin": "https://www.cnbc.com",
      },
    });
    if (!res.ok) throw new Error("CNBC status " + res.status);

    const data = await res.json();
    const q = data.FormattedQuoteResult.FormattedQuote[0];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        last: q.last,
        change: q.change,
        change_pct: q.change_pct,
        changetype: q.changetype,
        time: q.last_timedate,
      }),
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
