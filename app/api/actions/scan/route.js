export const runtime = "edge";              // run at the Edge
export const preferredRegion = "iad1";      // optional: pick a close region

const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
const isHttp = (u) => { try { return /^https?:$/i.test(new URL(u).protocol); } catch { return false; } };
const toAbs = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };
const fromSrcset = (ss) => (ss || "").split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
const isImg = (u) => /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico|cur|apng)(\?|#|$)/i.test(u);

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,text/css,*/*",
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

function extractFromHtml(html, baseUrl) {
  const out = new Set();

  // <img ...> (src + lazy attrs + srcset)
  html.replace(/<img\b[^>]*?>/gi, (tag) => {
    const grab = (name) => {
      const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]+)"|'([^']+)'|([^\\s"'>]+))`, "i"));
      return m ? (m[2] ?? m[3] ?? m[4]) : null;
    };
    ["src", "data-src", "data-original", "data-lazy", "data-lazy-src"].forEach((a) => {
      const v = grab(a); if (v) { const abs = toAbs(v, baseUrl); if (abs) out.add(abs); }
    });
    const ss = grab("srcset");
    if (ss) fromSrcset(ss).forEach((u) => { const abs = toAbs(u, baseUrl); if (abs) out.add(abs); });
    return tag;
  });

  // <source srcset="...">
  html.replace(/<source\b[^>]*?\bsrcset\s*=\s*("[^"]+"|'[^']+'|[^>\s]+)/gi, (m) => {
    const ss = m.split("=")[1]?.replace(/^['"]|['"]$/g, "");
    fromSrcset(ss).forEach((u) => { const abs = toAbs(u, baseUrl); if (abs) out.add(abs); });
    return m;
  });

  // inline style="...url(...)..."
  let styleMatch;
  while ((styleMatch = /style\s*=\s*"(.*?)"|style\s*=\s*'(.*?)'/gis.exec(html))) {
    const css = styleMatch[1] ?? styleMatch[2] ?? "";
    let m; while ((m = CSS_URL_RE.exec(css))) {
      const abs = toAbs(m[1], baseUrl); if (abs && isImg(abs)) out.add(abs);
    }
  }

  return out;
}

async function extractFromExternalCss(html, baseUrl) {
  const hrefs = Array.from(
    html.matchAll(/<link\b[^>]*?rel=["'][^"']*stylesheet[^"']*["'][^>]*?href\s*=\s*("([^"]+)"|'([^']+)'|([^>\s]+))/gi),
    (m) => (m[2] ?? m[3] ?? m[4])?.trim()
  ).filter(Boolean).map((h) => toAbs(h, baseUrl)).filter(Boolean);

  const uniqueCssUrls = [...new Set(hrefs)].slice(0, 15);
  const out = new Set();

  for (const cssUrl of uniqueCssUrls) {
    try {
      const cssText = await fetchText(cssUrl);
      let m; while ((m = CSS_URL_RE.exec(cssText))) {
        const abs = toAbs(m[1], cssUrl); if (abs && isImg(abs)) out.add(abs);
      }
    } catch { /* ignore */ }
  }
  return out;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("url");
  const scanCss = ["1","true","yes"].includes((searchParams.get("css") || "").toLowerCase());

  if (!input) return Response.json({ error: "Missing ?url=" }, { status: 400 });

  let target;
  try { target = new URL(input); } catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }
  if (!isHttp(target.href)) return Response.json({ error: "Only http/https URLs are allowed" }, { status: 400 });

  try {
    const html = await fetchText(target.href);
    const images = extractFromHtml(html, target.href);
    if (scanCss) {
      const cssImages = await extractFromExternalCss(html, target.href);
      cssImages.forEach((u) => images.add(u));
    }
    const list = [...images];
    return Response.json({ pageUrl: target.href, count: list.length, images: list }, {
      headers: { "cache-control": "no-store" }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
