export const runtime = "edge";               // fast, cold-start free
export const preferredRegion = "iad1";       // optional
export const dynamic = "force-dynamic";      // don’t cache builds

// ---------- config ----------
const HARD_LIMIT_MS = 12000;   // total time budget for this request (12s)
const PAGE_TIMEOUT_MS = 8000;  // timeout for the main HTML fetch
const CSS_TIMEOUT_MS  = 2000;  // per-CSS file timeout
const MAX_CSS_FILES   = 8;     // cap linked stylesheets we scan
// ----------------------------

const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
const isHttp = (u) => { try { return /^https?:$/i.test(new URL(u).protocol); } catch { return false; } };
const toAbs  = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };
const fromSrcset = (ss) => (ss || "").split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
const isImg = (u) => /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico|cur|apng)(\?|#|$)/i.test(u);

const now = () => Date.now();

function withTimeout(ms) {
  // Edge supports AbortController; use it to bound fetch length
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort("timeout"), ms);
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

async function fetchText(url, ms) {
  const { signal, clear } = withTimeout(ms);
  try {
    const res = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,text/css,*/*",
        "accept-language": "en-US,en;q=0.9",
        "referer": new URL(url).origin + "/"
      }
    });
    const text = await res.text();
    if (!res.ok) {
      const snippet = text.slice(0, 200).replace(/\s+/g, " ");
      throw new Error(`Upstream ${res.status} ${res.statusText}: ${snippet}`);
    }
    return text;
  } finally {
    clear();
  }
}

function extractFromHtml(html, baseUrl) {
  const out = new Set();

  // <img ...> (src + common lazy attrs + srcset)
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

async function extractFromExternalCss(html, baseUrl, perFileTimeout, maxFiles, timeLeftMs) {
  if (timeLeftMs <= 0) return new Set();

  const hrefs = Array.from(
    html.matchAll(/<link\b[^>]*?rel=["'][^"']*stylesheet[^"']*["'][^>]*?href\s*=\s*("([^"]+)"|'([^']+)'|([^>\s]+))/gi),
    (m) => (m[2] ?? m[3] ?? m[4])?.trim()
  ).filter(Boolean).map((h) => toAbs(h, baseUrl)).filter(Boolean);

  const cssUrls = [...new Set(hrefs)].slice(0, maxFiles);
  const out = new Set();

  // Fetch CSS with per-file timeout and stop if we’re out of budget
  for (const cssUrl of cssUrls) {
    if (timeLeftMs() <= 0) break;
    try {
      const cssText = await fetchText(cssUrl, Math.min(perFileTimeout, timeLeftMs()));
      let m; while ((m = CSS_URL_RE.exec(cssText))) {
        const abs = toAbs(m[1], cssUrl); if (abs && isImg(abs)) out.add(abs);
      }
    } catch { /* ignore CSS fetch errors/timeouts */ }
  }
  return out;
}

export async function GET(req) {
  const start = now();
  const timeLeft = () => Math.max(0, HARD_LIMIT_MS - (now() - start));

  const { searchParams } = new URL(req.url);
  const input = searchParams.get("url");
  const scanCss = ["1","true","yes"].includes((searchParams.get("css") || "").toLowerCase());

  if (!input) return Response.json({ error: "Missing ?url=" }, { status: 400 });

  let target;
  try { target = new URL(input); } catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }
  if (!isHttp(target.href)) return Response.json({ error: "Only http/https URLs are allowed" }, { status: 400 });

  try {
    // Main page fetch (bounded)
    const html = await fetchText(target.href, Math.min(PAGE_TIMEOUT_MS, timeLeft()));
    const images = extractFromHtml(html, target.href);

    if (scanCss && timeLeft() > 0) {
      const cssImages = await extractFromExternalCss(
        html,
        target.href,
        CSS_TIMEOUT_MS,
        MAX_CSS_FILES,
        timeLeft
      );
      cssImages.forEach((u) => images.add(u));
    }

    const list = [...images];
    return Response.json(
      { pageUrl: target.href, count: list.length, images: list, mode: "edge" },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    // Return quickly with the error instead of letting the platform time out
    return Response.json({ error: e.message, mode: "edge" }, { status: 502 });
  }
}
