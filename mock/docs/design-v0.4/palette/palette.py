"""Generate every colour of the offered options (Azure, Azure gold-first) from the logo hue, and check them.

Usage:  python3 -I -B palette.py            # writes generated/ and prints a summary
        python3 -I -B palette.py --check    # also exits 1 if any gate fails for an offered option

Rules (README section 2):
  hue        = BASE_HUE + the role's offset
  lightness  = ladders with equal steps (OKLCH L)
  chroma     = absolute OKLCH C. InfraVana takes the sRGB maximum at its L and h; every other mark
               takes min(its share of the sRGB maximum at its own L and h, MARK_CAP x InfraVana's C),
               so InfraVana is the most vivid mark by absolute C. Chrome takes small absolute values.
  gamut step = colours outside sRGB keep L and h and lose C (generated/palettes.json keeps both).
Gates for every offered option: WCAG 2.x text 4.5:1, marks and borders 3:1; CIEDE2000 >= 10 between
every two chart fills in normal vision and simulated deuteranopia, protanopia and tritanopia
(Machado 2009 in linear sRGB, and in gamma sRGB as a second convention); InfraVana's C the highest
of all marks; notice and preset colours >= 10 from every chart fill; section accent >= 10.
"""
import itertools
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from colour import (  # noqa: E402
    contrast, delta_e, grey, hex_to_oklch, hex_to_rgb, luminance, max_chroma, oklch_to_hex, rgb_to_hex,
    simulate, simulate_gamma,
)

# ------------------------------------------------------------------ fixed inputs

# sample_logo.py on mock/public/logo.jpeg: median OKLCH L 0.557, C 0.038, h 231.9 (circular mean 232.5).
BASE_HUE = 232.0
# The hero moves 18 degrees toward azure. At the logo's own hue sRGB caps the blue at C 0.102, below
# every warm Today rung that passes the vision gates (REJECTED["R-petrol"] shows the capped attempt
# failing); at 250 it reaches C 0.142. The logo file is not changed; this is the brand owner's call.
BRAND_SHIFT = 18.0

CHROME_C = {"ink": 0.006, "rule": 0.012, "section": 0.060, "soft": 0.022}
MARK_SHARE = {"saved": 0.85, "today": 0.80}   # share of the sRGB maximum at the mark's own L and h
MARK_CAP = 0.88                               # no mark above 0.88 x InfraVana's absolute C

CHROME_L = {
    "bg": 0.968, "surface": 0.985, "surface_muted": 0.935, "grid": 0.905, "border": 0.865,
    "border_strong": 0.62, "text_disabled": 0.62, "text_secondary": 0.47, "text": 0.225, "soft": 0.935,
}
BRAND_L = {"infravana": 0.50, "infravana_text": 0.45, "infravana_deep": 0.38, "infravana_hover": 0.30}

# Today ladder: four rungs, equal steps of L 0.105 and of hue 26 degrees, from wine to ochre.
# Lightness rises as hue moves from red to yellow (the natural order of hues).
RUNG_L = [0.33 + 0.105 * k for k in range(4)]             # 0.33, 0.435, 0.54, 0.645
RUNG_H = [127 + 26 * k for k in range(4)]                  # offsets: 359, 25, 51, 77 degrees
ROLES = ["comparator", "option1", "option2", "option3"]

# Chrome families (notice, presets) take chrome chroma and must stay >= 10 from every chart fill.
NOTICE = {"hue": -142, "bg": (0.965, 0.035), "text": (0.40, 0.080), "border": (0.45, 0.090)}   # amber, 90 degrees
PRESET_L = [0.62, 0.55, 0.48, 0.41, 0.34]                   # light (small) to dark (large), equal steps
PRESET_RAMPS = {"violet": 68, "clay": 180}                  # offsets: 300 degrees (free family), 52 (clay)

