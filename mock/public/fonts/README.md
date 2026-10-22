# Fonts

Self-hosted so the page makes no request to a third-party origin (spec 14.2, BD-16).
Declared in `src/styles/fonts.css` and preloaded from `index.html`.

| Family | Use | Files | Licence |
|---|---|---|---|
| Newsreader | Headings, figure titles, estimate and hero figures (weight 500) | `newsreader/newsreader-latin-wght-normal.woff2`, `newsreader/newsreader-latin-wght-italic.woff2` | SIL Open Font License 1.1: `newsreader/OFL.txt` |
| Hanken Grotesk | Body and UI | `hanken-grotesk/hanken-grotesk-latin-wght-normal.woff2`, `hanken-grotesk/hanken-grotesk-latin-wght-italic.woff2` | SIL Open Font License 1.1: `hanken-grotesk/OFL.txt` |

- Source: the `@fontsource-variable/newsreader` and `@fontsource-variable/hanken-grotesk` npm packages, version 5.3.0 (their `files/` folders and `LICENSE` files, copied unmodified; the licence file is the package's, renamed `OFL.txt`). The packages are not dependencies of the mock.
- Each file is the Latin subset of the variable build (weight axis only): one file per style covers every weight.
- Characters outside the Latin subset (for example arrows and mathematical signs) fall back to Georgia or Arial.
- The licence terms are still to be checked before go-live (spec 12.4).
- To update: fetch a newer version of the same two packages (`npm pack`), replace the four files and the two licence files, and note the version here.
