"""Generate every colour of options P1, P2 and P3 from the logo hue, and check them.

Usage:  python3 -I palette.py            # writes generated/ and prints a summary
        python3 -I palette.py --check     # also exits 1 if any check fails

Every value comes from the parameters below by the rules in README.md section 2:
  hue        = BASE_HUE + the scheme's offset for the role
  lightness  = a ladder with equal steps (OKLCH L)
  chroma     = the role's budget (OKLCH C), lowered only where sRGB cannot show it
               (the gamut step keeps L and h and reduces C; generated/palettes.json records both)
Nothing is picked by eye after the rules run. Changing a parameter and re-running regenerates
generated/tokens.css (the overrides the scratch app loads), generated/palettes.json and
generated/checks.md (every contrast, CIEDE2000, vision-deficiency and greyscale number).
"""
import itertools
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from colour import hex_to_rgb, rgb_to_hex, contrast, delta_e, grey, hex_to_oklch, luminance, max_chroma, oklch_to_hex, simulate  # noqa: E402

# ------------------------------------------------------------------ fixed inputs

# sample_logo.py on mock/public/logo.jpeg: median OKLCH L 0.557, C 0.038, h 231.9 (circular mean 232.5).
BASE_HUE = 232.0

# Chroma budget. Chrome roles take an absolute OKLCH C (a tint, not a colour). Mark roles take a
# share of the sRGB maximum at their own L and h ("relative chroma"), because sRGB holds far more
# chroma for warm hues than for this steel blue: InfraVana takes 100% (as vivid as its hue can be
# shown), every other mark less. generated/checks.md lists the absolute C each role ends at.
CHROME_C = {
    "ink": 0.006,          # text
    "rule": 0.012,         # borders, grid
    "section": 0.060,      # section accent: chrome, at most about half the chroma of any mark
    "soft": 0.022,         # selected-row tint
}
MARK_REL = {"infravana": 1.00, "saved": 0.85}   # Today's share is per option (below), always under 1

# Shared chrome ladder (OKLCH L).
CHROME_L = {
    "bg": 0.968, "surface": 0.985, "surface_muted": 0.935, "grid": 0.905, "border": 0.865,
    "border_strong": 0.62, "text_disabled": 0.62, "text_secondary": 0.47, "text": 0.225,
    "soft": 0.935,
}
# The brand ladder: every InfraVana role is the base hue at 100% relative chroma.
BRAND_L = {"infravana": 0.50, "infravana_text": 0.45, "infravana_deep": 0.38, "infravana_hover": 0.30}

# The Today ladder: comparator then options 1 to 3, equal lightness steps, equal hue steps.
# Lightness rises as the hue moves from red toward yellow (the natural order of hues: a dark
# yellow is olive or brown and a light red is pink, so the ladder runs the way hues are lightest).
TODAY_L0, TODAY_LSTEP = 0.33, 0.105          # 0.33, 0.435, 0.54, 0.645
ORDER = ["comparator", "option1", "option2", "option3"]

OPTIONS = {
    "P1": {
        "name": "Complementary",
        "scheme": "complementary, with the saving on the base's analogous neighbour",
        "infravana": 0,          # hue offsets from BASE_HUE
        "saved": -60,            # teal: analogous to the brand, so the saving reads as InfraVana's outcome
        "saved_L": 0.60,
        "today_h0": 127,         # wine (359), the red end of the warm half opposite the base
        "today_step": 26,        # wine, brick, burnt orange, ochre (359, 25, 51, 77)
        "today_rel": 0.80,
        "paper": 213,            # warm paper on the yellow end of that arc (85), chroma 0.007
        "paper_C": 0.007,
        "section": 180,          # clay: the complement itself (52), at chrome chroma
    },
    "P2": {
        "name": "Rectangle",
        "scheme": "tetradic rectangle (two complementary pairs, 232/52 and 152/332)",
        "infravana": 0,
        "saved": 280,            # leaf green: the second pair's cool vertex (152)
        "saved_L": 0.62,
        "today_h0": 116,         # Today walks the warm side between the vertices 332 and 52:
        "today_step": 20,        # wine, crimson, scarlet, vermilion (348, 8, 28, 48)
        "today_rel": 0.90,
        "paper": 0,              # near-neutral paper on the base hue, chroma 0.003 (like infravana.ai's #fafafa)
        "paper_C": 0.003,
        "section": 0,            # quiet navy: the base hue at chrome chroma,
        "section_L": 0.40,       # one brand-ladder step darker than the marks, so it reads as chrome
    },
}

