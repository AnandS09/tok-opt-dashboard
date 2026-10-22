// Renders pattern-sheet.html with headless system Chrome: desktop 1440 and a 390 strip, in colour and greyscale.
// Usage: node render.mjs <path to playwright-core> (playwright-core lives outside the repo; any install works).
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(process.argv[2] ?? "playwright-core");
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--allow-file-access-from-files"] });
for (const [w, tag] of [[1440, "desktop-1440"], [390, "phone-390"]]) {
  for (const grey of [false, true]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    await page.goto("file://" + path.join(here, "pattern-sheet.html"), { waitUntil: "networkidle" });
    await page.waitForSelector("body[data-ready='1']");
    if (grey) await page.evaluate(() => document.documentElement.classList.add("grey"));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(here, `pattern-sheet-${tag}${grey ? "-greyscale" : ""}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
console.log("rendered");
