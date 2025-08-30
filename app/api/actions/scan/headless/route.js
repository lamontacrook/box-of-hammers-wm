import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("url");
  if (!input) return Response.json({ error: "Missing ?url=" }, { status: 400 });

  let target;
  try { target = new URL(input); } catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }
  if (!/^https?:$/i.test(target.protocol)) return Response.json({ error: "Only http/https allowed" }, { status: 400 });

  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless, // true on Vercel
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    await page.goto(target.href, { waitUntil: "networkidle0", timeout: 30000 });

    const images = await page.evaluate(() => {
      const toAbs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
      const fromSrcset = (ss) => (ss || "").split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
      const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
      const isImg = (u) => /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico)(\?|#|$)/i.test(u);

      const out = new Set();

      document.querySelectorAll("img").forEach(img => {
        if (img.src) out.add(toAbs(img.src));
        ["data-src","data-original","data-lazy","data-lazy-src"].forEach(a => {
          const v = img.getAttribute(a); if (v) out.add(toAbs(v));
        });
        fromSrcset(img.getAttribute("srcset")).forEach(u => out.add(toAbs(u)));
      });

      document.querySelectorAll("source[srcset]").forEach(s => {
        fromSrcset(s.getAttribute("srcset")).forEach(u => out.add(toAbs(u)));
      });

      document.querySelectorAll("[style]").forEach(el => {
        const style = el.getAttribute("style") || "";
        let m; while ((m = CSS_URL_RE.exec(style))) {
          const abs = toAbs(m[1]); if (abs && isImg(abs)) out.add(abs);
        }
      });

      return [...out].filter(Boolean);
    });

    return Response.json({ pageUrl: target.href, count: images.length, images });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  } finally {
    await browser.close();
  }
}
