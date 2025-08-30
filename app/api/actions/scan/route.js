import cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toAbs = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };
const fromSrcset = (ss) => (ss || "").split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
const isImg = (u) => /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico)(\?|#|$)/i.test(u);

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "referer": new URL(url).origin + "/",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    const snippet = text.slice(0, 250).replace(/\s+/g, " ");
    throw new Error(`Upstream ${res.status} ${res.statusText}: ${snippet}`);
  }
  return text;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("url");
  if (!input) return Response.json({ error: "Missing ?url=" }, { status: 400 });

  let target;
  try { target = new URL(input); } catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }
  if (!/^https?:$/i.test(target.protocol)) return Response.json({ error: "Only http/https allowed" }, { status: 400 });

  try {
    const html = await fetchHtml(target.href);
    const $ = cheerio.load(html);
    const found = new Set();

    $("img").each((_, el) => {
      ["src","data-src","data-original","data-lazy","data-lazy-src"].forEach(a => {
        const v = $(el).attr(a); if (v) { const abs = toAbs(v, target.href); if (abs) found.add(abs); }
      });
      fromSrcset($(el).attr("srcset")).forEach(u => { const abs = toAbs(u, target.href); if (abs) found.add(abs); });
    });

    $("source[srcset]").each((_, el) => {
      fromSrcset($(el).attr("srcset")).forEach(u => { const abs = toAbs(u, target.href); if (abs) found.add(abs); });
    });

    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      let m; while ((m = CSS_URL_RE.exec(style))) {
        const abs = toAbs(m[1], target.href); if (abs && isImg(abs)) found.add(abs);
      }
    });

    const images = [...found];
    return Response.json({ pageUrl: target.href, count: images.length, images });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
