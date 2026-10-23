# Generated checks (do not edit: `python3 -I -B palette.py` writes this file)

Offered options: AZ (Azure) and AG (Azure, gold comparator). The other sets are for comparison.

## AZ: Azure

### Values

| role | rule | L | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | paper | 0.968 | 0.007 | 0.0074 | 85.0 | `#f7f4ef` |
| surface | paper x 0.7 | 0.985 | 0.0049 | 0.0057 | 85.0 | `#fcfaf6` |
| surface_muted | paper x 1.4 (never under a chart) | 0.935 | 0.0098 | 0.0099 | 85.0 | `#ece9e2` |
| grid | rule | 0.905 | 0.012 | 0.0116 | 85.0 | `#e3dfd7` |
| border | rule | 0.865 | 0.012 | 0.0118 | 85.0 | `#d6d2ca` |
| border_strong | rule | 0.62 | 0.012 | 0.0123 | 85.0 | `#89867e` |
| text | ink | 0.225 | 0.006 | 0.0059 | 85.0 | `#1d1c19` |
| text_secondary | ink | 0.47 | 0.006 | 0.0065 | 85.0 | `#5c5b57` |
| text_disabled | ink | 0.62 | 0.006 | 0.0064 | 85.0 | `#888682` |
| section | section accent | 0.5 | 0.06 | 0.06 | 52.0 | `#7f5a43` |
| infravana | brand: sRGB maximum | 0.5 | 0.1415 | 0.1423 | 250.0 | `#0065b0` |
| infravana_text | brand: sRGB maximum | 0.45 | 0.1274 | 0.1271 | 250.0 | `#005798` |
| infravana_deep | brand: sRGB maximum | 0.38 | 0.1076 | 0.1079 | 250.0 | `#004479` |
| infravana_hover | brand: sRGB maximum | 0.3 | 0.0849 | 0.0846 | 250.0 | `#002f56` |
| soft | selected tint | 0.935 | 0.022 | 0.0218 | 250.0 | `#dfebf8` |
| saved | mark: saved | 0.6 | 0.0989 | 0.099 | 172.0 | `#319379` |
| saved_text | saved text | 0.45 | 0.0742 | 0.0739 | 172.0 | `#1e6250` |
| comparator | Today rung 1 | 0.33 | 0.1073 | 0.1073 | 359.0 | `#5d1534` |
| option1 | Today rung 2 | 0.435 | 0.1245 | 0.1248 | 25.0 | `#892e2c` |
| option2 | Today rung 3 | 0.54 | 0.1126 | 0.1124 | 51.0 | `#a1592a` |
| option3 | Today rung 4 | 0.645 | 0.108 | 0.1075 | 77.0 | `#b28439` |
| notice_bg | notice (chrome) | 0.965 | 0.035 | 0.0357 | 90.0 | `#fdf3d9` |
| notice_text | notice (chrome) | 0.4 | 0.08 | 0.08 | 90.0 | `#584503` |
| notice_border | notice (chrome) | 0.45 | 0.09 | 0.0898 | 90.0 | `#695205` |
| preset_violet_1 | preset ramp violet | 0.62 | 0.06 | 0.0597 | 300.0 | `#8b7ea5` |
| preset_violet_2 | preset ramp violet | 0.55 | 0.06 | 0.0599 | 300.0 | `#776a90` |
| preset_violet_3 | preset ramp violet | 0.48 | 0.06 | 0.0603 | 300.0 | `#63567b` |
| preset_violet_4 | preset ramp violet | 0.41 | 0.06 | 0.0592 | 300.0 | `#4f4366` |
| preset_violet_5 | preset ramp violet | 0.34 | 0.06 | 0.0602 | 300.0 | `#3d3052` |
| preset_clay_1 | preset ramp clay | 0.62 | 0.06 | 0.0602 | 52.0 | `#a47c65` |
| preset_clay_2 | preset ramp clay | 0.55 | 0.06 | 0.0597 | 52.0 | `#8e6851` |
| preset_clay_3 | preset ramp clay | 0.48 | 0.06 | 0.0598 | 52.0 | `#79543e` |
| preset_clay_4 | preset ramp clay | 0.41 | 0.06 | 0.0596 | 52.0 | `#64412b` |
| preset_clay_5 | preset ramp clay | 0.34 | 0.06 | 0.0598 | 52.0 | `#502e19` |

### Chart marks by absolute OKLCH C (most vivid first)

infravana 0.142 > option1 0.125 > option2 0.112 > option3 0.107 > comparator 0.107 > saved 0.099

### WCAG 2.x: 66 gated pairs, 0 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 4.5 | pass |
| text | body text | `#1d1c19` | `#fcfaf6` (surface) | 16.35 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#fcfaf6` (surface) | 6.52 | 4.5 | pass |
| text | body text | `#1d1c19` | `#ece9e2` (surface_muted) | 14.05 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#ece9e2` (surface_muted) | 5.61 | 4.5 | pass |
| text | body text | `#1d1c19` | `#dfebf8` (soft) | 14.10 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#dfebf8` (soft) | 5.63 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#f7f4ef` (bg) | 6.80 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#fcfaf6` (surface) | 7.15 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#dfebf8` (soft) | 6.17 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#f7f4ef` (bg) | 6.56 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#fcfaf6` (surface) | 6.90 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005798` | `#dee6e9` (wash) | 5.89 | 4.5 | pass |
| text | label on primary button | `#fcfaf6` | `#004479` (infravana_deep) | 9.58 | 4.5 | pass |
| text | label on hovered primary button | `#fcfaf6` | `#002f56` (infravana_hover) | 13.07 | 4.5 | pass |
| text | label inside the comparator bar | `#fcfaf6` | `#5d1534` (comparator) | 12.42 | 4.5 | pass |
| text | label inside the infravana bar | `#fcfaf6` | `#0065b0` (infravana) | 5.77 | 4.5 | pass |
| text | label inside the saved bar | `#1d1c19` | `#319379` (saved) | 4.53 | 4.5 | pass |
| text | notice text on notice fill | `#584503` | `#fdf3d9` (notice_bg) | 8.38 | 4.5 | pass |
| mark | infravana fill on bg | `#0065b0` | `#f7f4ef` (bg) | 5.49 | 3.0 | pass |
| mark | saved fill on bg | `#319379` | `#f7f4ef` (bg) | 3.43 | 3.0 | pass |
| mark | comparator fill on bg | `#5d1534` | `#f7f4ef` (bg) | 11.80 | 3.0 | pass |
| mark | option1 fill on bg | `#892e2c` | `#f7f4ef` (bg) | 7.68 | 3.0 | pass |
| mark | option2 fill on bg | `#a1592a` | `#f7f4ef` (bg) | 4.81 | 3.0 | pass |
| mark | option3 fill on bg | `#b28439` | `#f7f4ef` (bg) | 3.06 | 3.0 | pass |
| mark | infravana fill on surface | `#0065b0` | `#fcfaf6` (surface) | 5.77 | 3.0 | pass |
| mark | saved fill on surface | `#319379` | `#fcfaf6` (surface) | 3.61 | 3.0 | pass |
| mark | comparator fill on surface | `#5d1534` | `#fcfaf6` (surface) | 12.42 | 3.0 | pass |
| mark | option1 fill on surface | `#892e2c` | `#fcfaf6` (surface) | 8.09 | 3.0 | pass |
| mark | option2 fill on surface | `#a1592a` | `#fcfaf6` (surface) | 5.06 | 3.0 | pass |
| mark | option3 fill on surface | `#b28439` | `#fcfaf6` (surface) | 3.22 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005798` | `#f7f4ef` (bg) | 6.80 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005798` | `#dee6e9` (wash) | 5.89 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005798` | `#dfebf8` (soft) | 6.17 | 3.0 | pass |
| mark | chosen tab and primary button | `#004479` | `#f7f4ef` (bg) | 9.10 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#695205` | `#f7f4ef` (bg) | 6.81 | 3.0 | pass |
| mark | notice border on notice fill | `#695205` | `#fdf3d9` (notice_bg) | 6.76 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on bg | `#8b7ea5` | `#f7f4ef` (bg) | 3.40 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on surface | `#8b7ea5` | `#fcfaf6` (surface) | 3.58 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on bg | `#776a90` | `#f7f4ef` (bg) | 4.51 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on surface | `#776a90` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on bg | `#63567b` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on surface | `#63567b` | `#fcfaf6` (surface) | 6.40 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on bg | `#4f4366` | `#f7f4ef` (bg) | 8.23 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on surface | `#4f4366` | `#fcfaf6` (surface) | 8.66 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on bg | `#3d3052` | `#f7f4ef` (bg) | 10.98 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on surface | `#3d3052` | `#fcfaf6` (surface) | 11.56 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on bg | `#a47c65` | `#f7f4ef` (bg) | 3.39 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on surface | `#a47c65` | `#fcfaf6` (surface) | 3.57 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on bg | `#8e6851` | `#f7f4ef` (bg) | 4.50 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on surface | `#8e6851` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on bg | `#79543e` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on surface | `#79543e` | `#fcfaf6` (surface) | 6.39 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on bg | `#64412b` | `#f7f4ef` (bg) | 8.21 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on surface | `#64412b` | `#fcfaf6` (surface) | 8.63 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on bg | `#502e19` | `#f7f4ef` (bg) | 10.96 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on surface | `#502e19` | `#fcfaf6` (surface) | 11.54 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#888682` | `#f7f4ef` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#319379` | `#ece9e2` (surface_muted) | 3.10 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#b28439` | `#ece9e2` (surface_muted) | 2.77 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#5d1534` | `#ece9e2` (surface_muted) | 10.68 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 38.8 [38.8] | 30.5 [23.8] | 27.2 [26.4] | 57.7 [50.6] |
| comparator / saved | 61.8 [61.8] | 26.2 [26.1] | 37.8 [39.9] | 61.0 [59.8] |
| comparator / option1 | 16.5 [16.5] | 17.5 [20.3] | 20.6 [21.0] | 10.7 [11.9] |
| comparator / option2 | 33.1 [33.1] | 28.5 [34.1] | 34.4 [38.3] | 20.1 [20.8] |
| comparator / option3 | 49.0 [49.0] | 39.4 [45.7] | 45.2 [49.8] | 32.9 [32.1] |
| infravana / saved | 36.3 [36.3] | 29.8 [25.9] | 34.6 [34.7] | 13.3 [12.6] |
| infravana / option1 | 41.1 [41.1] | 45.0 [43.0] | 38.8 [36.2] | 59.6 [51.1] |
| infravana / option2 | 43.9 [43.9] | 51.7 [53.1] | 46.8 [47.1] | 55.7 [49.2] |
| infravana / option3 | 50.1 [50.1] | 56.8 [59.9] | 51.3 [52.5] | 52.8 [46.7] |
| saved / option1 | 56.4 [56.4] | 22.1 [23.5] | 27.2 [27.9] | 60.8 [59.2] |
| saved / option2 | 44.3 [44.3] | 20.3 [24.2] | 20.1 [20.3] | 54.8 [55.1] |
| saved / option3 | 34.8 [34.8] | 22.0 [27.7] | 16.1 [16.9] | 47.7 [49.2] |
| option1 / option2 | 18.0 [18.0] | 12.5 [15.8] | 15.3 [18.3] | 11.1 [10.1] |
| option1 / option3 | 35.5 [35.5] | 25.1 [29.7] | 28.5 [32.1] | 25.1 [22.5] |
| option2 / option3 | 17.6 [17.6] | 11.7 [13.7] | 14.3 [15.4] | 13.6 [11.7] |

