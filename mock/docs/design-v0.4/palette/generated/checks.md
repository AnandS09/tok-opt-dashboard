# Generated checks (do not edit: `python3 -I palette.py` writes this file)

## P1 Complementary

### Values (OKLCH asked, OKLCH after the gamut step, hex)

| role | L | relative chroma (share of sRGB max) | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | 0.968 | absolute | 0.007 | 0.0074 | 85.0 | `#f7f4ef` |
| surface | 0.985 | absolute | 0.0049 | 0.0057 | 85.0 | `#fcfaf6` |
| surface_muted | 0.935 | absolute | 0.0098 | 0.0099 | 85.0 | `#ece9e2` |
| grid | 0.905 | absolute | 0.012 | 0.0116 | 85.0 | `#e3dfd7` |
| border | 0.865 | absolute | 0.012 | 0.0118 | 85.0 | `#d6d2ca` |
| border_strong | 0.62 | absolute | 0.012 | 0.0123 | 85.0 | `#89867e` |
| text | 0.225 | absolute | 0.006 | 0.0059 | 85.0 | `#1d1c19` |
| text_secondary | 0.47 | absolute | 0.006 | 0.0065 | 85.0 | `#5c5b57` |
| text_disabled | 0.62 | absolute | 0.006 | 0.0064 | 85.0 | `#888682` |
| section | 0.5 | absolute | 0.06 | 0.06 | 52.0 | `#7f5a43` |
| infravana | 0.5 | 1.0 | 0.102 | 0.1022 | 232.0 | `#006c93` |
| infravana_text | 0.45 | 1.0 | 0.0918 | 0.0918 | 232.0 | `#005d7f` |
| infravana_deep | 0.38 | 1.0 | 0.0775 | 0.0771 | 232.0 | `#004964` |
| infravana_hover | 0.3 | 1.0 | 0.0612 | 0.0609 | 232.0 | `#003347` |
| soft | 0.935 | absolute | 0.022 | 0.0218 | 232.0 | `#dcedf6` |
| saved | 0.6 | 0.85 | 0.0989 | 0.099 | 172.0 | `#319379` |
| saved_text | 0.45 | 0.85 | 0.0742 | 0.0739 | 172.0 | `#1e6250` |
| comparator | 0.33 | 0.8 | 0.1073 | 0.1073 | 359.0 | `#5d1534` |
| option1 | 0.435 | 0.8 | 0.1411 | 0.1416 | 25.0 | `#8f2526` |
| option2 | 0.54 | 0.8 | 0.1126 | 0.1124 | 51.0 | `#a1592a` |
| option3 | 0.645 | 0.8 | 0.108 | 0.1075 | 77.0 | `#b28439` |

### WCAG 2.x contrast: 38 pairs, 0 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 4.5 | pass |
| text | body text | `#1d1c19` | `#fcfaf6` (surface) | 16.35 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#fcfaf6` (surface) | 6.52 | 4.5 | pass |
| text | body text | `#1d1c19` | `#ece9e2` (surface_muted) | 14.05 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#ece9e2` (surface_muted) | 5.61 | 4.5 | pass |
| text | body text | `#1d1c19` | `#dcedf6` (soft) | 14.19 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#dcedf6` (soft) | 5.66 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f7f4ef` (bg) | 6.66 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#fcfaf6` (surface) | 7.01 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#dcedf6` (soft) | 6.09 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#f7f4ef` (bg) | 6.56 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#fcfaf6` (surface) | 6.90 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005d7f` | `#dee6e6` (wash) | 5.77 | 4.5 | pass |
| text | label on primary button | `#fcfaf6` | `#004964` (infravana_deep) | 9.43 | 4.5 | pass |
| text | label on hovered primary button | `#fcfaf6` | `#003347` (infravana_hover) | 12.88 | 4.5 | pass |
| text | chip label inside comparator bar | `#fcfaf6` | `#5d1534` (comparator) | 12.42 | 4.5 | pass |
| text | chip label inside infravana bar | `#fcfaf6` | `#006c93` (infravana) | 5.65 | 4.5 | pass |
| text | chip label inside saved bar | `#1d1c19` | `#319379` (saved) | 4.53 | 4.5 | pass |
| mark | infravana fill on the chart ground | `#006c93` | `#f7f4ef` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on the chart ground | `#319379` | `#f7f4ef` (bg) | 3.43 | 3.0 | pass |
| mark | comparator fill on the chart ground | `#5d1534` | `#f7f4ef` (bg) | 11.80 | 3.0 | pass |
| mark | option1 fill on the chart ground | `#8f2526` | `#f7f4ef` (bg) | 7.78 | 3.0 | pass |
| mark | option2 fill on the chart ground | `#a1592a` | `#f7f4ef` (bg) | 4.81 | 3.0 | pass |
| mark | option3 fill on the chart ground | `#b28439` | `#f7f4ef` (bg) | 3.06 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f7f4ef` (bg) | 6.66 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f7f4ef` (bg) | 8.96 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#dee6e6` (wash) | 5.77 | 3.0 | pass |
| mark | C10 lightest Today line (2px) on the ground | `#b28439` | `#f7f4ef` (bg) | 3.06 | 3.0 | pass |

