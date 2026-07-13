// Netlify serverless function: fetch the chosen mortgage/real-estate RSS feeds
// server-side (no browser CORS, no proxy rate limits), combine and interleave
// their headlines, and return a single mixed list.

const FEEDS = [
  { name: "Mortgage News Daily",     url: "https://www.mortgagenewsdaily.com/rss/full" },
  { name: "The Mortgage Reports",    url: "https://themortgagereports.com/feed" },
  { name: "HousingWire",             url: "https://www.housingwire.com/feed/" },
  { name: "Redfin News",             url: "https://www.redfin.com/news/feed/" },
  { name: "CNBC Real Estate",        url: "https://www.cnbc.com/id/10000115/device/rss/rss.html" },
  { name: "Keeping Current Matters", url: "https://www.keepingcurrentmatters.com/feed/" },
  { name: "Truth About Mortgage",    url: "https://www.thetruthaboutmortgage.com/feed/" },
  { name: "Inman",                   url: "https://feeds.feedburner.com/inmannews" }
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")          // strip any stray tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
}

// Pull item/entry titles out of an RSS or Atom feed (dependency-free).
function extractTitles(xml, limit) {
  const titles = [];
  const blocks = xml.split(/<(?:item|entry)[\s>]/i).slice(1);
  for (const b of blocks) {
    const m = b.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (m) {
      const t = decodeEntities(m[1]).replace(/\s+/g, " ").trim();
      if (t) titles.push(t);
    }
    if (titles.length >= limit) break;
  }
  return titles;
}

async function fetchFeed(feed, perFeed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": UA, "Accept": "application/rss+xml,application/xml,text/xml,*/*" }
  });
  if (!res.ok) throw new Error(feed.name + " " + res.status);
  const xml = await res.text();
  return extractTitles(xml, perFeed);
}

exports.handler = async () => {
  const perFeed = 6;
  const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f, perFeed)));
  const lists = results.map(r => (r.status === "fulfilled" ? r.value : []));

  // Round-robin interleave so the ticker mixes sources rather than grouping them.
  const headlines = [];
  for (let i = 0; i < perFeed; i++) {
    for (const list of lists) {
      if (list[i]) headlines.push(list[i]);
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ headlines })
  };
};