Smallest: normal 16.5 [16.5], deuteranopia 11.7 [13.7], protanopia 14.3 [15.4], tritanopia 10.7 [10.1]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#5d1534` | `#313131` | 0.0311 |  |
| option1 | `#892e2c` | `#4d4d4d` | 0.0745 | 1.54 |
| infravana | `#0065b0` | `#636363` | 0.1244 | 1.4 |
| option2 | `#a1592a` | `#6c6c6c` | 0.1489 | 1.14 |
| saved | `#319379` | `#848484` | 0.229 | 1.4 |
| option3 | `#b28439` | `#8c8c8c` | 0.2626 | 1.12 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | option2 | 10.1 |
| notice_border | option2 | 18.8 |
| notice_text | option2 | 21.3 |
| preset_violet_1 | infravana | 24.9 |
| preset_violet_2 | infravana | 21.8 |
| preset_violet_3 | infravana | 21.5 |
| preset_violet_4 | comparator | 18.6 |
| preset_violet_5 | comparator | 16.5 |
| preset_clay_1 | option3 | 13.7 |
| preset_clay_2 | option2 | 9.7 |
| preset_clay_3 | option2 | 11.0 |
| preset_clay_4 | option1 | 14.3 |
| preset_clay_5 | option1 | 15.7 |

### Distance from 12A, role by role (CIEDE2000)

comparator 3.8 · infravana 5.9 · saved 4.5 · option1 4.6 · option2 6.7 · option3 4.5 · bg 0.5

**Gate failures: 0**

## AG: Azure, gold comparator

### Values

| role | rule | L | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | paper | 0.968 | 0.007 | 0.0074 | 85.0 | `#f7f4ef` |
| surface | paper x 0.7 | 0.985 | 0.0049 | 0.0057 | 85.0 | `#fcfaf6` |
| surface_muted | paper x 1.4 (never under a chart) | 0.935 | 0.0098 | 0.0099 | 85.0 | `#ece9e2` |
| grid | rule | 0.905 | 0.012 | 0.0116 | 85.0 | `#e3dfd7` |
| border | rule | 0.865 | 0.012 | 0.0118 | 85.0 | `#d6d2ca` |
| border_strong | rule | 0.62 | 0.012 | 0.0123 | 85.0 | `#89867e` |
| text | ink | 0.225 | 0.006 | 0.0059 | 85.0 | `#1d1c19` |
| text_secondary | ink | 0.47 | 0.006 | 0.0065 | 85.0 | `#5c5b57` |
| text_disabled | ink | 0.62 | 0.006 | 0.0064 | 85.0 | `#888682` |
| section | section accent | 0.5 | 0.06 | 0.06 | 52.0 | `#7f5a43` |
| infravana | brand: sRGB maximum | 0.5 | 0.1415 | 0.1423 | 250.0 | `#0065b0` |
| infravana_text | brand: sRGB maximum | 0.45 | 0.1274 | 0.1271 | 250.0 | `#005798` |
| infravana_deep | brand: sRGB maximum | 0.38 | 0.1076 | 0.1079 | 250.0 | `#004479` |
| infravana_hover | brand: sRGB maximum | 0.3 | 0.0849 | 0.0846 | 250.0 | `#002f56` |
| soft | selected tint | 0.935 | 0.022 | 0.0218 | 250.0 | `#dfebf8` |
| saved | mark: saved | 0.6 | 0.0989 | 0.099 | 172.0 | `#319379` |
| saved_text | saved text | 0.45 | 0.0742 | 0.0739 | 172.0 | `#1e6250` |
| comparator | Today rung 4 | 0.645 | 0.108 | 0.1075 | 77.0 | `#b28439` |
| option1 | Today rung 1 | 0.33 | 0.1073 | 0.1073 | 359.0 | `#5d1534` |
| option2 | Today rung 2 | 0.435 | 0.1245 | 0.1248 | 25.0 | `#892e2c` |
| option3 | Today rung 3 | 0.54 | 0.1126 | 0.1124 | 51.0 | `#a1592a` |
| notice_bg | notice (chrome) | 0.965 | 0.035 | 0.0357 | 90.0 | `#fdf3d9` |
| notice_text | notice (chrome) | 0.4 | 0.08 | 0.08 | 90.0 | `#584503` |
| notice_border | notice (chrome) | 0.45 | 0.09 | 0.0898 | 90.0 | `#695205` |
| preset_violet_1 | preset ramp violet | 0.62 | 0.06 | 0.0597 | 300.0 | `#8b7ea5` |
| preset_violet_2 | preset ramp violet | 0.55 | 0.06 | 0.0599 | 300.0 | `#776a90` |
| preset_violet_3 | preset ramp violet | 0.48 | 0.06 | 0.0603 | 300.0 | `#63567b` |
| preset_violet_4 | preset ramp violet | 0.41 | 0.06 | 0.0592 | 300.0 | `#4f4366` |
| preset_violet_5 | preset ramp violet | 0.34 | 0.06 | 0.0602 | 300.0 | `#3d3052` |
| preset_clay_1 | preset ramp clay | 0.62 | 0.06 | 0.0602 | 52.0 | `#a47c65` |
| preset_clay_2 | preset ramp clay | 0.55 | 0.06 | 0.0597 | 52.0 | `#8e6851` |
| preset_clay_3 | preset ramp clay | 0.48 | 0.06 | 0.0598 | 52.0 | `#79543e` |
| preset_clay_4 | preset ramp clay | 0.41 | 0.06 | 0.0596 | 52.0 | `#64412b` |
| preset_clay_5 | preset ramp clay | 0.34 | 0.06 | 0.0598 | 52.0 | `#502e19` |

### Chart marks by absolute OKLCH C (most vivid first)

infravana 0.142 > option2 0.125 > option3 0.112 > option1 0.107 > comparator 0.107 > saved 0.099