# Candidates the same checks rejected (kept so a reviewer can rerun them). Each is the best of a
# grid search over its scheme's free parameters; none keeps CIEDE2000 >= 10 for all six fills.
REJECTED = {
    "R-triad": {
        "name": "Triad 232/352/112 (Today around 352, saving at 112)",
        "scheme": "triadic", "infravana": 0, "saved": 240, "saved_L": 0.60, "today_h0": 105, "today_step": 15,
        "today_rel": 0.75, "paper": 0, "paper_C": 0.003, "section": 0, "today_L0": 0.36, "today_Lstep": 0.10,
    },
    "R-analogous": {
        "name": "Analogous Today (172 to 292) with a gold saving (complement)",
        "scheme": "analogous with a complement", "infravana": 0, "saved": 200, "saved_L": 0.62,
        "today_offsets": [-60, 45, -30, 60], "today_rel": 0.75, "paper": 0, "paper_C": 0.006, "section": -30,
    },
}


def H(offset):
    return (BASE_HUE + offset) % 360


def build(key, p):
    c = {}
    spec = {}

    def put(name, L, C, h, rel=None):
        if rel is not None:
            C = rel * max_chroma(L, h % 360)
        spec[name] = {"L": round(L, 4), "C_asked": round(C, 4), "rel": rel, "h": round(h % 360, 1)}
        c[name] = oklch_to_hex(L, C, h % 360)

    ph = H(p["paper"])
    pc = p["paper_C"]
    put("bg", CHROME_L["bg"], pc, ph)
    put("surface", CHROME_L["surface"], pc * 0.7, ph)
    put("surface_muted", CHROME_L["surface_muted"], pc * 1.4, ph)
    for role in ("grid", "border", "border_strong"):
        put(role, CHROME_L[role], CHROME_C["rule"], ph)
    for role in ("text", "text_secondary", "text_disabled"):
        put(role, CHROME_L[role], CHROME_C["ink"], ph)
    put("section", p.get("section_L", 0.50), CHROME_C["section"], H(p["section"]))
    for role, L in BRAND_L.items():
        put(role, L, None, H(p["infravana"]), rel=MARK_REL["infravana"])
    put("soft", CHROME_L["soft"], CHROME_C["soft"], H(p["infravana"]))
    put("saved", p["saved_L"], None, H(p["saved"]), rel=MARK_REL["saved"])
    put("saved_text", 0.45, None, H(p["saved"]), rel=MARK_REL["saved"])
    L0, LS = p.get("today_L0", TODAY_L0), p.get("today_Lstep", TODAY_LSTEP)
    offs = p.get("today_offsets") or [p["today_h0"] + k * p["today_step"] for k in range(len(ORDER))]
    for k, name in enumerate(ORDER):
        put(name, L0 + k * LS, None, H(offs[k]), rel=p["today_rel"])
    for name, h in c.items():
        L, C, hh = hex_to_oklch(h)
        spec[name].update({"hex": h, "C_actual": round(C, 4)})
    return c, spec


# ------------------------------------------------------------------ the earlier 12A, as drawn (for comparison only)

TWELVE_A = {
    "bg": "#f6f4ef", "surface": "#fbfaf6", "surface_muted": "#eeebe3", "grid": "#e4e0d7", "border": "#d6d1c7",
    "border_strong": "#8a867f", "text": "#1c1c1a", "text_secondary": "#5c5a55", "text_disabled": "#8a867f",
    "section": "#9a422d", "infravana": "#21678e", "infravana_text": "#1d587a", "infravana_deep": "#184661",
    "infravana_hover": "#12364b", "soft": "#dfe9ee", "saved": "#2d9a72", "saved_text": "#12664a",
    "comparator": "#642640", "option1": "#8e3021", "option2": "#bf581b", "option3": "#b9810f",
}

# ------------------------------------------------------------------ checks


def label_on(fill, c):
    """Chip text on a fill: the paper colour if it reaches 4.5:1, else the ink."""
    return c["surface"] if contrast(c["surface"], fill) >= 4.5 else c["text"]


def wash(c, alpha=0.10):
    """The C10 wash: the InfraVana fill at 10% opacity over the chart ground (sRGB alpha blend, as canvas does)."""
    a, b = hex_to_rgb(c["infravana"]), hex_to_rgb(c["bg"])
    return rgb_to_hex(alpha * x + (1 - alpha) * y for x, y in zip(a, b))


