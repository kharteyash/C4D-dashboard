// Netlify serverless function: scrape "Today's Mortgage Rates" from Mortgage
// News Daily server-side and return the 6 headline rate products.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseRates(html) {
  const nameRe = /rate-product-name hidden-xs">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g;
  const names = [], idxs = [];
  let m;
  while ((m = nameRe.exec(html))) {
    names.push(m[1].replace(/\s+/g, " ").trim());
    idxs.push(m.index);
  }
  const out = [];
  for (let k = 0; k < names.length; k++) {
    const chunk = html.slice(idxs[k], k + 1 < idxs.length ? idxs[k + 1] : html.length);
    const rateM = chunk.match(/<div class="rate">\s*([0-9.]+%)\s*<\/div>/);
    const chgM = chunk.match(/rate-daily-chg change rate-([a-z]+)[^>]*>\s*([^<]+?)\s*<\/div>/);
    if (rateM) {
      const change = chgM ? chgM[2].replace(/&#x2B;/gi, "+").replace(/&minus;/gi, "-").trim() : "";
      out.push({ name: names[k], rate: rateM[1], change, dir: chgM ? chgM[1] : "unchanged" });
    }
  }
  return out;
}

exports.handler = async () => {
  try {
    const res = await fetch("https://www.mortgagenewsdaily.com/mortgage-rates", {
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" }
    });
    if (!res.ok) throw new Error("MND " + res.status);
    const html = await res.text();
    const rates = parseRates(html).slice(0, 6);
    if (!rates.length) throw new Error("no rates parsed");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ rates })
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: String(e) })
    };
  }
};