### WCAG 2.x: 66 gated pairs, 0 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 4.5 | pass |
| text | body text | `#1d1c19` | `#fcfaf6` (surface) | 16.35 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#fcfaf6` (surface) | 6.52 | 4.5 | pass |
| text | body text | `#1d1c19` | `#ece9e2` (surface_muted) | 14.05 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#ece9e2` (surface_muted) | 5.61 | 4.5 | pass |
| text | body text | `#1d1c19` | `#dfebf8` (soft) | 14.10 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#dfebf8` (soft) | 5.63 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#f7f4ef` (bg) | 6.80 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#fcfaf6` (surface) | 7.15 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#dfebf8` (soft) | 6.17 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#f7f4ef` (bg) | 6.56 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#fcfaf6` (surface) | 6.90 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005798` | `#dee6e9` (wash) | 5.89 | 4.5 | pass |
| text | label on primary button | `#fcfaf6` | `#004479` (infravana_deep) | 9.58 | 4.5 | pass |
| text | label on hovered primary button | `#fcfaf6` | `#002f56` (infravana_hover) | 13.07 | 4.5 | pass |
| text | label inside the comparator bar | `#1d1c19` | `#b28439` (comparator) | 5.07 | 4.5 | pass |
| text | label inside the infravana bar | `#fcfaf6` | `#0065b0` (infravana) | 5.77 | 4.5 | pass |
| text | label inside the saved bar | `#1d1c19` | `#319379` (saved) | 4.53 | 4.5 | pass |
| text | notice text on notice fill | `#584503` | `#fdf3d9` (notice_bg) | 8.38 | 4.5 | pass |
| mark | infravana fill on bg | `#0065b0` | `#f7f4ef` (bg) | 5.49 | 3.0 | pass |
| mark | saved fill on bg | `#319379` | `#f7f4ef` (bg) | 3.43 | 3.0 | pass |
| mark | comparator fill on bg | `#b28439` | `#f7f4ef` (bg) | 3.06 | 3.0 | pass |
| mark | option1 fill on bg | `#5d1534` | `#f7f4ef` (bg) | 11.80 | 3.0 | pass |
| mark | option2 fill on bg | `#892e2c` | `#f7f4ef` (bg) | 7.68 | 3.0 | pass |
| mark | option3 fill on bg | `#a1592a` | `#f7f4ef` (bg) | 4.81 | 3.0 | pass |
| mark | infravana fill on surface | `#0065b0` | `#fcfaf6` (surface) | 5.77 | 3.0 | pass |
| mark | saved fill on surface | `#319379` | `#fcfaf6` (surface) | 3.61 | 3.0 | pass |
| mark | comparator fill on surface | `#b28439` | `#fcfaf6` (surface) | 3.22 | 3.0 | pass |
| mark | option1 fill on surface | `#5d1534` | `#fcfaf6` (surface) | 12.42 | 3.0 | pass |
| mark | option2 fill on surface | `#892e2c` | `#fcfaf6` (surface) | 8.09 | 3.0 | pass |
| mark | option3 fill on surface | `#a1592a` | `#fcfaf6` (surface) | 5.06 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005798` | `#f7f4ef` (bg) | 6.80 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005798` | `#dee6e9` (wash) | 5.89 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005798` | `#dfebf8` (soft) | 6.17 | 3.0 | pass |
| mark | chosen tab and primary button | `#004479` | `#f7f4ef` (bg) | 9.10 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#695205` | `#f7f4ef` (bg) | 6.81 | 3.0 | pass |
| mark | notice border on notice fill | `#695205` | `#fdf3d9` (notice_bg) | 6.76 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on bg | `#8b7ea5` | `#f7f4ef` (bg) | 3.40 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on surface | `#8b7ea5` | `#fcfaf6` (surface) | 3.58 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on bg | `#776a90` | `#f7f4ef` (bg) | 4.51 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on surface | `#776a90` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on bg | `#63567b` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on surface | `#63567b` | `#fcfaf6` (surface) | 6.40 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on bg | `#4f4366` | `#f7f4ef` (bg) | 8.23 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on surface | `#4f4366` | `#fcfaf6` (surface) | 8.66 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on bg | `#3d3052` | `#f7f4ef` (bg) | 10.98 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on surface | `#3d3052` | `#fcfaf6` (surface) | 11.56 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on bg | `#a47c65` | `#f7f4ef` (bg) | 3.39 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on surface | `#a47c65` | `#fcfaf6` (surface) | 3.57 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on bg | `#8e6851` | `#f7f4ef` (bg) | 4.50 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on surface | `#8e6851` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on bg | `#79543e` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on surface | `#79543e` | `#fcfaf6` (surface) | 6.39 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on bg | `#64412b` | `#f7f4ef` (bg) | 8.21 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on surface | `#64412b` | `#fcfaf6` (surface) | 8.63 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on bg | `#502e19` | `#f7f4ef` (bg) | 10.96 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on surface | `#502e19` | `#fcfaf6` (surface) | 11.54 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#888682` | `#f7f4ef` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#319379` | `#ece9e2` (surface_muted) | 3.10 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#a1592a` | `#ece9e2` (surface_muted) | 4.35 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#b28439` | `#ece9e2` (surface_muted) | 2.77 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 50.1 [50.1] | 56.8 [59.9] | 51.3 [52.5] | 52.8 [46.7] |
| comparator / saved | 34.8 [34.8] | 22.0 [27.7] | 16.1 [16.9] | 47.7 [49.2] |
| comparator / option1 | 49.0 [49.0] | 39.4 [45.7] | 45.2 [49.8] | 32.9 [32.1] |
| comparator / option2 | 35.5 [35.5] | 25.1 [29.7] | 28.5 [32.1] | 25.1 [22.5] |
| comparator / option3 | 17.6 [17.6] | 11.7 [13.7] | 14.3 [15.4] | 13.6 [11.7] |
| infravana / saved | 36.3 [36.3] | 29.8 [25.9] | 34.6 [34.7] | 13.3 [12.6] |
| infravana / option1 | 38.8 [38.8] | 30.5 [23.8] | 27.2 [26.4] | 57.7 [50.6] |
| infravana / option2 | 41.1 [41.1] | 45.0 [43.0] | 38.8 [36.2] | 59.6 [51.1] |
| infravana / option3 | 43.9 [43.9] | 51.7 [53.1] | 46.8 [47.1] | 55.7 [49.2] |
| saved / option1 | 61.8 [61.8] | 26.2 [26.1] | 37.8 [39.9] | 61.0 [59.8] |
| saved / option2 | 56.4 [56.4] | 22.1 [23.5] | 27.2 [27.9] | 60.8 [59.2] |
| saved / option3 | 44.3 [44.3] | 20.3 [24.2] | 20.1 [20.3] | 54.8 [55.1] |
| option1 / option2 | 16.5 [16.5] | 17.5 [20.3] | 20.6 [21.0] | 10.7 [11.9] |
| option1 / option3 | 33.1 [33.1] | 28.5 [34.1] | 34.4 [38.3] | 20.1 [20.8] |
| option2 / option3 | 18.0 [18.0] | 12.5 [15.8] | 15.3 [18.3] | 11.1 [10.1] |

Smallest: normal 16.5 [16.5], deuteranopia 11.7 [13.7], protanopia 14.3 [15.4], tritanopia 10.7 [10.1]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| option1 | `#5d1534` | `#313131` | 0.0311 |  |
| option2 | `#892e2c` | `#4d4d4d` | 0.0745 | 1.54 |
| infravana | `#0065b0` | `#636363` | 0.1244 | 1.4 |
| option3 | `#a1592a` | `#6c6c6c` | 0.1489 | 1.14 |
| saved | `#319379` | `#848484` | 0.229 | 1.4 |
| comparator | `#b28439` | `#8c8c8c` | 0.2626 | 1.12 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | option3 | 10.1 |
| notice_border | option3 | 18.8 |
| notice_text | option3 | 21.3 |
| preset_violet_1 | infravana | 24.9 |
| preset_violet_2 | infravana | 21.8 |
| preset_violet_3 | infravana | 21.5 |
| preset_violet_4 | option1 | 18.6 |
| preset_violet_5 | option1 | 16.5 |
| preset_clay_1 | comparator | 13.7 |
| preset_clay_2 | option3 | 9.7 |
| preset_clay_3 | option3 | 11.0 |
| preset_clay_4 | option2 | 14.3 |
| preset_clay_5 | option2 | 15.7 |

### Distance from 12A, role by role (CIEDE2000)

comparator 46.5 · infravana 5.9 · saved 4.5 · option1 20.8 · option2 21.2 · option3 18.9 · bg 0.5

**Gate failures: 0**

## 12A: 12A Daybreak, as drawn in round 1

### Chart marks by absolute OKLCH C (most vivid first)

option2 0.149 > option3 0.131 > option1 0.131 > saved 0.115 > comparator 0.094 > infravana 0.092

### WCAG 2.x: 46 gated pairs, 0 failures

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
| text | label inside the comparator bar | `#fbfaf6` | `#642640` (comparator) | 10.62 | 4.5 | pass |
| text | label inside the infravana bar | `#fbfaf6` | `#21678e` (infravana) | 5.92 | 4.5 | pass |
| text | label inside the saved bar | `#1c1c1a` | `#2d9a72` (saved) | 4.86 | 4.5 | pass |
| text | notice text on notice fill | `#6b4a00` | `#fff6dd` (notice_bg) | 7.48 | 4.5 | pass |
| mark | infravana fill on bg | `#21678e` | `#f6f4ef` (bg) | 5.63 | 3.0 | pass |
| mark | saved fill on bg | `#2d9a72` | `#f6f4ef` (bg) | 3.20 | 3.0 | pass |
| mark | comparator fill on bg | `#642640` | `#f6f4ef` (bg) | 10.09 | 3.0 | pass |
| mark | option1 fill on bg | `#8e3021` | `#f6f4ef` (bg) | 7.36 | 3.0 | pass |
| mark | option2 fill on bg | `#bf581b` | `#f6f4ef` (bg) | 4.13 | 3.0 | pass |
| mark | option3 fill on bg | `#b9810f` | `#f6f4ef` (bg) | 3.08 | 3.0 | pass |
| mark | infravana fill on surface | `#21678e` | `#fbfaf6` (surface) | 5.92 | 3.0 | pass |
| mark | saved fill on surface | `#2d9a72` | `#fbfaf6` (surface) | 3.36 | 3.0 | pass |
| mark | comparator fill on surface | `#642640` | `#fbfaf6` (surface) | 10.62 | 3.0 | pass |
| mark | option1 fill on surface | `#8e3021` | `#fbfaf6` (surface) | 7.75 | 3.0 | pass |
| mark | option2 fill on surface | `#bf581b` | `#fbfaf6` (surface) | 4.35 | 3.0 | pass |
| mark | option3 fill on surface | `#b9810f` | `#fbfaf6` (surface) | 3.24 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#1d587a` | `#f6f4ef` (bg) | 7.00 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#1d587a` | `#e1e6e5` (wash) | 6.10 | 3.0 | pass |
| mark | budget line | `#5c5a55` | `#f6f4ef` (bg) | 6.27 | 3.0 | pass |
| mark | input, chip and axis border | `#8a867f` | `#f6f4ef` (bg) | 3.30 | 3.0 | pass |
| mark | section rule | `#9a422d` | `#f6f4ef` (bg) | 5.99 | 3.0 | pass |
| mark | input, chip and axis border | `#8a867f` | `#fbfaf6` (surface) | 3.47 | 3.0 | pass |
| mark | section rule | `#9a422d` | `#fbfaf6` (surface) | 6.30 | 3.0 | pass |
| mark | selected-row edge | `#1d587a` | `#dfe9ee` (soft) | 6.24 | 3.0 | pass |
| mark | chosen tab and primary button | `#184661` | `#f6f4ef` (bg) | 9.15 | 3.0 | pass |
| mark | focus ring | `#1c1c1a` | `#f6f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#a07a1a` | `#f6f4ef` (bg) | 3.61 | 3.0 | pass |
| mark | notice border on notice fill | `#a07a1a` | `#fff6dd` (notice_bg) | 3.68 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#8a867f` | `#f6f4ef` (bg) | 3.30 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#2d9a72` | `#eeebe3` (surface_muted) | 2.95 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#b9810f` | `#eeebe3` (surface_muted) | 2.84 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#642640` | `#eeebe3` (surface_muted) | 9.31 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 39.9 [39.9] | 21.5 [19.7] | 19.8 [19.5] | 54.0 [47.8] |
| comparator / saved | 62.2 [62.2] | 26.4 [23.9] | 39.6 [39.2] | 59.4 [59.5] |
| comparator / option1 | 19.9 [19.9] | 20.3 [21.2] | 24.6 [23.0] | 10.7 [13.0] |
| comparator / option2 | 35.2 [35.2] | 33.0 [34.2] | 36.7 [36.2] | 22.6 [26.4] |
| comparator / option3 | 49.4 [49.4] | 39.5 [43.7] | 44.9 [46.1] | 29.6 [30.6] |
| infravana / saved | 34.8 [34.8] | 31.7 [27.3] | 34.9 [34.3] | 15.8 [16.7] |
| infravana / option1 | 43.5 [43.5] | 40.7 [40.1] | 36.3 [34.8] | 51.6 [50.9] |
| infravana / option2 | 45.7 [45.7] | 48.4 [48.2] | 42.5 [41.4] | 52.6 [53.5] |
| infravana / option3 | 51.2 [51.2] | 52.3 [54.4] | 46.8 [46.5] | 47.4 [50.0] |
| saved / option1 | 58.4 [58.4] | 21.8 [22.5] | 29.0 [29.7] | 62.7 [61.6] |
| saved / option2 | 51.4 [51.4] | 18.5 [21.2] | 19.4 [20.4] | 60.5 [60.6] |
| saved / option3 | 37.8 [37.8] | 20.3 [25.3] | 15.9 [17.1] | 50.8 [54.2] |
| option1 / option2 | 17.6 [17.6] | 16.6 [17.4] | 16.1 [17.1] | 14.2 [15.1] |
| option1 / option3 | 34.2 [34.2] | 24.4 [29.3] | 27.1 [30.3] | 23.9 [21.0] |
| option2 / option3 | 18.9 [18.9] | 6.7 [10.9] **<10** | 11.5 [14.1] | 11.2 [7.3] **<10** |