### CIEDE2000 between every two chart fills (at least 10)

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 46.5 | 26.2 | 24.4 | 57.8 |
| comparator / saved | 61.8 | 26.2 | 37.8 | 61.0 |
| comparator / option1 | 17.5 | 19.0 | 21.4 | 11.9 |
| comparator / option2 | 33.1 | 28.5 | 34.4 | 20.1 |
| comparator / option3 | 49.0 | 39.4 | 45.2 | 32.9 |
| infravana / saved | 28.7 | 24.7 | 28.6 | 11.8 |
| infravana / option1 | 48.0 | 40.6 | 34.4 | 53.5 |
| infravana / option2 | 43.3 | 44.6 | 39.5 | 48.4 |
| infravana / option3 | 47.4 | 49.8 | 43.8 | 45.5 |
| saved / option1 | 58.6 | 23.0 | 28.2 | 62.3 |
| saved / option2 | 44.3 | 20.3 | 20.1 | 54.8 |
| saved / option3 | 34.8 | 22.0 | 16.1 | 47.7 |
| option1 / option2 | 18.6 | 11.5 | 15.3 | 11.9 |
| option1 / option3 | 36.5 | 24.4 | 28.8 | 25.9 |
| option2 / option3 | 17.6 | 11.7 | 14.3 | 13.6 |

Smallest: normal 17.5, deuteranopia 11.5, protanopia 14.3, tritanopia 11.8

### Greyscale luminance ladder (relative luminance Y, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#5d1534` | `#313131` | 0.0311 |  |
| option1 | `#8f2526` | `#4c4c4c` | 0.073 | 1.52 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.45 |
| option2 | `#a1592a` | `#6c6c6c` | 0.1489 | 1.12 |
| saved | `#319379` | `#848484` | 0.229 | 1.4 |
| option3 | `#b28439` | `#8c8c8c` | 0.2626 | 1.12 |

Section accent against the nearest chart fill: CIEDE2000 10.1 (option2).

## P2 Rectangle

### Values (OKLCH asked, OKLCH after the gamut step, hex)

| role | L | relative chroma (share of sRGB max) | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | 0.968 | absolute | 0.003 | 0.0035 | 232.0 | `#f2f5f6` |
| surface | 0.985 | absolute | 0.0021 | 0.0017 | 232.0 | `#f9fafb` |
| surface_muted | 0.935 | absolute | 0.0042 | 0.0042 | 232.0 | `#e7eaec` |
| grid | 0.905 | absolute | 0.012 | 0.0119 | 232.0 | `#d8e1e6` |
| border | 0.865 | absolute | 0.012 | 0.012 | 232.0 | `#cbd4d9` |
| border_strong | 0.62 | absolute | 0.012 | 0.0122 | 232.0 | `#7f888c` |
| text | 0.225 | absolute | 0.006 | 0.006 | 232.0 | `#191c1e` |
| text_secondary | 0.47 | absolute | 0.006 | 0.0062 | 232.0 | `#585b5e` |
| text_disabled | 0.62 | absolute | 0.006 | 0.0056 | 232.0 | `#838789` |
| section | 0.4 | absolute | 0.06 | 0.0599 | 232.0 | `#214d62` |
| infravana | 0.5 | 1.0 | 0.102 | 0.1022 | 232.0 | `#006c93` |
| infravana_text | 0.45 | 1.0 | 0.0918 | 0.0918 | 232.0 | `#005d7f` |
| infravana_deep | 0.38 | 1.0 | 0.0775 | 0.0771 | 232.0 | `#004964` |
| infravana_hover | 0.3 | 1.0 | 0.0612 | 0.0609 | 232.0 | `#003347` |
| soft | 0.935 | absolute | 0.022 | 0.0218 | 232.0 | `#dcedf6` |
| saved | 0.62 | 0.85 | 0.1386 | 0.1378 | 152.0 | `#349d5b` |
| saved_text | 0.45 | 0.85 | 0.1006 | 0.1011 | 152.0 | `#1e6538` |
| comparator | 0.33 | 0.9 | 0.1248 | 0.1242 | 348.0 | `#5f0d40` |
| option1 | 0.435 | 0.9 | 0.1568 | 0.1567 | 8.0 | `#921840` |
| option2 | 0.54 | 0.9 | 0.1986 | 0.1983 | 28.0 | `#c82521` |
| option3 | 0.645 | 0.9 | 0.1581 | 0.158 | 48.0 | `#d86a26` |