OPTIONS = {
    "AZ": {
        "name": "Azure",
        "scheme": "complementary: complement plus split-complements for Today, analogous saving",
        "rungs": [0, 1, 2, 3],        # comparator wine, options brick, sienna, ochre
    },
    "AG": {
        "name": "Azure, gold comparator",
        "scheme": "the same colours; the Today ladder re-ordered so the comparator takes the light gold rung",
        "rungs": [3, 0, 1, 2],        # comparator ochre (ink label), options wine, brick, sienna
    },
}
COMMON = {
    "saved": -60, "saved_L": 0.60,     # teal 172: analogous to the logo hue
    "paper": 213, "paper_C": 0.007,    # warm paper 85
    "section": 180,                    # clay 52: the complement, at chrome chroma
}

# Earlier sets, kept for comparison only (hex as committed in da3b502 or drawn in the first boards).
SUPERSEDED = {
    "12A": {"name": "12A Daybreak, as drawn in round 1", "colours": {
        "bg": "#f6f4ef", "surface": "#fbfaf6", "surface_muted": "#eeebe3", "grid": "#e4e0d7", "border": "#d6d1c7",
        "border_strong": "#8a867f", "text": "#1c1c1a", "text_secondary": "#5c5a55", "text_disabled": "#8a867f",
        "section": "#9a422d", "infravana": "#21678e", "infravana_text": "#1d587a", "infravana_deep": "#184661",
        "infravana_hover": "#12364b", "soft": "#dfe9ee", "saved": "#2d9a72", "saved_text": "#12664a",
        "comparator": "#642640", "option1": "#8e3021", "option2": "#bf581b", "option3": "#b9810f",
        "notice_bg": "#fff6dd", "notice_text": "#6b4a00", "notice_border": "#a07a1a"}},
    "P1-r1": {"name": "P1 Complementary, palette round 1 (dropped: within 2.8 to 6.7 of 12A, InfraVana 5th of 6 by C)", "colours": {
        "bg": "#f7f4ef", "surface": "#fcfaf6", "surface_muted": "#ece9e2", "grid": "#e3dfd7", "border": "#d6d2ca",
        "border_strong": "#89867e", "text": "#1d1c19", "text_secondary": "#5c5b57", "text_disabled": "#888682",
        "section": "#7f5a43", "infravana": "#006c93", "infravana_text": "#005d7f", "infravana_deep": "#004964",
        "infravana_hover": "#003347", "soft": "#dcedf6", "saved": "#319379", "saved_text": "#1e6250",
        "comparator": "#5d1534", "option1": "#8f2526", "option2": "#a1592a", "option3": "#b28439",
        "notice_bg": "#fff6dd", "notice_text": "#6b4a00", "notice_border": "#a07a1a"}},
    "P2-r1": {"name": "P2 'Rectangle', palette round 1 (dropped: not a rectangle, alarm red, InfraVana last by C)", "colours": {
        "bg": "#f2f5f6", "surface": "#f9fafb", "surface_muted": "#e7eaec", "grid": "#d8e1e6", "border": "#cbd4d9",
        "border_strong": "#7f888c", "text": "#191c1e", "text_secondary": "#585b5e", "text_disabled": "#838789",
        "section": "#214d62", "infravana": "#006c93", "infravana_text": "#005d7f", "infravana_deep": "#004964",
        "infravana_hover": "#003347", "soft": "#dcedf6", "saved": "#349d5b", "saved_text": "#1e6538",
        "comparator": "#5f0d40", "option1": "#921840", "option2": "#c82521", "option3": "#d86a26",
        "notice_bg": "#fff6dd", "notice_text": "#6b4a00", "notice_border": "#a07a1a"}},
}

# Schemes the same gates rejected (best of a grid search over each scheme's free parameters).
REJECTED = {
    "R-petrol": {"name": "Hero at the logo hue 232 (C 0.102) with every mark capped under it",
                 "brand": 0, "cap": 0.90},
    "R-triad": {"name": "Triad 232/352/112 (Today around 352, saving at 112)",
                "hexes": {"infravana": "#006c93", "saved": "#82862b", "comparator": "#611d53", "option1": "#902d60",
                          "option2": "#c13e63", "option3": "#e85f61"}},
    "R-analogous": {"name": "Analogous Today (172 to 292) with a gold saving",
                    "hexes": {"infravana": "#006c93", "saved": "#b88848", "comparator": "#004f3e", "option1": "#484e85",
                              "option2": "#00747b", "option3": "#7a6faa"}},
}


