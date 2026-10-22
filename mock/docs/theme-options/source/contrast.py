# Written for the scratch copy of the app; adjust the paths (arguments, Chrome location, theme folder) before reuse.
import sys, re, glob, os, colorsys
def lin(c):
    c/=255; return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def rgb(h):
    h=h.lstrip('#'); h=''.join(ch*2 for ch in h) if len(h)==3 else h
    return tuple(int(h[i:i+2],16) for i in (0,2,4))
def L(h):
    r,g,b=rgb(h); return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def cr(a,b):
    la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def hue(h):
    r,g,b=[v/255 for v in rgb(h)]; hh,ll,ss=colorsys.rgb_to_hls(r,g,b); return round(hh*360), round(ss*100)
base=open(sys.argv[1]).read()
def toks(text, sel):
    m=re.search(re.escape(sel)+r'\s*\{(.*?)\n\}', text, re.S)
    return dict(re.findall(r'(--[\w-]+):\s*(#[0-9a-fA-F]{3,6})\b', m.group(1))) if m else {}
B=toks(base, ':root')
ground={'d1':'bg','d5':'bg'}   # cards are transparent in these
special_btn={'d2':('#0f1214','--color-accent-deep'),'d5':('bg','--color-text'),'d3':('surface','--color-accent')}
allfail=0
for f in sorted(glob.glob(sys.argv[2]+'/d*.css')):
    t=os.path.basename(f)[:2]; text=open(f).read()
    k=dict(B); k.update(toks(text, f':root[data-theme="{t}"]'))
    g=k['--color-'+ground.get(t,'surface')]
    def v(x): return k[x] if x in k else x
    rows=[]
    def chk(name,a,b,thr): 
        r=cr(v(a),v(b)); rows.append((name,v(a),v(b),r,thr))
    chk('body text on page','--color-text','--color-bg',4.5)
    chk('body text on card','--color-text','--color-surface',4.5)
    chk('secondary text on page','--color-text-secondary','--color-bg',4.5)
    chk('secondary text on card','--color-text-secondary','--color-surface',4.5)
    chk('secondary text on muted panel','--color-text-secondary','--color-surface-muted',4.5)
    chk('accent-strong text on card','--color-accent-strong','--color-surface',4.5)
    chk('accent-strong text on chart ground','--color-accent-strong',g,4.5)
    chk('blank / selected text on accent-soft','--color-accent-strong','--color-accent-soft',4.5)
    chk('body text on accent-soft (selected card)','--color-text','--color-accent-soft',4.5)
    bt,bb=special_btn.get(t,('--color-surface','--color-accent-deep'))
    bt = '--color-'+bt if bt in ('bg','surface','text') else bt
    bb = '--color-'+bb if not bb.startswith('#') and not bb.startswith('--') else bb
    chk('primary button label','#0f1214' if t=='d2' else bt, bb,4.5)
    chk('segmented checked label','--color-surface','--color-accent-strong',4.5)
    chk('chart label on today-1 fill','--color-surface','--color-today-1',4.5)
    chk('chart label on today-3 fill','--color-surface','--color-today-3',4.5)
    chk('chart label on accent fill','--color-surface','--color-accent',4.5)
    chk('chart label on accent-strong fill','--color-surface','--color-accent-strong',4.5)
    chk('chart label on saved fill','--color-text','--color-saved',4.5)
    chk('hero saving figure (positive) on hero ground','--color-positive', g if t in ('d1','d5') else '--color-surface',3.0)
    chk('positive text on card (estimate)','--color-positive','--color-surface',4.5)
    chk('axis tick (secondary) on chart ground','--color-text-secondary',g,4.5)
    chk('mark today-1 on chart ground','--color-today-1',g,3.0)
    chk('mark today-2 on chart ground','--color-today-2',g,3.0)
    chk('mark today-3 on chart ground','--color-today-3',g,3.0)
    chk('mark accent on chart ground','--color-accent',g,3.0)
    chk('mark accent-strong on chart ground','--color-accent-strong',g,3.0)
    chk('saved outline (positive) on chart ground','--color-positive',g,3.0)
    chk('budget line (text) on chart ground','--color-text',g,3.0)
    chk('border-strong (inputs, chips) on card','--color-border-strong','--color-surface',3.0)
    chk('border-strong on page','--color-border-strong','--color-bg',3.0)
    chk('notice text on notice bg','--color-notice-text','--color-notice-bg',4.5)
    chk('notice border on page','--color-notice-border','--color-bg',3.0)
    chk('focus ring on page','--color-text','--color-bg',3.0)
    print(f'\n### {t}  (chart ground {g})')
    print('| Pair | Fg | Bg | Ratio | Needs | Result |\n|---|---|---|---|---|---|')
    for n,a,b,r,thr in rows:
        ok=r>=thr; allfail+= (not ok)
        print(f'| {n} | {a} | {b} | {r:.2f} | {thr} | {"PASS" if ok else "FAIL"} |')
    a=v('--color-accent'); print(f'Accent {a} hue/sat {hue(a)}; vs greys: ' + ', '.join(f'{x} {v(x)} {cr(a,v(x)):.2f}:1 (sat {hue(v(x))[1]}%)' for x in ('--color-today-1','--color-today-2','--color-today-3')))
print('\nTOTAL FAILS', allfail)