### WCAG 2.x contrast: 38 pairs, 0 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#191c1e` | `#f2f5f6` (bg) | 15.63 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#f2f5f6` (bg) | 6.24 | 4.5 | pass |
| text | body text | `#191c1e` | `#f9fafb` (surface) | 16.39 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#f9fafb` (surface) | 6.54 | 4.5 | pass |
| text | body text | `#191c1e` | `#e7eaec` (surface_muted) | 14.17 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#e7eaec` (surface_muted) | 5.66 | 4.5 | pass |
| text | body text | `#191c1e` | `#dcedf6` (soft) | 14.26 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#dcedf6` (soft) | 5.69 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f2f5f6` (bg) | 6.67 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f9fafb` (surface) | 7.00 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#dcedf6` (soft) | 6.09 | 4.5 | pass |
| text | saving figure | `#1e6538` | `#f2f5f6` (bg) | 6.45 | 4.5 | pass |
| text | section label (step, kicker) | `#214d62` | `#f2f5f6` (bg) | 8.32 | 4.5 | pass |
| text | saving figure | `#1e6538` | `#f9fafb` (surface) | 6.76 | 4.5 | pass |
| text | section label (step, kicker) | `#214d62` | `#f9fafb` (surface) | 8.73 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005d7f` | `#dae7ec` (wash) | 5.79 | 4.5 | pass |
| text | label on primary button | `#f9fafb` | `#004964` (infravana_deep) | 9.40 | 4.5 | pass |
| text | label on hovered primary button | `#f9fafb` | `#003347` (infravana_hover) | 12.84 | 4.5 | pass |
| text | chip label inside comparator bar | `#f9fafb` | `#5f0d40` (comparator) | 12.42 | 4.5 | pass |
| text | chip label inside infravana bar | `#f9fafb` | `#006c93` (infravana) | 5.63 | 4.5 | pass |
| text | chip label inside saved bar | `#191c1e` | `#349d5b` (saved) | 4.99 | 4.5 | pass |
| mark | infravana fill on the chart ground | `#006c93` | `#f2f5f6` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on the chart ground | `#349d5b` | `#f2f5f6` (bg) | 3.13 | 3.0 | pass |
| mark | comparator fill on the chart ground | `#5f0d40` | `#f2f5f6` (bg) | 11.84 | 3.0 | pass |
| mark | option1 fill on the chart ground | `#921840` | `#f2f5f6` (bg) | 7.90 | 3.0 | pass |
| mark | option2 fill on the chart ground | `#c82521` | `#f2f5f6` (bg) | 5.12 | 3.0 | pass |
| mark | option3 fill on the chart ground | `#d86a26` | `#f2f5f6` (bg) | 3.19 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f2f5f6` (bg) | 6.67 | 3.0 | pass |
| mark | budget line | `#585b5e` | `#f2f5f6` (bg) | 6.24 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f2f5f6` (bg) | 3.30 | 3.0 | pass |
| mark | section rule | `#214d62` | `#f2f5f6` (bg) | 8.32 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f9fafb` (surface) | 3.46 | 3.0 | pass |
| mark | section rule | `#214d62` | `#f9fafb` (surface) | 8.73 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f2f5f6` (bg) | 8.97 | 3.0 | pass |
| mark | focus ring | `#191c1e` | `#f2f5f6` (bg) | 15.63 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#dae7ec` (wash) | 5.79 | 3.0 | pass |
| mark | C10 lightest Today line (2px) on the ground | `#d86a26` | `#f2f5f6` (bg) | 3.19 | 3.0 | pass |

### CIEDE2000 between every two chart fills (at least 10)

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 46.2 | 20.2 | 23.1 | 57.5 |
| comparator / saved | 72.5 | 36.1 | 50.6 | 64.4 |
| comparator / option1 | 13.4 | 19.4 | 11.8 | 12.4 |
| comparator / option2 | 31.4 | 36.6 | 36.1 | 25.7 |
| comparator / option3 | 46.6 | 46.4 | 48.5 | 32.5 |
| infravana / saved | 40.7 | 40.1 | 40.9 | 14.7 |
| infravana / option1 | 49.5 | 32.2 | 21.3 | 53.7 |
| infravana / option2 | 51.5 | 47.1 | 38.7 | 54.8 |
| infravana / option3 | 49.7 | 52.5 | 44.0 | 54.8 |
| saved / option1 | 71.5 | 20.2 | 39.1 | 65.1 |
| saved / option2 | 67.1 | 12.5 | 24.7 | 63.9 |
| saved / option3 | 52.6 | 12.9 | 10.1 | 61.8 |
| option1 / option2 | 19.1 | 18.5 | 23.2 | 13.7 |
| option1 / option3 | 35.7 | 29.7 | 35.4 | 22.3 |
| option2 / option3 | 19.1 | 11.7 | 16.8 | 12.4 |