Smallest: normal 17.6 [17.6], deuteranopia 6.7 [10.9], protanopia 11.5 [14.1], tritanopia 10.7 [7.3]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#642640` | `#3c3c3c` | 0.0447 |  |
| option1 | `#8e3021` | `#505050` | 0.0797 | 1.37 |
| infravana | `#21678e` | `#616161` | 0.1198 | 1.31 |
| option2 | `#bf581b` | `#767676` | 0.1813 | 1.36 |
| saved | `#2d9a72` | `#898989` | 0.2488 | 1.29 |
| option3 | `#b9810f` | `#8c8c8c` | 0.2605 | 1.04 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | option1 | 5.0 |
| notice_border | option3 | 6.3 |
| notice_text | option2 | 22.2 |

### Distance from 12A, role by role (CIEDE2000)

comparator 0.0 · infravana 0.0 · saved 0.0 · option1 0.0 · option2 0.0 · option3 0.0 · bg 0.0

**Gate failures: 5**: dE deuteranopia option2/option3 6.7; dE tritanopia_gamma option2/option3 7.3; InfraVana not the most vivid: (0.149, 'option2'); section 5.0 from option1; notice_border 6.3 from option3

## P1-r1: P1 Complementary, palette round 1 (dropped: within 2.8 to 6.7 of 12A, InfraVana 5th of 6 by C)

### Chart marks by absolute OKLCH C (most vivid first)

option1 0.142 > option2 0.112 > option3 0.107 > comparator 0.107 > infravana 0.102 > saved 0.099

### WCAG 2.x: 46 gated pairs, 0 failures

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
| text | label inside the comparator bar | `#fcfaf6` | `#5d1534` (comparator) | 12.42 | 4.5 | pass |
| text | label inside the infravana bar | `#fcfaf6` | `#006c93` (infravana) | 5.65 | 4.5 | pass |
| text | label inside the saved bar | `#1d1c19` | `#319379` (saved) | 4.53 | 4.5 | pass |
| text | notice text on notice fill | `#6b4a00` | `#fff6dd` (notice_bg) | 7.48 | 4.5 | pass |
| mark | infravana fill on bg | `#006c93` | `#f7f4ef` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on bg | `#319379` | `#f7f4ef` (bg) | 3.43 | 3.0 | pass |
| mark | comparator fill on bg | `#5d1534` | `#f7f4ef` (bg) | 11.80 | 3.0 | pass |
| mark | option1 fill on bg | `#8f2526` | `#f7f4ef` (bg) | 7.78 | 3.0 | pass |
| mark | option2 fill on bg | `#a1592a` | `#f7f4ef` (bg) | 4.81 | 3.0 | pass |
| mark | option3 fill on bg | `#b28439` | `#f7f4ef` (bg) | 3.06 | 3.0 | pass |
| mark | infravana fill on surface | `#006c93` | `#fcfaf6` (surface) | 5.65 | 3.0 | pass |
| mark | saved fill on surface | `#319379` | `#fcfaf6` (surface) | 3.61 | 3.0 | pass |
| mark | comparator fill on surface | `#5d1534` | `#fcfaf6` (surface) | 12.42 | 3.0 | pass |
| mark | option1 fill on surface | `#8f2526` | `#fcfaf6` (surface) | 8.19 | 3.0 | pass |
| mark | option2 fill on surface | `#a1592a` | `#fcfaf6` (surface) | 5.06 | 3.0 | pass |
| mark | option3 fill on surface | `#b28439` | `#fcfaf6` (surface) | 3.22 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f7f4ef` (bg) | 6.66 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#dee6e6` (wash) | 5.77 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f7f4ef` (bg) | 8.96 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#a07a1a` | `#f7f4ef` (bg) | 3.62 | 3.0 | pass |
| mark | notice border on notice fill | `#a07a1a` | `#fff6dd` (notice_bg) | 3.68 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#888682` | `#f7f4ef` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#319379` | `#ece9e2` (surface_muted) | 3.10 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#b28439` | `#ece9e2` (surface_muted) | 2.77 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#5d1534` | `#ece9e2` (surface_muted) | 10.68 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 46.5 [46.5] | 26.2 [21.4] | 24.4 [24.1] | 57.8 [52.3] |
| comparator / saved | 61.8 [61.8] | 26.2 [26.1] | 37.8 [39.9] | 61.0 [59.8] |
| comparator / option1 | 17.5 [17.5] | 19.0 [20.3] | 21.4 [19.8] | 11.9 [13.6] |
| comparator / option2 | 33.1 [33.1] | 28.5 [34.1] | 34.4 [38.3] | 20.1 [20.8] |
| comparator / option3 | 49.0 [49.0] | 39.4 [45.7] | 45.2 [49.8] | 32.9 [32.1] |
| infravana / saved | 28.7 [28.7] | 24.7 [23.1] | 28.6 [29.1] | 11.8 [11.0] |
| infravana / option1 | 48.0 [48.0] | 40.6 [39.0] | 34.4 [31.6] | 53.5 [54.1] |
| infravana / option2 | 43.3 [43.3] | 44.6 [47.5] | 39.5 [40.0] | 48.4 [50.9] |
| infravana / option3 | 47.4 [47.4] | 49.8 [54.6] | 43.8 [45.2] | 45.5 [47.9] |
| saved / option1 | 58.6 [58.6] | 23.0 [24.9] | 28.2 [30.0] | 62.3 [60.2] |
| saved / option2 | 44.3 [44.3] | 20.3 [24.2] | 20.1 [20.3] | 54.8 [55.1] |
| saved / option3 | 34.8 [34.8] | 22.0 [27.7] | 16.1 [16.9] | 47.7 [49.2] |
| option1 / option2 | 18.6 [18.6] | 11.5 [16.6] | 15.3 [20.2] | 11.9 [10.3] |
| option1 / option3 | 36.5 [36.5] | 24.4 [30.7] | 28.8 [34.1] | 25.9 [22.6] |
| option2 / option3 | 17.6 [17.6] | 11.7 [13.7] | 14.3 [15.4] | 13.6 [11.7] |

Smallest: normal 17.5 [17.5], deuteranopia 11.5 [13.7], protanopia 14.3 [15.4], tritanopia 11.8 [10.3]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#5d1534` | `#313131` | 0.0311 |  |
| option1 | `#8f2526` | `#4c4c4c` | 0.073 | 1.52 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.45 |
| option2 | `#a1592a` | `#6c6c6c` | 0.1489 | 1.12 |
| saved | `#319379` | `#848484` | 0.229 | 1.4 |
| option3 | `#b28439` | `#8c8c8c` | 0.2626 | 1.12 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | option2 | 10.1 |
| notice_border | option3 | 6.1 |
| notice_text | option2 | 16.3 |

### Distance from 12A, role by role (CIEDE2000)

comparator 3.8 · infravana 2.8 · saved 4.5 · option1 4.5 · option2 6.7 · option3 4.5 · bg 0.5

**Gate failures: 2**: InfraVana not the most vivid: (0.142, 'option1'); notice_border 6.1 from option3

## P2-r1: P2 'Rectangle', palette round 1 (dropped: not a rectangle, alarm red, InfraVana last by C)

### Chart marks by absolute OKLCH C (most vivid first)

option2 0.198 > option3 0.158 > option1 0.157 > saved 0.138 > comparator 0.124 > infravana 0.102