def pairs(c):
    """Every text pair (4.5:1) and mark or border pair (3:1) the page and the charts draw."""
    t = []
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
    for fill in ("comparator", "infravana", "saved"):
        t.append(("text", f"chip label inside {fill} bar", "@label", fill))
    m = []
    for fill in ("infravana", "saved") + tuple(ORDER):
        m.append(("mark", f"{fill} fill on the chart ground", fill, "bg"))
    m.append(("mark", "InfraVana frontier line and points", "infravana_text", "bg"))
    m.append(("mark", "budget line", "text_secondary", "bg"))
    for bg in ("bg", "surface"):
        m.append(("mark", "input, chip and axis border", "border_strong", bg))
        m.append(("mark", "section rule", "section", bg))
    m.append(("mark", "selected-row edge", "infravana_text", "soft"))
    m.append(("mark", "chosen tab and primary button", "infravana_deep", "bg"))
    m.append(("mark", "focus ring", "text", "bg"))
    m.append(("mark", "C10 frontier line on the wash", "infravana_text", "wash"))
    m.append(("mark", "C10 lightest Today line (2px) on the ground", "option3", "bg"))
    c = dict(c, wash=wash(c))
    out = []
    for kind, what, fg, bg in t + m:
        f = label_on(c[bg], c) if fg == "@label" else c[fg]
        r = contrast(f, c[bg])
        need = 4.5 if kind == "text" else 3.0
        out.append({"kind": kind, "pair": what, "fg": f, "fg_role": fg, "bg": c[bg], "bg_role": bg,
                    "ratio": round(r, 2), "needs": need, "pass": r >= need})
    return out


VISIONS = ["normal", "deuteranopia", "protanopia", "tritanopia"]
CHART_FILLS = ["comparator", "infravana", "saved", "option1", "option2", "option3"]


def distances(c, fills=CHART_FILLS):
    rows = []
    for a, b in itertools.combinations(fills, 2):
        row = {"a": a, "b": b}
        for v in VISIONS:
            row[v] = round(delta_e(simulate(c[a], v), simulate(c[b], v)), 1)
        rows.append(row)
    return rows


def ladder(c, fills=CHART_FILLS):
    items = sorted(((luminance(c[f]), f) for f in fills))
    out = []
    for i, (y, f) in enumerate(items):
        step = None if i == 0 else round((y + 0.05) / (items[i - 1][0] + 0.05), 2)
        out.append({"role": f, "hex": c[f], "grey": grey(c[f]), "Y": round(y, 4), "ratio_to_previous": step})
    return out


def neighbour_section(c):
    """Section accent (chrome) against the nearest chart fill: it must not read as a series."""
    return min((round(delta_e(c["section"], c[f]), 1), f) for f in CHART_FILLS)


# ------------------------------------------------------------------ tokens for the app


def css_block(key, c):
    lines = [
        f'html[data-pal="{key}"] {{',
        f"  --color-bg: {c['bg']};", f"  --color-bg-top: {c['bg']};",
        f"  --color-surface: {c['surface']};", f"  --color-surface-muted: {c['surface_muted']};",
        f"  --color-text: {c['text']};", f"  --color-text-secondary: {c['text_secondary']};",
        f"  --color-text-disabled: {c['text_disabled']};",
        f"  --color-border: {c['border']};", f"  --color-border-strong: {c['border_strong']};",
        f"  --color-grid: {c['grid']};",
        f"  --color-accent: {c['infravana']};", f"  --color-accent-strong: {c['infravana_text']};",
        f"  --color-accent-deep: {c['infravana_deep']};", f"  --color-accent-hover: {c['infravana_hover']};",
        f"  --color-accent-soft: {c['soft']};",
        f"  --color-positive: {c['saved_text']};", f"  --color-saved: {c['saved']};",
        f"  --color-today-1: {c['comparator']};", f"  --color-today-2: {c['option1']};",
        f"  --color-today-3: {c['option2']};", f"  --color-today-4: {c['option3']};",
        f"  --color-section: {c['section']};",
        f"  --color-label-on-saved: {label_on(c['saved'], c)};",
        "}",
    ]
    return "\n".join(lines)