Smallest: normal 13.4, deuteranopia 11.7, protanopia 10.1, tritanopia 12.4

### Greyscale luminance ladder (relative luminance Y, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#5f0d40` | `#313131` | 0.0309 |  |
| option1 | `#921840` | `#4c4c4c` | 0.0713 | 1.5 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.47 |
| option2 | `#c82521` | `#686868` | 0.1371 | 1.05 |
| option3 | `#d86a26` | `#898989` | 0.2505 | 1.61 |
| saved | `#349d5b` | `#8a8a8a` | 0.256 | 1.02 |

Section accent against the nearest chart fill: CIEDE2000 11.4 (infravana).

## 12A Daybreak, as drawn in the first boards (not generated)

### WCAG 2.x contrast: 38 pairs, 0 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#1c1c1a` | `#f6f4ef` (bg) | 15.53 | 4.5 | pass |
| text | secondary text | `#5c5a55` | `#f6f4ef` (bg) | 6.27 | 4.5 | pass |
| text | body text | `#1c1c1a` | `#fbfaf6` (surface) | 16.34 | 4.5 | pass |
| text | secondary text | `#5c5a55` | `#fbfaf6` (surface) | 6.60 | 4.5 | pass |
| text | body text | `#1c1c1a` | `#eeebe3` (surface_muted) | 14.33 | 4.5 | pass |
| text | secondary text | `#5c5a55` | `#eeebe3` (surface_muted) | 5.78 | 4.5 | pass |
| text | body text | `#1c1c1a` | `#dfe9ee` (soft) | 13.84 | 4.5 | pass |
| text | secondary text | `#5c5a55` | `#dfe9ee` (soft) | 5.59 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#1d587a` | `#f6f4ef` (bg) | 7.00 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#1d587a` | `#fbfaf6` (surface) | 7.37 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#1d587a` | `#dfe9ee` (soft) | 6.24 | 4.5 | pass |
| text | saving figure | `#12664a` | `#f6f4ef` (bg) | 6.32 | 4.5 | pass |
| text | section label (step, kicker) | `#9a422d` | `#f6f4ef` (bg) | 5.99 | 4.5 | pass |
| text | saving figure | `#12664a` | `#fbfaf6` (surface) | 6.65 | 4.5 | pass |
| text | section label (step, kicker) | `#9a422d` | `#fbfaf6` (surface) | 6.30 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#1d587a` | `#e1e6e5` (wash) | 6.10 | 4.5 | pass |
| text | label on primary button | `#fbfaf6` | `#184661` (infravana_deep) | 9.63 | 4.5 | pass |
| text | label on hovered primary button | `#fbfaf6` | `#12364b` (infravana_hover) | 12.15 | 4.5 | pass |
| text | chip label inside comparator bar | `#fbfaf6` | `#642640` (comparator) | 10.62 | 4.5 | pass |
| text | chip label inside infravana bar | `#fbfaf6` | `#21678e` (infravana) | 5.92 | 4.5 | pass |
| text | chip label inside saved bar | `#1c1c1a` | `#2d9a72` (saved) | 4.86 | 4.5 | pass |
| mark | infravana fill on the chart ground | `#21678e` | `#f6f4ef` (bg) | 5.63 | 3.0 | pass |
| mark | saved fill on the chart ground | `#2d9a72` | `#f6f4ef` (bg) | 3.20 | 3.0 | pass |
| mark | comparator fill on the chart ground | `#642640` | `#f6f4ef` (bg) | 10.09 | 3.0 | pass |
| mark | option1 fill on the chart ground | `#8e3021` | `#f6f4ef` (bg) | 7.36 | 3.0 | pass |
| mark | option2 fill on the chart ground | `#bf581b` | `#f6f4ef` (bg) | 4.13 | 3.0 | pass |
| mark | option3 fill on the chart ground | `#b9810f` | `#f6f4ef` (bg) | 3.08 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#1d587a` | `#f6f4ef` (bg) | 7.00 | 3.0 | pass |
| mark | budget line | `#5c5a55` | `#f6f4ef` (bg) | 6.27 | 3.0 | pass |
| mark | input, chip and axis border | `#8a867f` | `#f6f4ef` (bg) | 3.30 | 3.0 | pass |
| mark | section rule | `#9a422d` | `#f6f4ef` (bg) | 5.99 | 3.0 | pass |
| mark | input, chip and axis border | `#8a867f` | `#fbfaf6` (surface) | 3.47 | 3.0 | pass |
| mark | section rule | `#9a422d` | `#fbfaf6` (surface) | 6.30 | 3.0 | pass |
| mark | selected-row edge | `#1d587a` | `#dfe9ee` (soft) | 6.24 | 3.0 | pass |
| mark | chosen tab and primary button | `#184661` | `#f6f4ef` (bg) | 9.15 | 3.0 | pass |
| mark | focus ring | `#1c1c1a` | `#f6f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#1d587a` | `#e1e6e5` (wash) | 6.10 | 3.0 | pass |
| mark | C10 lightest Today line (2px) on the ground | `#b9810f` | `#f6f4ef` (bg) | 3.08 | 3.0 | pass |