def H(offset):
    return (BASE_HUE + offset) % 360


def mark_c(L, h, share, iv_c, cap=MARK_CAP):
    return min(share * max_chroma(L, h), cap * iv_c)


def build(p, brand=BRAND_SHIFT, cap=MARK_CAP):
    c, spec = {}, {}

    def put(name, L, C, h, rule):
        h = h % 360
        spec[name] = {"L": round(L, 4), "C_asked": round(C, 4), "h": round(h, 1), "rule": rule}
        c[name] = oklch_to_hex(L, C, h)

    ph = H(COMMON["paper"])
    pc = COMMON["paper_C"]
    put("bg", CHROME_L["bg"], pc, ph, "paper")
    put("surface", CHROME_L["surface"], pc * 0.7, ph, "paper x 0.7")
    put("surface_muted", CHROME_L["surface_muted"], pc * 1.4, ph, "paper x 1.4 (never under a chart)")
    for role in ("grid", "border", "border_strong"):
        put(role, CHROME_L[role], CHROME_C["rule"], ph, "rule")
    for role in ("text", "text_secondary", "text_disabled"):
        put(role, CHROME_L[role], CHROME_C["ink"], ph, "ink")
    put("section", 0.50, CHROME_C["section"], H(COMMON["section"]), "section accent")
    bh = H(brand)
    iv_c = max_chroma(BRAND_L["infravana"], bh)
    for role, L in BRAND_L.items():
        put(role, L, max_chroma(L, bh), bh, "brand: sRGB maximum")
    put("soft", CHROME_L["soft"], CHROME_C["soft"], bh, "selected tint")
    sh = H(COMMON["saved"])
    put("saved", COMMON["saved_L"], mark_c(COMMON["saved_L"], sh, MARK_SHARE["saved"], iv_c, cap), sh, "mark: saved")
    put("saved_text", 0.45, mark_c(0.45, sh, MARK_SHARE["saved"], iv_c, cap), sh, "saved text")
    for role, rung in zip(ROLES, p["rungs"]):
        L, h = RUNG_L[rung], H(RUNG_H[rung])
        put(role, L, mark_c(L, h, MARK_SHARE["today"], iv_c, cap), h, f"Today rung {rung + 1}")
    nh = H(NOTICE["hue"])
    for part in ("bg", "text", "border"):
        L, C = NOTICE[part]
        put(f"notice_{part}", L, C, nh, "notice (chrome)")
    for ramp, off in PRESET_RAMPS.items():
        for i, L in enumerate(PRESET_L):
            put(f"preset_{ramp}_{i + 1}", L, CHROME_C["section"], H(off), f"preset ramp {ramp}")
    for name, hx in c.items():
        L, C, hh = hex_to_oklch(hx)
        spec[name].update({"hex": hx, "C_actual": round(C, 4)})
    return c, spec


# ------------------------------------------------------------------ checks

CHART_FILLS = ["comparator", "infravana", "saved", "option1", "option2", "option3"]
VISIONS = ["normal", "deuteranopia", "protanopia", "tritanopia"]


def wash(c, alpha=0.10):
    a, b = hex_to_rgb(c["infravana"]), hex_to_rgb(c["bg"])
    return rgb_to_hex(alpha * x + (1 - alpha) * y for x, y in zip(a, b))


def label_on(fill, c):
    return c["surface"] if contrast(c["surface"], fill) >= 4.5 else c["text"]