def md_tables(results):
    out = ["# Generated checks (do not edit: `python3 -I palette.py` writes this file)", ""]
    for key, r in results.items():
        c = r["colours"]
        out += [f"## {key}{' ' + r['name'] if r.get('name') else ''}", ""]
        if r.get("spec"):
            out += ["### Values (OKLCH asked, OKLCH after the gamut step, hex)", "",
                    "| role | L | relative chroma (share of sRGB max) | C asked | C actual | h | hex |", "|---|---|---|---|---|---|---|"]
            for role, s in r["spec"].items():
                out.append(f"| {role} | {s['L']} | {s['rel'] if s['rel'] is not None else 'absolute'} | {s['C_asked']} | {s['C_actual']} | {s['h']} | `{s['hex']}` |")
            out.append("")
        fails = [p for p in r["pairs"] if not p["pass"]]
        out += [f"### WCAG 2.x contrast: {len(r['pairs'])} pairs, {len(fails)} failures", "",
                "| kind | pair | fg | bg | ratio | needs | result |", "|---|---|---|---|---|---|---|"]
        for p in r["pairs"]:
            out.append(f"| {p['kind']} | {p['pair']} | `{p['fg']}` | `{p['bg']}` ({p['bg_role']}) | {p['ratio']:.2f} | {p['needs']} | {'pass' if p['pass'] else 'FAIL'} |")
        out += ["", "### CIEDE2000 between every two chart fills (at least 10)", "",
                "| fills | normal | deuteranopia | protanopia | tritanopia |", "|---|---|---|---|---|"]
        for d in r["distances"]:
            cells = [f"{d[v]:.1f}" + ("" if d[v] >= 10 else " **<10**") for v in VISIONS]
            out.append(f"| {d['a']} / {d['b']} | " + " | ".join(cells) + " |")
        mins = {v: min(d[v] for d in r["distances"]) for v in VISIONS}
        out += ["", "Smallest: " + ", ".join(f"{v} {mins[v]:.1f}" for v in VISIONS), "",
                "### Greyscale luminance ladder (relative luminance Y, dark to light)", "",
                "| role | hex | grey | Y | contrast to the step below |", "|---|---|---|---|---|"]
        for s in r["ladder"]:
            out.append(f"| {s['role']} | `{s['hex']}` | `{s['grey']}` | {s['Y']} | {s['ratio_to_previous'] or ''} |")
        out += ["", f"Section accent against the nearest chart fill: CIEDE2000 {r['section_nearest'][0]} ({r['section_nearest'][1]}).", ""]
    return "\n".join(out)


def main():
    results = {}
    for key, p in OPTIONS.items():
        c, spec = build(key, p)
        results[key] = {"name": p["name"], "scheme": p["scheme"], "colours": c, "spec": spec}
    results["12A"] = {"name": "Daybreak, as drawn in the first boards (not generated)", "colours": TWELVE_A, "spec": None}
    for key, p in REJECTED.items():
        c, spec = build(key, p)
        results[key] = {"name": "rejected: " + p["name"], "scheme": p["scheme"], "colours": c, "spec": spec}
    for key, r in results.items():
        c = r["colours"]
        r["pairs"] = pairs(c)
        r["distances"] = distances(c)
        r["ladder"] = ladder(c)
        r["section_nearest"] = neighbour_section(c)
    gen = os.path.join(HERE, "generated")
    os.makedirs(gen, exist_ok=True)
    with open(os.path.join(gen, "palettes.json"), "w") as f:
        json.dump(results, f, indent=1)
    with open(os.path.join(gen, "tokens.css"), "w") as f:
        f.write("/* Generated by palette.py: the token overrides each option loads in the scratch app. */\n\n")
        f.write("\n\n".join(css_block(k, results[k]["colours"]) for k in OPTIONS) + "\n")
    with open(os.path.join(gen, "checks.md"), "w") as f:
        f.write(md_tables(results))
    bad = 0
    for key, r in results.items():
        fails = [p for p in r["pairs"] if not p["pass"]]
        mins = {v: min(d[v] for d in r["distances"]) for v in VISIONS}
        low = [p for p in r["pairs"] if p["kind"] == "text"]
        lowm = [p for p in r["pairs"] if p["kind"] == "mark"]
        tmin = min(low, key=lambda p: p["ratio"])
        mmin = min(lowm, key=lambda p: p["ratio"])
        print(f"{key}: {len(r['pairs'])} pairs, {len(fails)} fail; lowest text {tmin['ratio']} ({tmin['pair']}), "
              f"lowest mark {mmin['ratio']} ({mmin['pair']}); min dE00 "
              + ", ".join(f"{v} {mins[v]}" for v in VISIONS) + f"; section vs nearest fill {r['section_nearest']}")
        for p in fails:
            print("   FAIL", p["pair"], p["fg"], p["bg"], p["ratio"])
        for d in r["distances"]:
            for v in VISIONS:
                if d[v] < 10:
                    print(f"   dE<10 {v}: {d['a']} / {d['b']} {d[v]}")
        if key in OPTIONS:
            bad += len(fails) + sum(1 for d in r["distances"] for v in VISIONS if d[v] < 10)
    if "--check" in sys.argv and bad:
        sys.exit(1)


if __name__ == "__main__":
    main()