### CIEDE2000 between every two chart fills (at least 10)

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 39.9 | 21.5 | 19.8 | 54.0 |
| comparator / saved | 62.2 | 26.4 | 39.6 | 59.4 |
| comparator / option1 | 19.9 | 20.3 | 24.6 | 10.7 |
| comparator / option2 | 35.2 | 33.0 | 36.7 | 22.6 |
| comparator / option3 | 49.4 | 39.5 | 44.9 | 29.6 |
| infravana / saved | 34.8 | 31.7 | 34.9 | 15.8 |
| infravana / option1 | 43.5 | 40.7 | 36.3 | 51.6 |
| infravana / option2 | 45.7 | 48.4 | 42.5 | 52.6 |
| infravana / option3 | 51.2 | 52.3 | 46.8 | 47.4 |
| saved / option1 | 58.4 | 21.8 | 29.0 | 62.7 |
| saved / option2 | 51.4 | 18.5 | 19.4 | 60.5 |
| saved / option3 | 37.8 | 20.3 | 15.9 | 50.8 |
| option1 / option2 | 17.6 | 16.6 | 16.1 | 14.2 |
| option1 / option3 | 34.2 | 24.4 | 27.1 | 23.9 |
| option2 / option3 | 18.9 | 6.7 **<10** | 11.5 | 11.2 |

Smallest: normal 17.6, deuteranopia 6.7, protanopia 11.5, tritanopia 10.7

### Greyscale luminance ladder (relative luminance Y, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#642640` | `#3c3c3c` | 0.0447 |  |
| option1 | `#8e3021` | `#505050` | 0.0797 | 1.37 |
| infravana | `#21678e` | `#616161` | 0.1198 | 1.31 |
| option2 | `#bf581b` | `#767676` | 0.1813 | 1.36 |
| saved | `#2d9a72` | `#898989` | 0.2488 | 1.29 |
| option3 | `#b9810f` | `#8c8c8c` | 0.2605 | 1.04 |

Section accent against the nearest chart fill: CIEDE2000 5.0 (option1).

## R-triad rejected: Triad 232/352/112 (Today around 352, saving at 112)

### Values (OKLCH asked, OKLCH after the gamut step, hex)

| role | L | relative chroma (share of sRGB max) | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | 0.968 | absolute | 0.003 | 0.0035 | 232.0 | `#f2f5f6` |
| surface | 0.985 | absolute | 0.0021 | 0.0017 | 232.0 | `#f9fafb` |
| surface_muted | 0.935 | absolute | 0.0042 | 0.0042 | 232.0 | `#e7eaec` |
| grid | 0.905 | absolute | 0.012 | 0.0119 | 232.0 | `#d8e1e6` |
| border | 0.865 | absolute | 0.012 | 0.012 | 232.0 | `#cbd4d9` |
| border_strong | 0.62 | absolute | 0.012 | 0.0122 | 232.0 | `#7f888c` |
| text | 0.225 | absolute | 0.006 | 0.006 | 232.0 | `#191c1e` |
| text_secondary | 0.47 | absolute | 0.006 | 0.0062 | 232.0 | `#585b5e` |
| text_disabled | 0.62 | absolute | 0.006 | 0.0056 | 232.0 | `#838789` |
| section | 0.5 | absolute | 0.06 | 0.0603 | 232.0 | `#3e6980` |
| infravana | 0.5 | 1.0 | 0.102 | 0.1022 | 232.0 | `#006c93` |
| infravana_text | 0.45 | 1.0 | 0.0918 | 0.0918 | 232.0 | `#005d7f` |
| infravana_deep | 0.38 | 1.0 | 0.0775 | 0.0771 | 232.0 | `#004964` |
| infravana_hover | 0.3 | 1.0 | 0.0612 | 0.0609 | 232.0 | `#003347` |
| soft | 0.935 | absolute | 0.022 | 0.0218 | 232.0 | `#dcedf6` |
| saved | 0.6 | 0.85 | 0.1129 | 0.1126 | 112.0 | `#82862b` |
| saved_text | 0.45 | 0.85 | 0.0847 | 0.085 | 112.0 | `#575a1a` |
| comparator | 0.36 | 0.75 | 0.1189 | 0.1189 | 337.0 | `#611d53` |
| option1 | 0.46 | 0.75 | 0.143 | 0.1427 | 352.0 | `#902d60` |
| option2 | 0.56 | 0.75 | 0.1684 | 0.1682 | 7.0 | `#c13e63` |
| option3 | 0.66 | 0.75 | 0.1702 | 0.1705 | 22.0 | `#e85f61` |

