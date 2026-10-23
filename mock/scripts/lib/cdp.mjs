// Minimal headless Chrome driver over the DevTools protocol (Node 22's built-in WebSocket).
// Development tooling for the scripts in this folder; the app never imports it.
// Chrome is found at CHROME, else at the usual macOS path.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch(port) {
  const dir = mkdtempSync(join(tmpdir(), "chrome-prof-"));
  const proc = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${dir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) break;
    } catch {}
    await sleep(200);
  }
  return {
    port,
    close() {
      proc.kill();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {}
    },
  };
}

const KEYS = { ArrowLeft: 37, ArrowRight: 39, Escape: 27, Tab: 9, Enter: 13, " ": 32 };

export async function newPage(port) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method === "Runtime.consoleAPICalled") {
      logs.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`);
    } else if (msg.method === "Runtime.exceptionThrown") {
      logs.push(`EXC: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send("Page.enable");
  await send("Runtime.enable");
  const page = {
    send,
    logs,
    async viewport(width, height, mobile = false) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
      await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
    },
    async goto(url, wait = 900) {
      await send("Page.navigate", { url });
      await sleep(wait);
    },
    async eval(expr) {
      const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    /** Waits until `expr` is truthy, up to `ms`; returns whether it became so. */
    async waitFor(expr, ms = 8000) {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        try {
          if (await page.eval(expr)) return true;
        } catch {}
        await sleep(100);
      }
      return false;
    },
    async shot(path, fullPage = false, mobile = false) {
      if (fullPage) {
        const h = await page.eval("document.documentElement.scrollHeight");
        const w = await page.eval("document.documentElement.clientWidth");
        await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
        await sleep(500);
      }
      const r = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(path, Buffer.from(r.data, "base64"));
    },
    async key(key) {
      const vk = KEYS[key] ?? 0;
      const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
      await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code: key, windowsVirtualKeyCode: vk, text });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: vk });
    },
    async swipe(x1, y, x2) {
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y }] });
      for (let i = 1; i <= 6; i++) {
        await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + ((x2 - x1) * i) / 6, y }] });
      }
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    close() {
      ws.close();
    },
  };
  return page;
}