def pairs(c):
    t, m, r = [], [], []
    for bg in ("bg", "surface", "surface_muted", "soft"):
        t.append(("text", "body text", "text", bg))
        t.append(("text", "secondary text", "text_secondary", bg))
    for bg in ("bg", "surface", "soft"):
        t.append(("text", "InfraVana text, links of the brand", "infravana_text", bg))
    for bg in ("bg", "surface"):
        t.append(("text", "saving figure", "saved_text", bg))
        t.append(("text", "section label (step, kicker)", "section", bg))
    t.append(("text", "C10 'With InfraVana' label on the wash", "infravana_text", "wash"))
    t.append(("text", "label on primary button", "surface", "infravana_deep"))
    t.append(("text", "label on hovered primary button", "surface", "infravana_hover"))
    for fill in ("comparator", "infravana", "saved"):   # the bars that carry labels inside them
        t.append(("text", f"label inside the {fill} bar", "@label", fill))
    t.append(("text", "notice text on notice fill", "notice_text", "notice_bg"))
    for bg in ("bg", "surface"):
        for fill in ("infravana", "saved") + tuple(ROLES):
            m.append(("mark", f"{fill} fill on {bg}", fill, bg))
    m.append(("mark", "InfraVana frontier line and points", "infravana_text", "bg"))
    m.append(("mark", "C10 frontier line on the wash", "infravana_text", "wash"))
    m.append(("mark", "budget line", "text_secondary", "bg"))
    for bg in ("bg", "surface"):
        m.append(("mark", "input, chip and axis border", "border_strong", bg))
        m.append(("mark", "section rule", "section", bg))
    m.append(("mark", "selected-row edge", "infravana_text", "soft"))
    m.append(("mark", "chosen tab and primary button", "infravana_deep", "bg"))
    m.append(("mark", "focus ring", "text", "bg"))
    m.append(("mark", "notice border on paper", "notice_border", "bg"))
    m.append(("mark", "notice border on notice fill", "notice_border", "notice_bg"))
    for ramp in PRESET_RAMPS:
        for i in range(len(PRESET_L)):
            for bg in ("bg", "surface"):
                m.append(("mark", f"preset {ramp} {i + 1} tick and button edge on {bg}", f"preset_{ramp}_{i + 1}", bg))
    # Reported, not gated: the rule restricts these uses (README section 2.8).
    r.append(("restricted", "disabled text (only on :disabled controls)", "text_disabled", "bg"))
    for fill in ("saved", "option3", "comparator"):
        r.append(("restricted", f"{fill} fill on surface_muted (charts never sit on it)", fill, "surface_muted"))
    out = []
    c = dict(c, wash=wash(c))
    for kind, what, fg, bg in t + m + r:
        if fg not in c and fg != "@label":
            continue
        f = label_on(c[bg], c) if fg == "@label" else c[fg]
        ratio = contrast(f, c[bg])
        need = {"text": 4.5, "mark": 3.0, "restricted": None}[kind]
        out.append({"kind": kind, "pair": what, "fg": f, "fg_role": fg, "bg": c[bg], "bg_role": bg,
                    "ratio": round(ratio, 2), "needs": need, "pass": True if need is None else ratio >= need})
    return out


def distances(c, fills=CHART_FILLS):
    rows = []
    for a, b in itertools.combinations(fills, 2):
        row = {"a": a, "b": b}
        for v in VISIONS:
            row[v] = round(delta_e(simulate(c[a], v), simulate(c[b], v)), 1)
            row[v + "_gamma"] = round(delta_e(simulate_gamma(c[a], v), simulate_gamma(c[b], v)), 1)
        rows.append(row)
    return rows


def ladder(c, fills=CHART_FILLS):
    items = sorted((luminance(c[f]), f) for f in fills)
    return [{"role": f, "hex": c[f], "grey": grey(c[f]), "Y": round(y, 4),
             "ratio_to_previous": None if i == 0 else round((y + 0.05) / (items[i - 1][0] + 0.05), 2)}
            for i, (y, f) in enumerate(items)]


def chroma_rank(c):
    return sorted(((round(hex_to_oklch(c[f])[1], 3), f) for f in CHART_FILLS), reverse=True)


def chrome_vs_fills(c):
    """Every chrome family that sits near a chart: nearest chart fill by CIEDE2000."""
    keys = ["section", "notice_border", "notice_text"] + [k for k in c if k.startswith("preset_")]
    return {k: min((round(delta_e(c[k], c[f]), 1), f) for f in CHART_FILLS) for k in keys if k in c}


def vs_12a(c):
    a = SUPERSEDED["12A"]["colours"]
    return {f: round(delta_e(c[f], a[f]), 1) for f in CHART_FILLS + ["bg"]}


def evaluate(c):
    return {"pairs": pairs(c), "distances": distances(c), "ladder": ladder(c), "chroma_rank": chroma_rank(c),
            "chrome_vs_fills": chrome_vs_fills(c), "vs_12A": vs_12a(c)}