### WCAG 2.x: 46 gated pairs, 0 failures

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
| text | label inside the comparator bar | `#f9fafb` | `#5f0d40` (comparator) | 12.42 | 4.5 | pass |
| text | label inside the infravana bar | `#f9fafb` | `#006c93` (infravana) | 5.63 | 4.5 | pass |
| text | label inside the saved bar | `#191c1e` | `#349d5b` (saved) | 4.99 | 4.5 | pass |
| text | notice text on notice fill | `#6b4a00` | `#fff6dd` (notice_bg) | 7.48 | 4.5 | pass |
| mark | infravana fill on bg | `#006c93` | `#f2f5f6` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on bg | `#349d5b` | `#f2f5f6` (bg) | 3.13 | 3.0 | pass |
| mark | comparator fill on bg | `#5f0d40` | `#f2f5f6` (bg) | 11.84 | 3.0 | pass |
| mark | option1 fill on bg | `#921840` | `#f2f5f6` (bg) | 7.90 | 3.0 | pass |
| mark | option2 fill on bg | `#c82521` | `#f2f5f6` (bg) | 5.12 | 3.0 | pass |
| mark | option3 fill on bg | `#d86a26` | `#f2f5f6` (bg) | 3.19 | 3.0 | pass |
| mark | infravana fill on surface | `#006c93` | `#f9fafb` (surface) | 5.63 | 3.0 | pass |
| mark | saved fill on surface | `#349d5b` | `#f9fafb` (surface) | 3.28 | 3.0 | pass |
| mark | comparator fill on surface | `#5f0d40` | `#f9fafb` (surface) | 12.42 | 3.0 | pass |
| mark | option1 fill on surface | `#921840` | `#f9fafb` (surface) | 8.28 | 3.0 | pass |
| mark | option2 fill on surface | `#c82521` | `#f9fafb` (surface) | 5.37 | 3.0 | pass |
| mark | option3 fill on surface | `#d86a26` | `#f9fafb` (surface) | 3.34 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f2f5f6` (bg) | 6.67 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#dae7ec` (wash) | 5.79 | 3.0 | pass |
| mark | budget line | `#585b5e` | `#f2f5f6` (bg) | 6.24 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f2f5f6` (bg) | 3.30 | 3.0 | pass |
| mark | section rule | `#214d62` | `#f2f5f6` (bg) | 8.32 | 3.0 | pass |
| mark | input, chip and axis border | `#7f888c` | `#f9fafb` (surface) | 3.46 | 3.0 | pass |
| mark | section rule | `#214d62` | `#f9fafb` (surface) | 8.73 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f2f5f6` (bg) | 8.97 | 3.0 | pass |
| mark | focus ring | `#191c1e` | `#f2f5f6` (bg) | 15.63 | 3.0 | pass |
| mark | notice border on paper | `#a07a1a` | `#f2f5f6` (bg) | 3.62 | 3.0 | pass |
| mark | notice border on notice fill | `#a07a1a` | `#fff6dd` (notice_bg) | 3.68 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#838789` | `#f2f5f6` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#349d5b` | `#e7eaec` (surface_muted) | 2.84 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#d86a26` | `#e7eaec` (surface_muted) | 2.89 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#5f0d40` | `#e7eaec` (surface_muted) | 10.74 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 46.2 [46.2] | 20.2 [17.9] | 23.1 [24.1] | 57.5 [53.2] |
| comparator / saved | 72.5 [72.5] | 36.1 [40.0] | 50.6 [54.3] | 64.4 [62.6] |
| comparator / option1 | 13.4 [13.4] | 19.4 [13.5] | 11.8 [6.9] **<10** | 12.4 [13.1] |
| comparator / option2 | 31.4 [31.4] | 36.6 [35.7] | 36.1 [32.6] | 25.7 [28.2] |
| comparator / option3 | 46.6 [46.6] | 46.4 [51.8] | 48.5 [52.0] | 32.5 [35.6] |
| infravana / saved | 40.7 [40.7] | 40.1 [40.8] | 40.9 [41.4] | 14.7 [13.1] |
| infravana / option1 | 49.5 [49.5] | 32.2 [22.8] | 21.3 [20.8] | 53.7 [54.8] |
| infravana / option2 | 51.5 [51.5] | 47.1 [44.0] | 38.7 [35.4] | 54.8 [57.3] |
| infravana / option3 | 49.7 [49.7] | 52.5 [54.7] | 44.0 [43.8] | 54.8 [57.4] |
| saved / option1 | 71.5 [71.5] | 20.2 [26.8] | 39.1 [47.1] | 65.1 [63.1] |
| saved / option2 | 67.1 [67.1] | 12.5 [16.9] | 24.7 [31.4] | 63.9 [63.0] |
| saved / option3 | 52.6 [52.6] | 12.9 [14.3] | 10.1 [11.2] | 61.8 [61.4] |
| option1 / option2 | 19.1 [19.1] | 18.5 [20.8] | 23.2 [25.8] | 13.7 [15.6] |
| option1 / option3 | 35.7 [35.7] | 29.7 [37.6] | 35.4 [44.3] | 22.3 [24.1] |
| option2 / option3 | 19.1 [19.1] | 11.7 [21.9] | 16.8 [24.2] | 12.4 [10.0] |

Smallest: normal 13.4 [13.4], deuteranopia 11.7 [13.5], protanopia 10.1 [6.9], tritanopia 12.4 [10.0]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#5f0d40` | `#313131` | 0.0309 |  |
| option1 | `#921840` | `#4c4c4c` | 0.0713 | 1.5 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.47 |
| option2 | `#c82521` | `#686868` | 0.1371 | 1.05 |
| option3 | `#d86a26` | `#898989` | 0.2505 | 1.61 |
| saved | `#349d5b` | `#8a8a8a` | 0.256 | 1.02 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | infravana | 11.4 |
| notice_border | option3 | 20.3 |
| notice_text | option3 | 27.9 |

### Distance from 12A, role by role (CIEDE2000)

comparator 6.0 · infravana 2.8 · saved 6.4 · option1 14.9 · option2 14.0 · option3 16.7 · bg 3.4

**Gate failures: 2**: dE protanopia_gamma comparator/option1 6.9; InfraVana not the most vivid: (0.198, 'option2')

## R-petrol: rejected: Hero at the logo hue 232 (C 0.102) with every mark capped under it

### Values

| role | rule | L | C asked | C actual | h | hex |
|---|---|---|---|---|---|---|
| bg | paper | 0.968 | 0.007 | 0.0074 | 85.0 | `#f7f4ef` |
| surface | paper x 0.7 | 0.985 | 0.0049 | 0.0057 | 85.0 | `#fcfaf6` |
| surface_muted | paper x 1.4 (never under a chart) | 0.935 | 0.0098 | 0.0099 | 85.0 | `#ece9e2` |
| grid | rule | 0.905 | 0.012 | 0.0116 | 85.0 | `#e3dfd7` |
| border | rule | 0.865 | 0.012 | 0.0118 | 85.0 | `#d6d2ca` |
| border_strong | rule | 0.62 | 0.012 | 0.0123 | 85.0 | `#89867e` |
| text | ink | 0.225 | 0.006 | 0.0059 | 85.0 | `#1d1c19` |
| text_secondary | ink | 0.47 | 0.006 | 0.0065 | 85.0 | `#5c5b57` |
| text_disabled | ink | 0.62 | 0.006 | 0.0064 | 85.0 | `#888682` |
| section | section accent | 0.5 | 0.06 | 0.06 | 52.0 | `#7f5a43` |
| infravana | brand: sRGB maximum | 0.5 | 0.102 | 0.1022 | 232.0 | `#006c93` |
| infravana_text | brand: sRGB maximum | 0.45 | 0.0918 | 0.0918 | 232.0 | `#005d7f` |
| infravana_deep | brand: sRGB maximum | 0.38 | 0.0775 | 0.0771 | 232.0 | `#004964` |
| infravana_hover | brand: sRGB maximum | 0.3 | 0.0612 | 0.0609 | 232.0 | `#003347` |
| soft | selected tint | 0.935 | 0.022 | 0.0218 | 232.0 | `#dcedf6` |
| saved | mark: saved | 0.6 | 0.0918 | 0.0917 | 172.0 | `#3b927a` |
| saved_text | saved text | 0.45 | 0.0742 | 0.0739 | 172.0 | `#1e6250` |
| comparator | Today rung 1 | 0.33 | 0.0918 | 0.0916 | 359.0 | `#591d34` |
| option1 | Today rung 2 | 0.435 | 0.0918 | 0.0913 | 25.0 | `#7c3b37` |
| option2 | Today rung 3 | 0.54 | 0.0918 | 0.0923 | 51.0 | `#995e3a` |
| option3 | Today rung 4 | 0.645 | 0.0918 | 0.0913 | 77.0 | `#ad864a` |
| notice_bg | notice (chrome) | 0.965 | 0.035 | 0.0357 | 90.0 | `#fdf3d9` |
| notice_text | notice (chrome) | 0.4 | 0.08 | 0.08 | 90.0 | `#584503` |
| notice_border | notice (chrome) | 0.45 | 0.09 | 0.0898 | 90.0 | `#695205` |
| preset_violet_1 | preset ramp violet | 0.62 | 0.06 | 0.0597 | 300.0 | `#8b7ea5` |
| preset_violet_2 | preset ramp violet | 0.55 | 0.06 | 0.0599 | 300.0 | `#776a90` |
| preset_violet_3 | preset ramp violet | 0.48 | 0.06 | 0.0603 | 300.0 | `#63567b` |
| preset_violet_4 | preset ramp violet | 0.41 | 0.06 | 0.0592 | 300.0 | `#4f4366` |
| preset_violet_5 | preset ramp violet | 0.34 | 0.06 | 0.0602 | 300.0 | `#3d3052` |
| preset_clay_1 | preset ramp clay | 0.62 | 0.06 | 0.0602 | 52.0 | `#a47c65` |
| preset_clay_2 | preset ramp clay | 0.55 | 0.06 | 0.0597 | 52.0 | `#8e6851` |
| preset_clay_3 | preset ramp clay | 0.48 | 0.06 | 0.0598 | 52.0 | `#79543e` |
| preset_clay_4 | preset ramp clay | 0.41 | 0.06 | 0.0596 | 52.0 | `#64412b` |
| preset_clay_5 | preset ramp clay | 0.34 | 0.06 | 0.0598 | 52.0 | `#502e19` |