### WCAG 2.x contrast: 38 pairs, 1 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#191c1e` | `#f2f5f6` (bg) | 15.63 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#f2f5f6` (bg) | 6.24 | 4.5 | pass |
| text | body text | `#191c1e` | `#f9fafb` (surface) | 16.39 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#f9fafb` (surface) | 6.54 | 4.5 | pass |
| text | body text | `#191c1e` | `#e7eaec` (surface_muted) | 14.17 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#e7eaec` (surface_muted) | 5.66 | 4.5 | pass |
| text | body text | `#191c1e` | `#dcedf6` (soft) | 14.26 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#dcedf6` (soft) | 5.69 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f2f5f6` (bg) | 6.67 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f9fafb` (surface) | 7.00 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#dcedf6` (soft) | 6.09 | 4.5 | pass |
| text | saving figure | `#575a1a` | `#f2f5f6` (bg) | 6.65 | 4.5 | pass |
| text | section label (step, kicker) | `#3e6980` | `#f2f5f6` (bg) | 5.42 | 4.5 | pass |
| text | saving figure | `#575a1a` | `#f9fafb` (surface) | 6.97 | 4.5 | pass |
| text | section label (step, kicker) | `#3e6980` | `#f9fafb` (surface) | 5.68 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005d7f` | `#dae7ec` (wash) | 5.79 | 4.5 | pass |
| text | label on primary button | `#f9fafb` | `#004964` (infravana_deep) | 9.40 | 4.5 | pass |
| text | label on hovered primary button | `#f9fafb` | `#003347` (infravana_hover) | 12.84 | 4.5 | pass |
| text | chip label inside comparator bar | `#f9fafb` | `#611d53` (comparator) | 11.11 | 4.5 | pass |
| text | chip label inside infravana bar | `#f9fafb` | `#006c93` (infravana) | 5.63 | 4.5 | pass |
| text | chip label inside saved bar | `#191c1e` | `#82862b` (saved) | 4.40 | 4.5 | FAIL |
| mark | infravana fill on the chart ground | `#006c93` | `#f2f5f6` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on the chart ground | `#82862b` | `#f2f5f6` (bg) | 3.55 | 3.0 | pass |
| mark | comparator fill on the chart ground | `#611d53` | `#f2f5f6` (bg) | 10.60 | 3.0 | pass |
| mark | option1 fill on the chart ground | `#902d60` | `#f2f5f6` (bg) | 7.02 | 3.0 | pass |
| mark | option2 fill on the chart ground | `#c13e63` | `#f2f5f6` (bg) | 4.63 | 3.0 | pass |
| mark | option3 fill on the chart ground | `#e85f61` | `#f2f5f6` (bg) | 3.07 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f2f5f6` (bg) | 6.67 | 3.0 | pass |
| mark | budget line | `#585b5e` | `#f2f5f6` (bg) | 6.24 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f2f5f6` (bg) | 3.30 | 3.0 | pass |
| mark | section rule | `#3e6980` | `#f2f5f6` (bg) | 5.42 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f9fafb` (surface) | 3.46 | 3.0 | pass |
| mark | section rule | `#3e6980` | `#f9fafb` (surface) | 5.68 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f2f5f6` (bg) | 8.97 | 3.0 | pass |
| mark | focus ring | `#191c1e` | `#f2f5f6` (bg) | 15.63 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#dae7ec` (wash) | 5.79 | 3.0 | pass |
| mark | C10 lightest Today line (2px) on the ground | `#e85f61` | `#f2f5f6` (bg) | 3.07 | 3.0 | pass |

### CIEDE2000 between every two chart fills (at least 10)

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 41.9 | 14.8 | 19.6 | 53.8 |
| comparator / saved | 61.1 | 43.7 | 51.4 | 32.9 |
| comparator / option1 | 10.9 | 13.2 | 8.1 **<10** | 11.1 |
| comparator / option2 | 23.5 | 31.5 | 19.4 | 22.2 |
| comparator / option3 | 37.9 | 46.7 | 38.8 | 33.4 |
| infravana / saved | 47.5 | 47.1 | 44.8 | 28.4 |
| infravana / option1 | 45.8 | 16.4 | 13.4 | 57.1 |
| infravana / option2 | 49.9 | 33.2 | 14.1 | 61.6 |
| infravana / option3 | 52.1 | 46.3 | 30.5 | 57.4 |
| saved / option1 | 57.6 | 30.3 | 43.8 | 29.1 |
| saved / option2 | 53.2 | 13.7 | 31.2 | 27.1 |
| saved / option3 | 46.9 | 8.7 **<10** | 14.7 | 27.2 |
| option1 / option2 | 12.9 | 17.9 | 11.6 | 11.4 |
| option1 / option3 | 28.0 | 32.7 | 31.1 | 23.2 |
| option2 / option3 | 15.0 | 14.1 | 18.9 | 11.5 |

