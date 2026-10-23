"""Sample the logo's colour in OKLCH. Usage: python3 -I sample_logo.py [path/to/logo.jpeg]

macOS `sips` decodes the JPEG to a temporary BMP (standard library only, no Pillow). A pixel counts
as logo ink when its OKLCH chroma is at least 0.02 and its lightness under 0.90 (the background is
a near-white #f9f9f9 at chroma about 0). Prints the medians and the circular mean hue, which
palette.py takes as BASE_HUE.
"""
import math
import os
import struct
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from colour import hex_to_oklch, oklch_to_hex, rgb_to_hex  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "public", "logo.jpeg"))


def read_bmp(path):
    with open(path, "rb") as f:
        data = f.read()
    offset = struct.unpack_from("<I", data, 10)[0]
    width, height = struct.unpack_from("<ii", data, 18)
    bpp = struct.unpack_from("<H", data, 28)[0]
    step = bpp // 8
    row = (width * step + 3) & ~3
    for y in range(abs(height)):
        base = offset + y * row
        for x in range(width):
            b, g, r = data[base + x * step: base + x * step + 3]
            yield r, g, b


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    with tempfile.TemporaryDirectory() as tmp:
        bmp = os.path.join(tmp, "logo.bmp")
        subprocess.run(["sips", "-s", "format", "bmp", src, "--out", bmp], check=True, capture_output=True)
        counts = {}
        for px in read_bmp(bmp):
            counts[px] = counts.get(px, 0) + 1
    ink = []
    total = 0
    for (r, g, b), n in counts.items():
        total += n
        L, C, H = hex_to_oklch(rgb_to_hex((r / 255, g / 255, b / 255)))
        if C >= 0.02 and L < 0.90:
            ink.append((L, C, H, n))
    n_ink = sum(p[3] for p in ink)

    def wmedian(idx):
        s = sorted(ink, key=lambda p: p[idx])
        acc = 0
        for p in s:
            acc += p[3]
            if acc >= n_ink / 2:
                return p[idx]

    sx = sum(math.cos(math.radians(p[2])) * p[3] for p in ink)
    sy = sum(math.sin(math.radians(p[2])) * p[3] for p in ink)
    mean_h = math.degrees(math.atan2(sy, sx)) % 360
    L, C, H = wmedian(0), wmedian(1), wmedian(2)
    hues = sorted(ink, key=lambda p: p[2])
    acc, q10, q90 = 0, None, None
    for p in hues:
        acc += p[3]
        if q10 is None and acc >= n_ink * 0.1:
            q10 = p[2]
        if q90 is None and acc >= n_ink * 0.9:
            q90 = p[2]
    print(f"file: {src}")
    print(f"pixels: {total}, logo ink pixels (C >= 0.02, L < 0.90): {n_ink}")
    print(f"median OKLCH: L {L:.3f}  C {C:.3f}  h {H:.1f}  -> {oklch_to_hex(L, C, H)}")
    print(f"circular mean hue: {mean_h:.1f}; hue 10th to 90th percentile: {q10:.1f} to {q90:.1f}")


if __name__ == "__main__":
    main()