### Chart marks by absolute OKLCH C (most vivid first)

infravana 0.102 > saved 0.092 > option2 0.092 > comparator 0.092 > option3 0.091 > option1 0.091

### WCAG 2.x: 66 gated pairs, 0 failures

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
| text | label inside the comparator bar | `#fcfaf6` | `#591d34` (comparator) | 12.21 | 4.5 | pass |
| text | label inside the infravana bar | `#fcfaf6` | `#006c93` (infravana) | 5.65 | 4.5 | pass |
| text | label inside the saved bar | `#1d1c19` | `#3b927a` (saved) | 4.53 | 4.5 | pass |
| text | notice text on notice fill | `#584503` | `#fdf3d9` (notice_bg) | 8.38 | 4.5 | pass |
| mark | infravana fill on bg | `#006c93` | `#f7f4ef` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on bg | `#3b927a` | `#f7f4ef` (bg) | 3.43 | 3.0 | pass |
| mark | comparator fill on bg | `#591d34` | `#f7f4ef` (bg) | 11.60 | 3.0 | pass |
| mark | option1 fill on bg | `#7c3b37` | `#f7f4ef` (bg) | 7.54 | 3.0 | pass |
| mark | option2 fill on bg | `#995e3a` | `#f7f4ef` (bg) | 4.77 | 3.0 | pass |
| mark | option3 fill on bg | `#ad864a` | `#f7f4ef` (bg) | 3.05 | 3.0 | pass |
| mark | infravana fill on surface | `#006c93` | `#fcfaf6` (surface) | 5.65 | 3.0 | pass |
| mark | saved fill on surface | `#3b927a` | `#fcfaf6` (surface) | 3.61 | 3.0 | pass |
| mark | comparator fill on surface | `#591d34` | `#fcfaf6` (surface) | 12.21 | 3.0 | pass |
| mark | option1 fill on surface | `#7c3b37` | `#fcfaf6` (surface) | 7.94 | 3.0 | pass |
| mark | option2 fill on surface | `#995e3a` | `#fcfaf6` (surface) | 5.02 | 3.0 | pass |
| mark | option3 fill on surface | `#ad864a` | `#fcfaf6` (surface) | 3.20 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005d7f` | `#f7f4ef` (bg) | 6.66 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005d7f` | `#dee6e6` (wash) | 5.77 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005d7f` | `#dcedf6` (soft) | 6.09 | 3.0 | pass |
| mark | chosen tab and primary button | `#004964` | `#f7f4ef` (bg) | 8.96 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#695205` | `#f7f4ef` (bg) | 6.81 | 3.0 | pass |
| mark | notice border on notice fill | `#695205` | `#fdf3d9` (notice_bg) | 6.76 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on bg | `#8b7ea5` | `#f7f4ef` (bg) | 3.40 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on surface | `#8b7ea5` | `#fcfaf6` (surface) | 3.58 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on bg | `#776a90` | `#f7f4ef` (bg) | 4.51 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on surface | `#776a90` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on bg | `#63567b` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on surface | `#63567b` | `#fcfaf6` (surface) | 6.40 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on bg | `#4f4366` | `#f7f4ef` (bg) | 8.23 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on surface | `#4f4366` | `#fcfaf6` (surface) | 8.66 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on bg | `#3d3052` | `#f7f4ef` (bg) | 10.98 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on surface | `#3d3052` | `#fcfaf6` (surface) | 11.56 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on bg | `#a47c65` | `#f7f4ef` (bg) | 3.39 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on surface | `#a47c65` | `#fcfaf6` (surface) | 3.57 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on bg | `#8e6851` | `#f7f4ef` (bg) | 4.50 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on surface | `#8e6851` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on bg | `#79543e` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on surface | `#79543e` | `#fcfaf6` (surface) | 6.39 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on bg | `#64412b` | `#f7f4ef` (bg) | 8.21 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on surface | `#64412b` | `#fcfaf6` (surface) | 8.63 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on bg | `#502e19` | `#f7f4ef` (bg) | 10.96 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on surface | `#502e19` | `#fcfaf6` (surface) | 11.54 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#888682` | `#f7f4ef` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#3b927a` | `#ece9e2` (surface_muted) | 3.10 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#ad864a` | `#ece9e2` (surface_muted) | 2.76 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#591d34` | `#ece9e2` (surface_muted) | 10.50 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 44.9 [44.9] | 26.0 [22.7] | 24.3 [23.4] | 56.4 [50.8] |
| comparator / saved | 58.2 [58.2] | 26.2 [25.6] | 36.5 [37.3] | 58.5 [57.1] |
| comparator / option1 | 14.1 [14.1] | 14.5 [17.3] | 17.6 [18.1] | 9.4 [9.8] **<10** |
| comparator / option2 | 30.0 [30.0] | 26.2 [30.3] | 31.0 [33.0] | 19.9 [20.3] |
| comparator / option3 | 45.7 [45.7] | 37.7 [42.3] | 42.9 [45.3] | 32.7 [32.2] |
| infravana / saved | 28.0 [28.0] | 25.0 [24.4] | 28.2 [29.3] | 11.4 [10.4] |
| infravana / option1 | 42.2 [42.2] | 35.0 [35.8] | 29.7 [28.6] | 48.1 [49.7] |
| infravana / option2 | 40.6 [40.6] | 41.4 [45.1] | 36.0 [36.9] | 45.8 [48.2] |
| infravana / option3 | 45.0 [45.0] | 47.1 [52.6] | 41.4 [43.2] | 44.3 [46.0] |
| saved / option1 | 50.6 [50.6] | 20.3 [21.1] | 25.4 [25.2] | 55.8 [54.8] |
| saved / option2 | 40.6 [40.6] | 17.8 [21.4] | 17.6 [17.6] | 51.2 [51.2] |
| saved / option3 | 32.0 [32.0] | 19.5 [25.0] | 13.7 [14.3] | 45.6 [46.0] |
| option1 / option2 | 16.1 [16.1] | 12.6 [14.2] | 14.0 [15.1] | 10.9 [10.8] |
| option1 / option3 | 32.7 [32.7] | 25.2 [27.8] | 27.6 [29.1] | 24.4 [23.4] |
| option2 / option3 | 16.6 [16.6] | 11.9 [13.2] | 14.4 [15.1] | 13.1 [12.0] |

Smallest: normal 14.1 [14.1], deuteranopia 11.9 [13.2], protanopia 13.7 [14.3], tritanopia 9.4 [9.8]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#591d34` | `#333333` | 0.0325 |  |
| option1 | `#7c3b37` | `#4e4e4e` | 0.0769 | 1.54 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.41 |
| option2 | `#995e3a` | `#6c6c6c` | 0.1508 | 1.13 |
| saved | `#3b927a` | `#848484` | 0.2289 | 1.39 |
| option3 | `#ad864a` | `#8c8c8c` | 0.2643 | 1.13 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | option2 | 7.2 |
| notice_border | option2 | 18.0 |
| notice_text | option2 | 20.4 |
| preset_violet_1 | infravana | 28.1 |
| preset_violet_2 | infravana | 25.7 |
| preset_violet_3 | comparator | 21.2 |
| preset_violet_4 | comparator | 17.5 |
| preset_violet_5 | comparator | 15.5 |
| preset_clay_1 | option2 | 11.4 |
| preset_clay_2 | option2 | 6.4 |
| preset_clay_3 | option2 | 8.5 |
| preset_clay_4 | option1 | 11.5 |
| preset_clay_5 | option1 | 13.5 |

### Distance from 12A, role by role (CIEDE2000)

comparator 3.2 · infravana 2.8 · saved 5.2 · option1 7.5 · option2 9.3 · option3 7.4 · bg 0.5

**Gate failures: 3**: dE tritanopia comparator/option1 9.4; dE tritanopia_gamma comparator/option1 9.8; section 7.2 from option2

## R-triad: rejected: Triad 232/352/112 (Today around 352, saving at 112)

### Chart marks by absolute OKLCH C (most vivid first)

option3 0.171 > option2 0.168 > option1 0.143 > comparator 0.119 > saved 0.113 > infravana 0.102

