"""Colour maths used by sample_logo.py and palette.py. Python 3 standard library only.

Every formula is the published one, written out so a reviewer can check it:
- sRGB transfer and WCAG 2.x relative luminance and contrast ratio (WCAG 2.2, 1.4.3 and 1.4.11).
- OKLab and OKLCH (Bjorn Ottosson, 2020, "A perceptual color space for image processing").
- CIELAB D65 and CIEDE2000 (Sharma, Wu and Dalal, 2005, with kL = kC = kH = 1).
- Colour-vision deficiency simulation: Machado, Oliveira and Fernandes (2009), severity 1.0
  matrices, applied to linear sRGB and clipped to [0, 1].
"""
import math

# ---------------------------------------------------------------- sRGB


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#" + "".join("%02x" % round(min(1.0, max(0.0, c)) * 255) for c in rgb)


def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def from_linear(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def luminance(h):
    r, g, b = (to_linear(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ---------------------------------------------------------------- OKLab / OKLCH


def linear_to_oklab(r, g, b):
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def oklab_to_linear(L, a, b):
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    return (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )


def hex_to_oklch(h):
    r, g, b = (to_linear(c) for c in hex_to_rgb(h))
    L, a, bb = linear_to_oklab(r, g, b)
    C = math.hypot(a, bb)
    H = math.degrees(math.atan2(bb, a)) % 360
    return L, C, H


def oklch_in_gamut(L, C, H, eps=1e-6):
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    return all(-eps <= v <= 1 + eps for v in oklab_to_linear(L, a, b))


def oklch_to_hex(L, C, H):
    """OKLCH to sRGB hex. Out-of-gamut colours keep L and H and lose chroma (binary search)."""
    if not oklch_in_gamut(L, C, H):
        lo, hi = 0.0, C
        for _ in range(40):
            mid = (lo + hi) / 2
            if oklch_in_gamut(L, mid, H):
                lo = mid
            else:
                hi = mid
        C = lo
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    return rgb_to_hex(from_linear(min(1, max(0, v))) for v in oklab_to_linear(L, a, b))


def max_chroma(L, H):
    lo, hi = 0.0, 0.4
    for _ in range(40):
        mid = (lo + hi) / 2
        if oklch_in_gamut(L, mid, H):
            lo = mid
        else:
            hi = mid
    return lo


# ---------------------------------------------------------------- CIELAB and CIEDE2000

_WHITE = (0.95047, 1.0, 1.08883)  # D65


def _linear_to_lab(r, g, b):
    x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b

    def f(t):
        return t ** (1 / 3) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29

    fx, fy, fz = f(x / _WHITE[0]), f(y / _WHITE[1]), f(z / _WHITE[2])
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def hex_to_lab(h):
    return _linear_to_lab(*(to_linear(c) for c in hex_to_rgb(h)))


def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2)
    Cm = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360 if C1p else 0.0
    h2p = math.degrees(math.atan2(b2, a2p)) % 360 if C2p else 0.0
    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0.0
    elif abs(h2p - h1p) <= 180:
        dhp = h2p - h1p
    elif h2p - h1p > 180:
        dhp = h2p - h1p - 360
    else:
        dhp = h2p - h1p + 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))
    Lpm = (L1 + L2) / 2
    Cpm = (C1p + C2p) / 2
    if C1p * C2p == 0:
        hpm = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hpm = (h1p + h2p) / 2
    elif h1p + h2p < 360:
        hpm = (h1p + h2p + 360) / 2
    else:
        hpm = (h1p + h2p - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hpm - 30)) + 0.24 * math.cos(math.radians(2 * hpm))
         + 0.32 * math.cos(math.radians(3 * hpm + 6)) - 0.20 * math.cos(math.radians(4 * hpm - 63)))
    dtheta = 30 * math.exp(-(((hpm - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lpm - 50) ** 2 / math.sqrt(20 + (Lpm - 50) ** 2)
    Sc = 1 + 0.045 * Cpm
    Sh = 1 + 0.015 * Cpm * T
    Rt = -math.sin(math.radians(2 * dtheta)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def delta_e(h1, h2):
    return ciede2000(hex_to_lab(h1), hex_to_lab(h2))


# ---------------------------------------------------------------- vision deficiency and greyscale

MACHADO = {
    "protanopia": ((0.152286, 1.052583, -0.204868), (0.114503, 0.786281, 0.099216), (-0.003882, -0.048116, 1.051998)),
    "deuteranopia": ((0.367322, 0.860646, -0.227968), (0.280085, 0.672501, 0.047413), (-0.011820, 0.042940, 0.968881)),
    "tritanopia": ((1.255528, -0.076749, -0.178779), (-0.078411, 0.930809, 0.147602), (0.004733, 0.691367, 0.303900)),
}


def simulate(h, kind):
    if kind == "normal":
        return h
    lin = [to_linear(c) for c in hex_to_rgb(h)]
    m = MACHADO[kind]
    out = [min(1.0, max(0.0, sum(m[i][j] * lin[j] for j in range(3)))) for i in range(3)]
    return rgb_to_hex(from_linear(c) for c in out)


def grey(h):
    """The grey of equal relative luminance (what a greyscale print or filter keeps)."""
    v = from_linear(luminance(h))
    return rgb_to_hex((v, v, v))
