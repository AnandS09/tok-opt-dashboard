// Written for the scratch copy of the app; adjust the paths (arguments, Chrome location, theme folder) before reuse.
import { chromium } from "playwright-core";
import fs from "node:fs";
const [,, base, theme, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars", "--disable-gpu"] });
const url = `${base}/?theme=${theme}`;
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}
async function fresh(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", theme, e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", theme, m.text()); });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".intake .choice", { timeout: 20000 });
  await settle(page);
  return { ctx, page };
}
async function toResult(page) {
  await page.locator(".examples .chip").first().click();
  await page.waitForSelector(".hero", { timeout: 20000 });
  await page.waitForSelector(".chart-card canvas", { timeout: 20000 });
  await settle(page);
  // nudge a resize so charts re-measure with loaded web fonts
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.width - 1, height: vp.height });
  await page.waitForTimeout(200);
  await page.setViewportSize(vp);
  await page.waitForTimeout(900);
}
// desktop
{
  const { ctx, page } = await fresh(1440, 1000);
  await page.screenshot({ path: `${outDir}/d1-intake.png` });
  // later step: company -> work -> continue -> users
  await page.locator(".intake .choice").nth(1).click();
  await page.waitForTimeout(300);
  await page.locator(".intake__nav .button--primary").click();
  await page.waitForTimeout(500);
  await settle(page);
  await page.screenshot({ path: `${outDir}/d2-intake-later.png` });
  await ctx.close();
}
{
  const { ctx, page } = await fresh(1440, 1000);
  await toResult(page);
  await page.evaluate(() => { const h = document.querySelector(".hero"); window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 24); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/d3-result-stage.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/d4-result-full.png`, fullPage: true });
  await ctx.close();
}
// phone
{
  const { ctx, page } = await fresh(390, 844);
  await page.screenshot({ path: `${outDir}/p1-intake.png` });
  await toResult(page);
  await page.evaluate(() => { const h = document.querySelector(".hero"); window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 12); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/p2-result-stage.png` });
  await ctx.close();
}
await browser.close();
console.log("ok", theme);