Smallest: normal 10.9, deuteranopia 8.7, protanopia 8.1, tritanopia 11.1

### Greyscale luminance ladder (relative luminance Y, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#611d53` | `#393939` | 0.0404 |  |
| option1 | `#902d60` | `#535353` | 0.0865 | 1.51 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.31 |
| option2 | `#c13e63` | `#6e6e6e` | 0.1568 | 1.16 |
| saved | `#82862b` | `#818181` | 0.2197 | 1.3 |
| option3 | `#e85f61` | `#8c8c8c` | 0.262 | 1.16 |

Section accent against the nearest chart fill: CIEDE2000 5.4 (infravana).

## R-analogous rejected: Analogous Today (172 to 292) with a gold saving (complement)

### Values (OKLCH asked, OKLCH after the gamut step, hex)

| role | L | relative chroma (share of sRGB max) | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | 0.968 | absolute | 0.006 | 0.0059 | 232.0 | `#f1f5f8` |
| surface | 0.985 | absolute | 0.0042 | 0.0045 | 232.0 | `#f7fbfc` |
| surface_muted | 0.935 | absolute | 0.0084 | 0.0085 | 232.0 | `#e4ebee` |
| grid | 0.905 | absolute | 0.012 | 0.0119 | 232.0 | `#d8e1e6` |
| border | 0.865 | absolute | 0.012 | 0.012 | 232.0 | `#cbd4d9` |
| border_strong | 0.62 | absolute | 0.012 | 0.0122 | 232.0 | `#7f888c` |
| text | 0.225 | absolute | 0.006 | 0.006 | 232.0 | `#191c1e` |
| text_secondary | 0.47 | absolute | 0.006 | 0.0062 | 232.0 | `#585b5e` |
| text_disabled | 0.62 | absolute | 0.006 | 0.0056 | 232.0 | `#838789` |
| section | 0.5 | absolute | 0.06 | 0.06 | 202.0 | `#356e72` |
| infravana | 0.5 | 1.0 | 0.102 | 0.1022 | 232.0 | `#006c93` |
| infravana_text | 0.45 | 1.0 | 0.0918 | 0.0918 | 232.0 | `#005d7f` |
| infravana_deep | 0.38 | 1.0 | 0.0775 | 0.0771 | 232.0 | `#004964` |
| infravana_hover | 0.3 | 1.0 | 0.0612 | 0.0609 | 232.0 | `#003347` |
| soft | 0.935 | absolute | 0.022 | 0.0218 | 232.0 | `#dcedf6` |
| saved | 0.62 | 0.85 | 0.1128 | 0.1131 | 72.0 | `#b07a2d` |
| saved_text | 0.45 | 0.85 | 0.0819 | 0.0816 | 72.0 | `#714d1a` |
| comparator | 0.33 | 0.75 | 0.048 | 0.0479 | 172.0 | `#173d32` |
| option1 | 0.435 | 0.75 | 0.2019 | 0.2017 | 277.0 | `#3e35bc` |
| option2 | 0.54 | 0.75 | 0.0689 | 0.0694 | 202.0 | `#367b80` |
| option3 | 0.645 | 0.75 | 0.1562 | 0.1561 | 292.0 | `#9179e4` |