def gates(r):
    fails = [f"WCAG {p['pair']} {p['ratio']}" for p in r["pairs"] if not p["pass"]]
    for d in r["distances"]:
        for v in VISIONS:
            for k in (v, v + "_gamma"):
                if d[k] < 10:
                    fails.append(f"dE {k} {d['a']}/{d['b']} {d[k]}")
    if r["chroma_rank"][0][1] != "infravana":
        fails.append(f"InfraVana not the most vivid: {r['chroma_rank'][0]}")
    for k, (d, f) in r["chrome_vs_fills"].items():
        if d < 10 and not k.startswith("preset_clay"):
            fails.append(f"{k} {d} from {f}")
    return fails


# ------------------------------------------------------------------ outputs

CSS_MAP = [
    ("--color-bg", "bg"), ("--color-bg-top", "bg"), ("--color-surface", "surface"), ("--color-surface-muted", "surface_muted"),
    ("--color-text", "text"), ("--color-text-secondary", "text_secondary"), ("--color-text-disabled", "text_disabled"),
    ("--color-border", "border"), ("--color-border-strong", "border_strong"), ("--color-grid", "grid"),
    ("--color-accent", "infravana"), ("--color-accent-strong", "infravana_text"), ("--color-accent-deep", "infravana_deep"),
    ("--color-accent-hover", "infravana_hover"), ("--color-accent-soft", "soft"),
    ("--color-positive", "saved_text"), ("--color-saved", "saved"),
    ("--color-today-1", "comparator"), ("--color-today-2", "option1"), ("--color-today-3", "option2"), ("--color-today-4", "option3"),
    ("--color-section", "section"),
    ("--color-notice-bg", "notice_bg"), ("--color-notice-text", "notice_text"), ("--color-notice-border", "notice_border"),
] + [(f"--color-preset-{i + 1}", f"preset_violet_{i + 1}") for i in range(len(PRESET_L))]


def css_block(key, c):
    lines = [f'html[data-pal="{key}"] {{'] + [f"  {var}: {c[role]};" for var, role in CSS_MAP]
    lines.append(f"  --color-label-on-comparator: {label_on(c['comparator'], c)};")
    lines.append("}")
    lines.append(f'html[data-pal="{key}"][data-ramp="clay"] {{')
    lines += [f"  --color-preset-{i + 1}: {c[f'preset_clay_{i + 1}']};" for i in range(len(PRESET_L))]
    lines.append("}")
    return "\n".join(lines)


