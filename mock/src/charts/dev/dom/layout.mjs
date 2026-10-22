// Minimal CSS layout model for jsdom, so elements report the sizes a browser
// would. It reads the real stylesheets (document.styleSheets) plus inline
// styles, and implements just enough of block, flex, grid, aspect-ratio and
// percentage-height rules to size a chart card and the chart container inside it. Everything else is approximate.

export const VIEWPORT = { w: 1280, h: 800 };

const LINE = 21;

function px(v) {
  const m = /^(-?[\d.]+)px$/.exec(String(v).trim());
  return m ? parseFloat(m[1]) : null;
}

export function makeLayout(window) {
  const doc = window.document;

  // ---- style lookup ------------------------------------------------------
  function rulesFor(el) {
    const out = [];
    const walk = (rules) => {
      for (const r of rules) {
        if (r.cssRules && r.media) {
          const text = r.media.mediaText;
          const m = /max-width:\s*(\d+)px/.exec(text);
          if (m && VIEWPORT.w <= parseInt(m[1], 10)) walk(r.cssRules);
          continue;
        }
        if (!r.selectorText || !r.style) continue;
        for (const sel of r.selectorText.split(",")) {
          let ok = false;
          try {
            ok = el.matches(sel.trim());
          } catch {
            ok = false;
          }
          if (ok) out.push(r.style);
        }
      }
    };
    for (const sheet of doc.styleSheets) walk(sheet.cssRules);
    return out;
  }

  const cache = new WeakMap();
  function sigOf(el) {
    let sig = `${el.tagName}|${el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className}|${el.getAttribute("style") || ""}`;
    let p = el.parentElement;
    for (let i = 0; i < 6 && p; i++, p = p.parentElement) sig += `|${p.className}`;
    return sig;
  }
  function styleOf(el) {
    const sig = sigOf(el);
    let c = cache.get(el);
    if (c && c.sig === sig) return c.decls;
    const decls = {};
    for (const s of rulesFor(el)) {
      for (let i = 0; i < s.length; i++) {
        const name = s[i];
        decls[name] = s.getPropertyValue(name);
      }
    }
    const inline = el.style;
    for (let i = 0; i < inline.length; i++) decls[inline[i]] = inline.getPropertyValue(inline[i]);
    // Shorthands we care about.
    cache.set(el, { sig, decls });
    return decls;
  }

  const BLOCK = new Set(["DIV", "SECTION", "FIGURE", "FIGCAPTION", "P", "UL", "LI", "H1", "H2", "H3", "MAIN", "HEADER", "FOOTER", "TABLE", "FORM", "FIELDSET", "LEGEND", "ASIDE", "NAV", "BODY", "HTML", "OL", "THEAD", "TBODY", "TR", "CAPTION"]);
  function display(el) {
    const s = styleOf(el);
    if (s.display) return s.display.trim();
    return BLOCK.has(el.tagName) ? "block" : "inline-block";
  }

  function lenOf(raw, basis, vertical) {
    if (raw === undefined || raw === null) return null;
    const v = String(raw).trim();
    if (v === "" || v === "auto" || v === "none") return null;
    if (px(v) !== null) return px(v);
    let m = /^([\d.]+)%$/.exec(v);
    if (m) return basis === null || basis === undefined ? null : (parseFloat(m[1]) / 100) * basis;
    m = /^([\d.]+)rem$/.exec(v);
    if (m) return parseFloat(m[1]) * 16;
    m = /^([\d.]+)vh$/.exec(v);
    if (m) return (parseFloat(m[1]) / 100) * VIEWPORT.h;
    m = /^calc\((.*)\)$/.exec(v);
    if (m) {
      // only "a * -1" and "a * -2" of px occur; evaluate simple product
      const p = /^var\(.*\)\s*\*\s*(-?\d+)$/.exec(m[1]);
      if (p) return 0;
      return null;
    }
    m = /^clamp\((.*)\)$/.exec(v);
    if (m) {
      const parts = m[1].split(",").map((x) => lenOf(x.trim(), basis, vertical));
      if (parts.some((x) => x === null)) return null;
      return Math.min(Math.max(parts[1], parts[0]), parts[2]);
    }
    return null;
  }

  function sides(s, prop) {
    // returns [top,right,bottom,left] from shorthand or longhands, px only
    const out = [0, 0, 0, 0];
    const sh = s[prop];
    if (sh) {
      const t = sh.trim().split(/\s+/).map((x) => (px(x) ?? 0));
      if (t.length === 1) return [t[0], t[0], t[0], t[0]];
      if (t.length === 2) return [t[0], t[1], t[0], t[1]];
      if (t.length === 3) return [t[0], t[1], t[2], t[1]];
      if (t.length === 4) return t;
    }
    ["top", "right", "bottom", "left"].forEach((side, i) => {
      const v = s[`${prop}-${side}`];
      if (v !== undefined) out[i] = px(v) ?? 0;
    });
    return out;
  }

  function borderWidth(s) {
    const b = s.border;
    if (b && b.trim() !== "0" && b.trim() !== "none") {
      const w = px(b.trim().split(/\s+/)[0]);
      return w ?? 0;
    }
    const bw = s["border-width"] ?? s["border-top-width"];
    return bw ? px(bw) ?? 0 : 0;
  }

  const sizes = new WeakMap();

  function textInfo(el) {
    let text = "";
    let hasElement = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3) text += n.nodeValue;
      else if (n.nodeType === 1) hasElement = true;
    }
    return { text: text.trim(), hasElement };
  }

  function inFlowChildren(el) {
    return [...el.children].filter((c) => {
      const s = styleOf(c);
      const d = display(c);
      if (d === "none") return false;
      if (["absolute", "fixed"].includes((s.position || "").trim())) return false;
      if (["SCRIPT", "STYLE", "LINK", "TITLE"].includes(c.tagName)) return false;
      return true;
    });
  }

  function replacedSize(el, s) {
    if (el.tagName === "CANVAS") {
      const w = px(el.style.width) ?? el.width ?? 300;
      const h = px(el.style.height) ?? el.height ?? 150;
      return { w, h };
    }
    if (el.tagName === "SVG" || el.tagName === "svg" || el.tagName === "IMG" || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
      return { w: px(s.width) ?? 20, h: px(s.height) ?? 20 };
    }
    return null;
  }

  /**
   * Lays out `el` inside a containing block. `ctx`:
   *   availW  width of the containing block's content box
   *   availH  definite height of the containing block's content box, or null
   *   forceW / forceH  sizes imposed by a flex/grid container (border box)
   * Returns border-box {w, h}; records it and all descendants in `sizes`.
   */
  function layout(el, ctx) {
    const s = styleOf(el);
    const d = display(el);
    if (d === "none") {
      sizes.set(el, { w: 0, h: 0 });
      for (const c of el.children) layout(c, { availW: 0, availH: 0 });
      return { w: 0, h: 0 };
    }
    const rep = replacedSize(el, s);
    const [pt, pr, pb, pl] = sides(s, "padding");
    const bw = borderWidth(s);
    const insetX = pl + pr + 2 * bw;
    const insetY = pt + pb + 2 * bw;
    const { text, hasElement } = textInfo(el);

    // width
    let w;
    if (ctx.forceW !== undefined && ctx.forceW !== null) w = ctx.forceW;
    else if (rep) w = lenOf(s.width, ctx.availW) ?? rep.w;
    else {
      const declared = lenOf(s.width, ctx.availW);
      if (declared !== null) w = declared;
      else if (d === "inline-block" || d === "inline" || d === "inline-flex") {
        w = Math.min(ctx.availW, Math.max(0, (text.length || 6) * 7) + insetX);
        if (d === "inline-flex") w = Math.min(ctx.availW, (el.textContent || "").length * 7 + insetX);
      } else w = ctx.availW;
    }
    const maxW = lenOf(s["max-width"], ctx.availW);
    if (maxW !== null) w = Math.min(w, maxW);
    const cw = Math.max(0, w - insetX);

    // height declared / forced
    let h = null;
    let definite = false;
    if (ctx.forceH !== undefined && ctx.forceH !== null) {
      h = ctx.forceH;
      definite = true;
    } else if (rep) {
      h = lenOf(s.height, ctx.availH) ?? rep.h;
      definite = true;
    } else {
      const dh = lenOf(s.height, ctx.availH);
      if (dh !== null) {
        h = dh;
        definite = true;
      }
    }
    const minH = lenOf(s["min-height"], ctx.availH) ?? 0;

    // children
    const kids = inFlowChildren(el);
    const abs = [...el.children].filter((c) => !kids.includes(c));
    for (const c of abs) layout(c, { availW: cw, availH: null });
    let contentH = 0;
    const innerH = h === null ? null : Math.max(0, h - insetY);

    if (rep || (kids.length === 0 && !hasElement)) {
      if (!rep) {
        const lines = text ? Math.max(1, Math.ceil((text.length * 7) / Math.max(1, cw))) : 0;
        contentH = lines * LINE;
      }
    } else if (d === "flex" || d === "inline-flex") {
      contentH = layoutFlex(el, s, kids, cw, innerH);
    } else if (d === "grid") {
      contentH = layoutGrid(el, s, kids, cw);
    } else {
      contentH = layoutBlock(el, kids, cw, innerH);
      if (text) contentH += Math.max(1, Math.ceil((text.length * 7) / Math.max(1, cw))) * LINE;
    }

    if (h === null) {
      h = contentH + insetY;
      const ar = /^([\d.]+)\s*\/\s*([\d.]+)$/.exec((s["aspect-ratio"] || "").trim());
      if (ar) h = Math.max((w * parseFloat(ar[2])) / parseFloat(ar[1]), h);
    }
    h = Math.max(h, minH);
    sizes.set(el, { w, h });
    return { w, h, definite };
  }

  function layoutBlock(el, kids, cw, innerH) {
    let y = 0;
    for (const c of kids) {
      const cs = styleOf(c);
      const [mt, , mb] = sides(cs, "margin");
      const r = layout(c, { availW: cw, availH: innerH });
      y += mt + r.h + mb;
    }
    return y;
  }

  function parseFlex(cs) {
    const f = (cs.flex || "").trim();
    let grow = 0;
    let shrink = 1;
    let basis = "auto";
    if (f) {
      const t = f.split(/\s+/);
      if (t.length === 1 && /^[\d.]+$/.test(t[0])) {
        grow = parseFloat(t[0]);
        shrink = 1;
        basis = "0px";
      } else if (t.length === 1 && t[0] === "none") {
        grow = 0;
        shrink = 0;
      } else if (t.length === 1 && t[0] === "auto") {
        grow = 1;
      } else {
        grow = parseFloat(t[0]);
        if (t.length > 1 && /^[\d.]+$/.test(t[1])) shrink = parseFloat(t[1]);
        if (t.length > 2) basis = t[2];
        else if (t.length === 2 && !/^[\d.]+$/.test(t[1])) basis = t[1];
        else if (t.length === 2) basis = "0px";
      }
    }
    return { grow, shrink, basis };
  }

  function gapOf(s) {
    const g = (s.gap || "").trim().split(/\s+/);
    const row = px(s["row-gap"] ?? g[0]) ?? 0;
    const col = px(s["column-gap"] ?? g[1] ?? g[0]) ?? 0;
    return { row, col };
  }

  function layoutFlex(el, s, kids, cw, innerH) {
    const dir = (s["flex-direction"] || "row").trim();
    const gap = gapOf(s);
    if (dir === "column") {
      // pass 1: basis sizes
      const info = kids.map((c) => {
        const cs = styleOf(c);
        const f = parseFlex(cs);
        const [mt, , mb] = sides(cs, "margin");
        const minH = lenOf(cs["min-height"], innerH) ?? 0;
        let basisH;
        const declH = lenOf(cs.height, innerH);
        if (f.basis !== "auto") basisH = lenOf(f.basis, innerH) ?? 0;
        else if (declH !== null) basisH = declH;
        else basisH = layout(c, { availW: cw, availH: innerH }).h;
        return { c, f, mt, mb, minH, basisH, declH };
      });
      const gaps = gap.row * Math.max(0, kids.length - 1);
      const margins = info.reduce((a, i) => a + i.mt + i.mb, 0);
      let used = info.reduce((a, i) => a + i.basisH, 0) + gaps + margins;
      if (innerH !== null) {
        let free = innerH - used;
        if (free > 0) {
          const g = info.reduce((a, i) => a + i.f.grow, 0);
          if (g > 0) for (const i of info) i.basisH += (free * i.f.grow) / g;
        } else if (free < 0) {
          const sh = info.reduce((a, i) => a + i.f.shrink * i.basisH, 0);
          if (sh > 0) for (const i of info) i.basisH += (free * i.f.shrink * i.basisH) / sh;
        }
        for (const i of info) i.basisH = Math.max(i.basisH, i.minH);
        for (const i of info) layout(i.c, { availW: cw, availH: innerH, forceH: i.basisH });
        used = info.reduce((a, i) => a + i.basisH, 0) + gaps + margins;
        return used;
      }
      for (const i of info) layout(i.c, { availW: cw, availH: null, forceH: i.declH === null && i.f.basis === "auto" ? null : i.basisH });
      return info.reduce((a, i) => a + sizes.get(i.c).h, 0) + gaps + margins;
    }
    // row
    const info = kids.map((c) => {
      const cs = styleOf(c);
      const f = parseFlex(cs);
      const declW = lenOf(cs.width, cw);
      let basisW;
      if (f.basis !== "auto") basisW = lenOf(f.basis, cw) ?? 0;
      else if (declW !== null) basisW = declW;
      else basisW = layout(c, { availW: cw, availH: innerH }).w;
      return { c, f, basisW };
    });
    const gaps = gap.col * Math.max(0, kids.length - 1);
    let free = cw - info.reduce((a, i) => a + i.basisW, 0) - gaps;
    const g = info.reduce((a, i) => a + i.f.grow, 0);
    if (free > 0 && g > 0) for (const i of info) i.basisW += (free * i.f.grow) / g;
    else if (free < 0) {
      const sh = info.reduce((a, i) => a + i.f.shrink * i.basisW, 0);
      if (sh > 0) for (const i of info) i.basisW += (free * i.f.shrink * i.basisW) / sh;
    }
    let maxH = 0;
    for (const i of info) {
      const r = layout(i.c, { availW: cw, availH: innerH, forceW: Math.max(0, i.basisW) });
      maxH = Math.max(maxH, r.h);
    }
    const stretch = !["center", "flex-start", "baseline"].includes((s["align-items"] || "stretch").trim());
    if (stretch) {
      for (const i of info) {
        const cs = styleOf(i.c);
        if (lenOf(cs.height, innerH) === null) layout(i.c, { availW: cw, availH: innerH, forceW: Math.max(0, i.basisW), forceH: innerH ?? maxH });
      }
    }
    return maxH;
  }

  function layoutGrid(el, s, kids, cw) {
    const gap = gapOf(s);
    const tpl = (s["grid-template-columns"] || "").trim();
    let cols = [];
    const rep = /^repeat\(auto-fill,\s*minmax\((\d+)px,\s*1fr\)\)$/.exec(tpl);
    if (rep) {
      const min = parseInt(rep[1], 10);
      const n = Math.max(1, Math.floor((cw + gap.col) / (min + gap.col)));
      const w = (cw - gap.col * (n - 1)) / n;
      cols = Array.from({ length: n }, () => w);
    } else {
      const parts = tpl.match(/minmax\([^)]*\)|\S+/g) || [];
      let fixed = 0;
      let fr = 0;
      const spec = parts.map((p) => {
        if (px(p) !== null) {
          fixed += px(p);
          return { fixed: px(p) };
        }
        fr += 1;
        return { fr: 1 };
      });
      const rest = Math.max(0, cw - fixed - gap.col * (spec.length - 1));
      cols = spec.map((x) => (x.fixed !== undefined ? x.fixed : rest / fr));
    }
    if (cols.length === 0) cols = [cw];
    let y = 0;
    for (let i = 0; i < kids.length; i += cols.length) {
      let rowH = 0;
      for (let j = 0; j < cols.length && i + j < kids.length; j++) {
        const r = layout(kids[i + j], { availW: cols[j], availH: null, forceW: cols[j] });
        rowH = Math.max(rowH, r.h);
      }
      y += rowH + (i + cols.length < kids.length ? gap.row : 0);
    }
    return y;
  }

  let lastLayoutVersion = 0;
  function run() {
    layout(doc.documentElement, { availW: VIEWPORT.w, availH: VIEWPORT.h, forceW: VIEWPORT.w });
    lastLayoutVersion += 1;
  }

  return {
    run,
    sizeOf(el) {
      return sizes.get(el) ?? { w: 0, h: 0 };
    },
  };
}