### WCAG 2.x: 66 gated pairs, 1 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 4.5 | pass |
| text | body text | `#1d1c19` | `#fcfaf6` (surface) | 16.35 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#fcfaf6` (surface) | 6.52 | 4.5 | pass |
| text | body text | `#1d1c19` | `#ece9e2` (surface_muted) | 14.05 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#ece9e2` (surface_muted) | 5.61 | 4.5 | pass |
| text | body text | `#1d1c19` | `#dfebf8` (soft) | 14.10 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#dfebf8` (soft) | 5.63 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#f7f4ef` (bg) | 6.80 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#fcfaf6` (surface) | 7.15 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#dfebf8` (soft) | 6.17 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#f7f4ef` (bg) | 6.56 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#fcfaf6` (surface) | 6.90 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005798` | `#dee6e6` (wash) | 5.88 | 4.5 | pass |
| text | label on primary button | `#fcfaf6` | `#004479` (infravana_deep) | 9.58 | 4.5 | pass |
| text | label on hovered primary button | `#fcfaf6` | `#002f56` (infravana_hover) | 13.07 | 4.5 | pass |
| text | label inside the comparator bar | `#fcfaf6` | `#611d53` (comparator) | 11.14 | 4.5 | pass |
| text | label inside the infravana bar | `#fcfaf6` | `#006c93` (infravana) | 5.65 | 4.5 | pass |
| text | label inside the saved bar | `#1d1c19` | `#82862b` (saved) | 4.38 | 4.5 | FAIL |
| text | notice text on notice fill | `#584503` | `#fdf3d9` (notice_bg) | 8.38 | 4.5 | pass |
| mark | infravana fill on bg | `#006c93` | `#f7f4ef` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on bg | `#82862b` | `#f7f4ef` (bg) | 3.55 | 3.0 | pass |
| mark | comparator fill on bg | `#611d53` | `#f7f4ef` (bg) | 10.58 | 3.0 | pass |
| mark | option1 fill on bg | `#902d60` | `#f7f4ef` (bg) | 7.01 | 3.0 | pass |
| mark | option2 fill on bg | `#c13e63` | `#f7f4ef` (bg) | 4.63 | 3.0 | pass |
| mark | option3 fill on bg | `#e85f61` | `#f7f4ef` (bg) | 3.07 | 3.0 | pass |
| mark | infravana fill on surface | `#006c93` | `#fcfaf6` (surface) | 5.65 | 3.0 | pass |
| mark | saved fill on surface | `#82862b` | `#fcfaf6` (surface) | 3.73 | 3.0 | pass |
| mark | comparator fill on surface | `#611d53` | `#fcfaf6` (surface) | 11.14 | 3.0 | pass |
| mark | option1 fill on surface | `#902d60` | `#fcfaf6` (surface) | 7.38 | 3.0 | pass |
| mark | option2 fill on surface | `#c13e63` | `#fcfaf6` (surface) | 4.87 | 3.0 | pass |
| mark | option3 fill on surface | `#e85f61` | `#fcfaf6` (surface) | 3.23 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005798` | `#f7f4ef` (bg) | 6.80 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005798` | `#dee6e6` (wash) | 5.88 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005798` | `#dfebf8` (soft) | 6.17 | 3.0 | pass |
| mark | chosen tab and primary button | `#004479` | `#f7f4ef` (bg) | 9.10 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#695205` | `#f7f4ef` (bg) | 6.81 | 3.0 | pass |
| mark | notice border on notice fill | `#695205` | `#fdf3d9` (notice_bg) | 6.76 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on bg | `#8b7ea5` | `#f7f4ef` (bg) | 3.40 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on surface | `#8b7ea5` | `#fcfaf6` (surface) | 3.58 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on bg | `#776a90` | `#f7f4ef` (bg) | 4.51 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on surface | `#776a90` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on bg | `#63567b` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on surface | `#63567b` | `#fcfaf6` (surface) | 6.40 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on bg | `#4f4366` | `#f7f4ef` (bg) | 8.23 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on surface | `#4f4366` | `#fcfaf6` (surface) | 8.66 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on bg | `#3d3052` | `#f7f4ef` (bg) | 10.98 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on surface | `#3d3052` | `#fcfaf6` (surface) | 11.56 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on bg | `#a47c65` | `#f7f4ef` (bg) | 3.39 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on surface | `#a47c65` | `#fcfaf6` (surface) | 3.57 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on bg | `#8e6851` | `#f7f4ef` (bg) | 4.50 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on surface | `#8e6851` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on bg | `#79543e` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on surface | `#79543e` | `#fcfaf6` (surface) | 6.39 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on bg | `#64412b` | `#f7f4ef` (bg) | 8.21 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on surface | `#64412b` | `#fcfaf6` (surface) | 8.63 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on bg | `#502e19` | `#f7f4ef` (bg) | 10.96 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on surface | `#502e19` | `#fcfaf6` (surface) | 11.54 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#888682` | `#f7f4ef` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#82862b` | `#ece9e2` (surface_muted) | 3.21 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#e85f61` | `#ece9e2` (surface_muted) | 2.78 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#611d53` | `#ece9e2` (surface_muted) | 9.57 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 41.9 [41.9] | 14.8 [13.3] | 19.6 [19.4] | 53.8 [51.2] |
| comparator / saved | 61.1 [61.1] | 43.7 [48.8] | 51.4 [54.0] | 32.9 [30.1] |
| comparator / option1 | 10.9 [10.9] | 13.2 [9.3] **<10** | 8.1 [6.2] **<10** | 11.1 [11.8] |
| comparator / option2 | 23.5 [23.5] | 31.5 [23.7] | 19.4 [15.0] | 22.2 [24.7] |
| comparator / option3 | 37.9 [37.9] | 46.7 [43.0] | 38.8 [35.8] | 33.4 [34.9] |
| infravana / saved | 47.5 [47.5] | 47.1 [52.7] | 44.8 [45.8] | 28.4 [32.2] |
| infravana / option1 | 45.8 [45.8] | 16.4 [13.0] | 13.4 [13.9] | 57.1 [53.2] |
| infravana / option2 | 49.9 [49.9] | 33.2 [25.6] | 14.1 [11.4] | 61.6 [56.5] |
| infravana / option3 | 52.1 [52.1] | 46.3 [44.6] | 30.5 [27.3] | 57.4 [58.4] |
| saved / option1 | 57.6 [57.6] | 30.3 [39.8] | 43.8 [48.5] | 29.1 [25.1] |
| saved / option2 | 53.2 [53.2] | 13.7 [24.2] | 31.2 [38.7] | 27.1 [23.5] |
| saved / option3 | 46.9 [46.9] | 8.7 [9.7] **<10** | 14.7 [19.0] | 27.2 [24.8] |
| option1 / option2 | 12.9 [12.9] | 17.9 [14.8] | 11.6 [9.2] **<10** | 11.4 [13.2] |
| option1 / option3 | 28.0 [28.0] | 32.7 [33.8] | 31.1 [30.3] | 23.2 [23.8] |
| option2 / option3 | 15.0 [15.0] | 14.1 [18.3] | 18.9 [20.7] | 11.5 [9.6] **<10** |

Smallest: normal 10.9 [10.9], deuteranopia 8.7 [9.3], protanopia 8.1 [6.2], tritanopia 11.1 [9.6]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#611d53` | `#393939` | 0.0404 |  |
| option1 | `#902d60` | `#535353` | 0.0865 | 1.51 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.31 |
| option2 | `#c13e63` | `#6e6e6e` | 0.1568 | 1.16 |
| saved | `#82862b` | `#818181` | 0.2197 | 1.3 |
| option3 | `#e85f61` | `#8c8c8c` | 0.262 | 1.16 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | option2 | 24.1 |
| notice_border | saved | 20.1 |
| notice_text | saved | 23.9 |
| preset_violet_1 | option2 | 25.4 |
| preset_violet_2 | option1 | 21.1 |
| preset_violet_3 | comparator | 17.6 |
| preset_violet_4 | comparator | 14.0 |
| preset_violet_5 | comparator | 12.4 |
| preset_clay_1 | option3 | 18.8 |
| preset_clay_2 | option3 | 21.8 |
| preset_clay_3 | option2 | 24.1 |
| preset_clay_4 | option1 | 26.5 |
| preset_clay_5 | option1 | 27.8 |

### Distance from 12A, role by role (CIEDE2000)

comparator 8.1 · infravana 2.8 · saved 22.8 · option1 21.9 · option2 26.9 · option3 33.4 · bg 0.5

**Gate failures: 9**: WCAG label inside the saved bar 4.38; dE deuteranopia_gamma comparator/option1 9.3; dE protanopia comparator/option1 8.1; dE protanopia_gamma comparator/option1 6.2; dE deuteranopia saved/option3 8.7; dE deuteranopia_gamma saved/option3 9.7; dE protanopia_gamma option1/option2 9.2; dE tritanopia_gamma option2/option3 9.6; InfraVana not the most vivid: (0.171, 'option3')

## R-analogous: rejected: Analogous Today (172 to 292) with a gold saving

### Chart marks by absolute OKLCH C (most vivid first)

infravana 0.102 > saved 0.1 > option3 0.09 > option1 0.09 > option2 0.087 > comparator 0.074

### WCAG 2.x: 66 gated pairs, 1 failures