def md(results):
    out = ["# Generated checks (do not edit: `python3 -I -B palette.py` writes this file)", "",
           "Offered options: AZ (Azure) and AG (Azure, gold comparator). The other sets are for comparison.", ""]
    for key, r in results.items():
        c = r["colours"]
        out += [f"## {key}: {r['name']}", ""]
        if r.get("spec"):
            out += ["### Values", "", "| role | rule | L | C asked | C actual | h | hex |", "|---|---|---|---|---|---|---|"]
            for role, s in r["spec"].items():
                out.append(f"| {role} | {s['rule']} | {s['L']} | {s['C_asked']} | {s['C_actual']} | {s['h']} | `{s['hex']}` |")
            out.append("")
        out += ["### Chart marks by absolute OKLCH C (most vivid first)", "",
                " > ".join(f"{f} {C}" for C, f in r["chroma_rank"]), ""]
        if "pairs" in r:
            fails = [p for p in r["pairs"] if not p["pass"]]
            out += [f"### WCAG 2.x: {len([p for p in r['pairs'] if p['needs']])} gated pairs, {len(fails)} failures", "",
                    "| kind | pair | fg | bg | ratio | needs | result |", "|---|---|---|---|---|---|---|"]
            for p in r["pairs"]:
                res = "reported" if p["needs"] is None else ("pass" if p["pass"] else "FAIL")
                out.append(f"| {p['kind']} | {p['pair']} | `{p['fg']}` | `{p['bg']}` ({p['bg_role']}) | {p['ratio']:.2f} | {p['needs'] or '-'} | {res} |")
            out.append("")
        out += ["### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]", "",
                "| fills | normal | deuteranopia | protanopia | tritanopia |", "|---|---|---|---|---|"]
        for d in r["distances"]:
            cells = [f"{d[v]:.1f} [{d[v + '_gamma']:.1f}]" + ("" if min(d[v], d[v + '_gamma']) >= 10 else " **<10**") for v in VISIONS]
            out.append(f"| {d['a']} / {d['b']} | " + " | ".join(cells) + " |")
        mins = {v: (min(d[v] for d in r["distances"]), min(d[v + "_gamma"] for d in r["distances"])) for v in VISIONS}
        out += ["", "Smallest: " + ", ".join(f"{v} {a:.1f} [{g:.1f}]" for v, (a, g) in mins.items()), "",
                "### Greyscale ladder (relative luminance, dark to light)", "",
                "| role | hex | grey | Y | contrast to the step below |", "|---|---|---|---|---|"]
        for s in r["ladder"]:
            out.append(f"| {s['role']} | `{s['hex']}` | `{s['grey']}` | {s['Y']} | {s['ratio_to_previous'] or ''} |")
        out += ["", "### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)", "",
                "| chrome | nearest fill | CIEDE2000 |", "|---|---|---|"]
        for k, (d, f) in r["chrome_vs_fills"].items():
            out.append(f"| {k} | {f} | {d} |")
        out += ["", "### Distance from 12A, role by role (CIEDE2000)", "", " · ".join(f"{k} {v}" for k, v in r["vs_12A"].items()), ""]
        if r.get("gate_failures") is not None:
            out += [f"**Gate failures: {len(r['gate_failures'])}**" + ("" if not r["gate_failures"] else ": " + "; ".join(r["gate_failures"])), ""]
    return "\n".join(out)


def main():
    results = {}
    for key, p in OPTIONS.items():
        c, spec = build(p)
        results[key] = {"name": p["name"], "scheme": p["scheme"], "colours": c, "spec": spec, "offered": True}
    for key, s in SUPERSEDED.items():
        results[key] = {"name": s["name"], "colours": s["colours"], "spec": None, "offered": False}
    for key, s in REJECTED.items():
        if "hexes" in s:
            c = dict(results["AZ"]["colours"], **s["hexes"])
            spec = None
        else:
            c, spec = build(OPTIONS["AZ"], brand=s["brand"], cap=s["cap"])
        results[key] = {"name": "rejected: " + s["name"], "colours": c, "spec": spec, "offered": False}
    for r in results.values():
        r.update(evaluate(r["colours"]))
        r["gate_failures"] = gates(r)
    gen = os.path.join(HERE, "generated")
    os.makedirs(gen, exist_ok=True)
    with open(os.path.join(gen, "palettes.json"), "w") as f:
        json.dump(results, f, indent=1)
    with open(os.path.join(gen, "tokens.css"), "w") as f:
        f.write("/* Generated by palette.py: the token overrides each offered option loads in the scratch app. */\n\n")
        f.write("\n\n".join(css_block(k, results[k]["colours"]) for k in OPTIONS) + "\n")
    with open(os.path.join(gen, "checks.md"), "w") as f:
        f.write(md(results))
    bad = 0
    for key, r in results.items():
        gated = [p for p in r["pairs"] if p["needs"]]
        lt = min((p for p in gated if p["kind"] == "text"), key=lambda p: p["ratio"])
        lm = min((p for p in gated if p["kind"] == "mark"), key=lambda p: p["ratio"])
        mins = {v: min(min(d[v], d[v + "_gamma"]) for d in r["distances"]) for v in VISIONS}
        print(f"{key}{' (offered)' if r['offered'] else ''}: lowest text {lt['ratio']} ({lt['pair']}), lowest mark {lm['ratio']} ({lm['pair']}); "
              f"min dE (linear and gamma) {mins}; C rank {r['chroma_rank'][:2]}; gate failures {len(r['gate_failures'])}")
        for g in r["gate_failures"][:6]:
            print("    ", g)
        if r["offered"]:
            bad += len(r["gate_failures"])
    if "--check" in sys.argv and bad:
        sys.exit(1)


if __name__ == "__main__":
    main()