### WCAG 2.x contrast: 38 pairs, 0 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#191c1e` | `#f1f5f8` (bg) | 15.62 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#f1f5f8` (bg) | 6.23 | 4.5 | pass |
| text | body text | `#191c1e` | `#f7fbfc` (surface) | 16.44 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#f7fbfc` (surface) | 6.56 | 4.5 | pass |
| text | body text | `#191c1e` | `#e4ebee` (surface_muted) | 14.20 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#e4ebee` (surface_muted) | 5.67 | 4.5 | pass |
| text | body text | `#191c1e` | `#dcedf6` (soft) | 14.26 | 4.5 | pass |
| text | secondary text | `#585b5e` | `#dcedf6` (soft) | 5.69 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f1f5f8` (bg) | 6.67 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#f7fbfc` (surface) | 7.02 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005d7f` | `#dcedf6` (soft) | 6.09 | 4.5 | pass |
| text | saving figure | `#714d1a` | `#f1f5f8` (bg) | 6.89 | 4.5 | pass |
| text | section label (step, kicker) | `#356e72` | `#f1f5f8` (bg) | 5.28 | 4.5 | pass |
| text | saving figure | `#714d1a` | `#f7fbfc` (surface) | 7.26 | 4.5 | pass |
| text | section label (step, kicker) | `#356e72` | `#f7fbfc` (surface) | 5.56 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005d7f` | `#d9e7ee` (wash) | 5.78 | 4.5 | pass |
| text | label on primary button | `#f7fbfc` | `#004964` (infravana_deep) | 9.43 | 4.5 | pass |
| text | label on hovered primary button | `#f7fbfc` | `#003347` (infravana_hover) | 12.89 | 4.5 | pass |
| text | chip label inside comparator bar | `#f7fbfc` | `#173d32` (comparator) | 11.52 | 4.5 | pass |
| text | chip label inside infravana bar | `#f7fbfc` | `#006c93` (infravana) | 5.65 | 4.5 | pass |
| text | chip label inside saved bar | `#191c1e` | `#b07a2d` (saved) | 4.62 | 4.5 | pass |
| mark | infravana fill on the chart ground | `#006c93` | `#f1f5f8` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on the chart ground | `#b07a2d` | `#f1f5f8` (bg) | 3.38 | 3.0 | pass |
| mark | comparator fill on the chart ground | `#173d32` | `#f1f5f8` (bg) | 10.95 | 3.0 | pass |
| mark | option1 fill on the chart ground | `#3e35bc` | `#f1f5f8` (bg) | 7.85 | 3.0 | pass |
| mark | option2 fill on the chart ground | `#367b80` | `#f1f5f8` (bg) | 4.45 | 3.0 | pass |
| mark | option3 fill on the chart ground | `#9179e4` | `#f1f5f8` (bg) | 3.16 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f1f5f8` (bg) | 6.67 | 3.0 | pass |
| mark | budget line | `#585b5e` | `#f1f5f8` (bg) | 6.23 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f1f5f8` (bg) | 3.30 | 3.0 | pass |
| mark | section rule | `#356e72` | `#f1f5f8` (bg) | 5.28 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f7fbfc` (surface) | 3.47 | 3.0 | pass |
| mark | section rule | `#356e72` | `#f7fbfc` (surface) | 5.56 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f1f5f8` (bg) | 8.96 | 3.0 | pass |
| mark | focus ring | `#191c1e` | `#f1f5f8` (bg) | 15.62 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#d9e7ee` (wash) | 5.78 | 3.0 | pass |
| mark | C10 lightest Today line (2px) on the ground | `#9179e4` | `#f1f5f8` (bg) | 3.16 | 3.0 | pass |

### CIEDE2000 between every two chart fills (at least 10)

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 26.3 | 25.1 | 28.4 | 18.6 |
| comparator / saved | 42.1 | 38.1 | 31.2 | 50.2 |
| comparator / option1 | 36.4 | 31.0 | 35.3 | 16.6 |
| comparator / option2 | 22.3 | 22.4 | 24.1 | 21.5 |
| comparator / option3 | 45.1 | 40.0 | 43.3 | 35.9 |
| infravana / saved | 47.0 | 49.3 | 43.8 | 46.3 |
| infravana / option1 | 22.0 | 10.2 | 11.8 | 14.2 |
| infravana / option2 | 13.8 | 11.4 | 12.3 | 4.1 **<10** |
| infravana / option3 | 25.7 | 17.8 | 15.8 | 22.9 |
| saved / option1 | 58.9 | 64.4 | 60.1 | 47.8 |
| saved / option2 | 37.4 | 36.5 | 30.0 | 47.7 |
| saved / option3 | 51.2 | 53.4 | 53.9 | 30.8 |
| option1 / option2 | 31.5 | 20.5 | 23.8 | 18.1 |
| option1 / option3 | 24.2 | 23.2 | 20.9 | 24.7 |
| option2 / option3 | 29.0 | 19.5 | 21.7 | 22.7 |

Smallest: normal 13.8, deuteranopia 10.2, protanopia 11.8, tritanopia 4.1

### Greyscale luminance ladder (relative luminance Y, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#173d32` | `#363636` | 0.0375 |  |
| option1 | `#3e35bc` | `#4c4c4c` | 0.072 | 1.39 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.46 |
| option2 | `#367b80` | `#717171` | 0.1651 | 1.21 |
| saved | `#b07a2d` | `#858585` | 0.2334 | 1.32 |
| option3 | `#9179e4` | `#8a8a8a` | 0.253 | 1.07 |

Section accent against the nearest chart fill: CIEDE2000 4.8 (option2).
