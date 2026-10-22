import { chromium } from "playwright-core";
import fs from "node:fs";
const [,, base, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars", "--disable-gpu"] });
async function open(w, h, q) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", q, e.message));
  await page.goto(`${base}/?theme=d1&${q}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".intake .choice", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
async function toStep(page, companyIndex, step) {
  await page.locator(".choices .choice").nth(companyIndex).click();
  await page.waitForTimeout(250);
  await page.locator(".intake__nav .button--primary").click(); // work -> next
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const title = await page.locator(".intake__title").innerText();
    if ((step === "users" && /people on your team/i.test(title)) || (step === "budget" && /budget/i.test(title))) break;
    await page.locator(".intake__nav .button--primary").click();
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}
// Layout studies: company step
for (const layout of ["list", "row5", "grid6"]) {
  for (const [w, h, tag] of [[1440, 1000, "desktop"], [390, 844, "phone"]]) {
    const { ctx, page } = await open(w, h, `layout=${layout}`);
    await shot(page, `layout-${layout}-${tag}`);
    if (tag === "phone") await page.screenshot({ path: `${outDir}/layout-${layout}-phone-full.png`, fullPage: true });
    await ctx.close();
  }
}
// Control studies
for (const control of ["slider", "stepper"]) {
  for (const [w, h, tag] of [[1440, 1000, "desktop"], [390, 844, "phone"]]) {
    let { ctx, page } = await open(w, h, `layout=grid6&control=${control}`);
    await toStep(page, 1, "users");
    await shot(page, `control-${control}-team-${tag}`);
    if (tag === "desktop") {
      // keyboard: tab to the slider, move it with the arrow keys, show the focus ring
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => document.activeElement?.classList.contains("cc__range"))) break;
      }
      for (let i = 0; i < 40; i++) await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(300);
      await shot(page, `control-${control}-team-focus-desktop`);
    }
    await ctx.close();
    ({ ctx, page } = await open(w, h, `layout=grid6&control=${control}`));
    await toStep(page, 1, "budget");
    const input = page.locator(".cc__input");
    await input.fill("20M");
    await input.press("Enter");
    await page.waitForTimeout(500);
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.waitForTimeout(200);
    await shot(page, `control-${control}-budget-${tag}`);
    await ctx.close();
  }
  // large-company preset set
  const { ctx, page } = await open(1440, 1000, `layout=grid6&control=${control}`);
  await toStep(page, 2, "users");
  await shot(page, `control-${control}-team-enterprise-desktop`);
  await ctx.close();
}
await browser.close();
console.log("ok");
