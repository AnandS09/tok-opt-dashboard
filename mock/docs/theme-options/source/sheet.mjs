// Written for the scratch copy of the app; adjust the paths (arguments, Chrome location, theme folder) before reuse.
import { chromium } from "playwright-core";
const [,, html, out] = process.argv;
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args:["--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 1.5 });
await p.goto("file://" + html, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
await p.screenshot({ path: out, fullPage: true });
await b.close(); console.log("sheet ok");