| kind | pair | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
| text | body text | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 4.5 | pass |
| text | body text | `#1d1c19` | `#fcfaf6` (surface) | 16.35 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#fcfaf6` (surface) | 6.52 | 4.5 | pass |
| text | body text | `#1d1c19` | `#ece9e2` (surface_muted) | 14.05 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#ece9e2` (surface_muted) | 5.61 | 4.5 | pass |
| text | body text | `#1d1c19` | `#dfebf8` (soft) | 14.10 | 4.5 | pass |
| text | secondary text | `#5c5b57` | `#dfebf8` (soft) | 5.63 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#f7f4ef` (bg) | 6.80 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#fcfaf6` (surface) | 7.15 | 4.5 | pass |
| text | InfraVana text, links of the brand | `#005798` | `#dfebf8` (soft) | 6.17 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#f7f4ef` (bg) | 6.56 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 4.5 | pass |
| text | saving figure | `#1e6250` | `#fcfaf6` (surface) | 6.90 | 4.5 | pass |
| text | section label (step, kicker) | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 4.5 | pass |
| text | C10 'With InfraVana' label on the wash | `#005798` | `#dee6e6` (wash) | 5.88 | 4.5 | pass |
| text | label on primary button | `#fcfaf6` | `#004479` (infravana_deep) | 9.58 | 4.5 | pass |
| text | label on hovered primary button | `#fcfaf6` | `#002f56` (infravana_hover) | 13.07 | 4.5 | pass |
| text | label inside the comparator bar | `#fcfaf6` | `#004f3e` (comparator) | 9.21 | 4.5 | pass |
| text | label inside the infravana bar | `#fcfaf6` | `#006c93` (infravana) | 5.65 | 4.5 | pass |
| text | label inside the saved bar | `#1d1c19` | `#b88848` (saved) | 5.40 | 4.5 | pass |
| text | notice text on notice fill | `#584503` | `#fdf3d9` (notice_bg) | 8.38 | 4.5 | pass |
| mark | infravana fill on bg | `#006c93` | `#f7f4ef` (bg) | 5.37 | 3.0 | pass |
| mark | saved fill on bg | `#b88848` | `#f7f4ef` (bg) | 2.88 | 3.0 | FAIL |
| mark | comparator fill on bg | `#004f3e` | `#f7f4ef` (bg) | 8.75 | 3.0 | pass |
| mark | option1 fill on bg | `#484e85` | `#f7f4ef` (bg) | 7.08 | 3.0 | pass |
| mark | option2 fill on bg | `#00747b` | `#f7f4ef` (bg) | 5.06 | 3.0 | pass |
| mark | option3 fill on bg | `#7a6faa` | `#f7f4ef` (bg) | 4.09 | 3.0 | pass |
| mark | infravana fill on surface | `#006c93` | `#fcfaf6` (surface) | 5.65 | 3.0 | pass |
| mark | saved fill on surface | `#b88848` | `#fcfaf6` (surface) | 3.03 | 3.0 | pass |
| mark | comparator fill on surface | `#004f3e` | `#fcfaf6` (surface) | 9.21 | 3.0 | pass |
| mark | option1 fill on surface | `#484e85` | `#fcfaf6` (surface) | 7.45 | 3.0 | pass |
| mark | option2 fill on surface | `#00747b` | `#fcfaf6` (surface) | 5.32 | 3.0 | pass |
| mark | option3 fill on surface | `#7a6faa` | `#fcfaf6` (surface) | 4.30 | 3.0 | pass |
| mark | InfraVana frontier line and points | `#005798` | `#f7f4ef` (bg) | 6.80 | 3.0 | pass |
| mark | C10 frontier line on the wash | `#005798` | `#dee6e6` (wash) | 5.88 | 3.0 | pass |
| mark | budget line | `#5c5b57` | `#f7f4ef` (bg) | 6.20 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#f7f4ef` (bg) | 3.31 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#f7f4ef` (bg) | 5.55 | 3.0 | pass |
| mark | input, chip and axis border | `#89867e` | `#fcfaf6` (surface) | 3.49 | 3.0 | pass |
| mark | section rule | `#7f5a43` | `#fcfaf6` (surface) | 5.85 | 3.0 | pass |
| mark | selected-row edge | `#005798` | `#dfebf8` (soft) | 6.17 | 3.0 | pass |
| mark | chosen tab and primary button | `#004479` | `#f7f4ef` (bg) | 9.10 | 3.0 | pass |
| mark | focus ring | `#1d1c19` | `#f7f4ef` (bg) | 15.53 | 3.0 | pass |
| mark | notice border on paper | `#695205` | `#f7f4ef` (bg) | 6.81 | 3.0 | pass |
| mark | notice border on notice fill | `#695205` | `#fdf3d9` (notice_bg) | 6.76 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on bg | `#8b7ea5` | `#f7f4ef` (bg) | 3.40 | 3.0 | pass |
| mark | preset violet 1 tick and button edge on surface | `#8b7ea5` | `#fcfaf6` (surface) | 3.58 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on bg | `#776a90` | `#f7f4ef` (bg) | 4.51 | 3.0 | pass |
| mark | preset violet 2 tick and button edge on surface | `#776a90` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on bg | `#63567b` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset violet 3 tick and button edge on surface | `#63567b` | `#fcfaf6` (surface) | 6.40 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on bg | `#4f4366` | `#f7f4ef` (bg) | 8.23 | 3.0 | pass |
| mark | preset violet 4 tick and button edge on surface | `#4f4366` | `#fcfaf6` (surface) | 8.66 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on bg | `#3d3052` | `#f7f4ef` (bg) | 10.98 | 3.0 | pass |
| mark | preset violet 5 tick and button edge on surface | `#3d3052` | `#fcfaf6` (surface) | 11.56 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on bg | `#a47c65` | `#f7f4ef` (bg) | 3.39 | 3.0 | pass |
| mark | preset clay 1 tick and button edge on surface | `#a47c65` | `#fcfaf6` (surface) | 3.57 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on bg | `#8e6851` | `#f7f4ef` (bg) | 4.50 | 3.0 | pass |
| mark | preset clay 2 tick and button edge on surface | `#8e6851` | `#fcfaf6` (surface) | 4.74 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on bg | `#79543e` | `#f7f4ef` (bg) | 6.08 | 3.0 | pass |
| mark | preset clay 3 tick and button edge on surface | `#79543e` | `#fcfaf6` (surface) | 6.39 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on bg | `#64412b` | `#f7f4ef` (bg) | 8.21 | 3.0 | pass |
| mark | preset clay 4 tick and button edge on surface | `#64412b` | `#fcfaf6` (surface) | 8.63 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on bg | `#502e19` | `#f7f4ef` (bg) | 10.96 | 3.0 | pass |
| mark | preset clay 5 tick and button edge on surface | `#502e19` | `#fcfaf6` (surface) | 11.54 | 3.0 | pass |
| restricted | disabled text (only on :disabled controls) | `#888682` | `#f7f4ef` (bg) | 3.31 | - | reported |
| restricted | saved fill on surface_muted (charts never sit on it) | `#b88848` | `#ece9e2` (surface_muted) | 2.60 | - | reported |
| restricted | option3 fill on surface_muted (charts never sit on it) | `#7a6faa` | `#ece9e2` (surface_muted) | 3.70 | - | reported |
| restricted | comparator fill on surface_muted (charts never sit on it) | `#004f3e` | `#ece9e2` (surface_muted) | 7.92 | - | reported |

### CIEDE2000 between every two chart fills (gate 10); linear-sRGB Machado [gamma-sRGB Machado]

| fills | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| comparator / infravana | 26.1 [26.1] | 23.4 [19.7] | 27.4 [26.3] | 13.4 [13.7] |
| comparator / saved | 43.6 [43.6] | 37.8 [43.3] | 29.3 [31.0] | 51.5 [53.1] |
| comparator / option1 | 31.6 [31.6] | 22.2 [17.3] | 27.3 [25.5] | 11.8 [14.4] |
| comparator / option2 | 16.8 [16.8] | 17.7 [15.8] | 19.8 [19.5] | 13.8 [14.6] |
| comparator / option3 | 37.2 [37.2] | 27.9 [26.4] | 31.8 [30.9] | 25.9 [26.7] |
| infravana / saved | 46.5 [46.5] | 49.2 [54.3] | 42.6 [44.3] | 46.2 [48.4] |
| infravana / option1 | 18.7 [18.7] | 5.3 [2.9] **<10** | 8.4 [6.0] **<10** | 13.0 [17.0] |
| infravana / option2 | 13.1 [13.1] | 8.3 [5.6] **<10** | 9.9 [8.5] **<10** | 2.8 [2.5] **<10** |
| infravana / option3 | 22.8 [22.8] | 8.8 [13.6] **<10** | 5.7 [7.2] **<10** | 19.7 [22.0] |
| saved / option1 | 48.6 [48.6] | 52.7 [51.6] | 48.3 [48.0] | 45.9 [43.7] |
| saved / option2 | 39.9 [39.9] | 39.8 [47.7] | 31.9 [35.1] | 47.2 [49.2] |
| saved / option3 | 43.1 [43.1] | 45.0 [44.4] | 43.9 [43.6] | 28.5 [27.4] |
| option1 / option2 | 27.0 [27.0] | 11.1 [3.2] **<10** | 15.4 [11.6] | 15.0 [18.8] |
| option1 / option3 | 14.2 [14.2] | 14.1 [14.0] | 13.2 [13.1] | 16.8 [16.2] |
| option2 / option3 | 28.8 [28.8] | 10.4 [12.8] | 12.8 [11.4] | 20.7 [22.7] |

Smallest: normal 13.1 [13.1], deuteranopia 5.3 [2.9], protanopia 5.7 [6.0], tritanopia 2.8 [2.5]

### Greyscale ladder (relative luminance, dark to light)

| role | hex | grey | Y | contrast to the step below |
|---|---|---|---|---|
| comparator | `#004f3e` | `#454545` | 0.0594 |  |
| option1 | `#484e85` | `#525252` | 0.0852 | 1.24 |
| infravana | `#006c93` | `#646464` | 0.1283 | 1.32 |
| option2 | `#00747b` | `#686868` | 0.1392 | 1.06 |
| option3 | `#7a6faa` | `#777777` | 0.1841 | 1.24 |
| saved | `#b88848` | `#919191` | 0.2827 | 1.42 |

### Chrome colours against the nearest chart fill (CIEDE2000, gate 10; clay presets reported)

| chrome | nearest fill | CIEDE2000 |
|---|---|---|
| section | saved | 21.4 |
| notice_border | saved | 24.7 |
| notice_text | comparator | 27.0 |
| preset_violet_1 | option3 | 7.7 |
| preset_violet_2 | option3 | 6.4 |
| preset_violet_3 | option1 | 9.0 |
| preset_violet_4 | option1 | 9.0 |
| preset_violet_5 | option1 | 12.9 |
| preset_clay_1 | saved | 12.0 |
| preset_clay_2 | saved | 16.5 |
| preset_clay_3 | saved | 23.7 |
| preset_clay_4 | saved | 29.8 |
| preset_clay_5 | option1 | 32.9 |

### Distance from 12A, role by role (CIEDE2000)

comparator 48.4 · infravana 2.8 · saved 35.5 · option1 34.8 · option2 45.5 · option3 48.6 · bg 0.5

**Gate failures: 19**: WCAG saved fill on bg 2.88; dE deuteranopia infravana/option1 5.3; dE deuteranopia_gamma infravana/option1 2.9; dE protanopia infravana/option1 8.4; dE protanopia_gamma infravana/option1 6.0; dE deuteranopia infravana/option2 8.3; dE deuteranopia_gamma infravana/option2 5.6; dE protanopia infravana/option2 9.9; dE protanopia_gamma infravana/option2 8.5; dE tritanopia infravana/option2 2.8; dE tritanopia_gamma infravana/option2 2.5; dE deuteranopia infravana/option3 8.8; dE protanopia infravana/option3 5.7; dE protanopia_gamma infravana/option3 7.2; dE deuteranopia_gamma option1/option2 3.2; preset_violet_1 7.7 from option3; preset_violet_2 6.4 from option3; preset_violet_3 9.0 from option1; preset_violet_4 9.0 from option1
