"""Tres identidades, tres caminos. Ninguna es texto puesto al lado de un icono."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fontlab as F
from pathutil import bbox

INK, PAPER, LIME, OLIVE, MUTED = '#17231c', '#edf0e7', '#dcf89c', '#526f3c', '#7d8c72'

def svg(w, h, body, vb=None):
    vb = vb or f'0 0 {w:.2f} {h:.2f}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'

def grown_top(path, k):
    """Extremo superior de un contorno después de agrandarlo sobre su base."""
    x0, y0, x1, y1 = bbox(path)
    return y1 - (y1 - y0) * k

def grow(path, k, anchor='bottom'):
    """Agranda un contorno sobre su propia base, sin moverlo de sitio."""
    x0, y0, x1, y1 = bbox(path)
    cx = (x0 + x1) / 2
    cy = y1 if anchor == 'bottom' else (y0 + y1) / 2
    return (f'<g transform="translate({cx:.2f} {cy:.2f}) scale({k}) '
            f'translate({-cx:.2f} {-cy:.2f})"><path d="{path}"/></g>')

# ══ 1 · PLACA — el nombre completo, justificado con el eje de anchura ═══════
PLACA_LINES = ('DAVID', 'ESTÉVEZ', 'MARTÍNEZ')

def placa(size=100, target=4.10, ink=INK, accent=OLIVE, wght=600, lead=None,
          lines=PLACA_LINES, rules=False):
    """Cada línea se estira por su eje de anchura hasta medir exactamente lo mismo.
    No es texto deformado: es el eje que la fuente trae diseñado."""
    W = target * size
    cap = F.metrics('anybody')['cap'] * size
    # el interlineado lo manda la tilde: tiene que caber entre dos líneas
    _, probe, _ = F.set_text('É', 'anybody', size, 0, wdth=100, wght=wght)
    acc_rise = -min(bbox(a)[1] for a in probe) if probe else 0
    lead = lead if lead is not None else 1 + (acc_rise - cap + size * .085) / cap

    rows, y, top = [], 0.0, None
    for ln in lines:
        wd = F.fit_width(ln, W, 'anybody', size, (78, 148), wght=wght)
        body, accs, adv = F.set_text(ln, 'anybody', size, 0, wdth=wd, wght=wght)
        if abs(W - adv) > .5 and len(ln) > 1:
            tr = (W - adv) / (len(ln) - 1) / size
            body, accs, adv = F.set_text(ln, 'anybody', size, tr, wdth=wd, wght=wght)
        y += cap
        if accs:
            t = y + min(bbox(a)[1] for a in accs)
            top = t if top is None else min(top, t)
        top = 0.0 if top is None else min(top, y - cap)
        rows.append(f'<g transform="translate(0 {y:.2f})"><path d="{body}" fill="{ink}"/>'
                    + (f'<g fill="{accent}">' + ''.join(f'<path d="{a}"/>' for a in accs) + '</g>' if accs else '')
                    + '</g>')
        y += cap * (lead - 1)
    bottom = y - cap * (lead - 1)
    if rules:
        r = max(.8, size * .022)
        pad = size * .30
        rl = (f'<rect x="0" y="{top - pad - r:.2f}" width="{W:.2f}" height="{r:.2f}" fill="{ink}"/>'
              f'<rect x="0" y="{bottom + pad:.2f}" width="{W:.2f}" height="{r:.2f}" fill="{ink}"/>')
        t0, h = top - pad - r, (bottom + pad + r) - (top - pad - r)
        return svg(W, h, rl + ''.join(rows), f'0 {t0:.2f} {W:.2f} {h:.2f}')
    return svg(W, bottom - top, ''.join(rows), f'0 {top:.2f} {W:.2f} {bottom - top:.2f}')

def placa_icono(box=64, tile=True, ink=INK, fg=PAPER, radius=None, letter='E'):
    """La lógica de la placa aplicada a una letra: estirada hasta llenar el cuadro.
    Una E cuadrada es rara de ver, y a 16 px sigue siendo una E."""
    radius = box * .18 if radius is None else radius
    pad = box * .21
    inner = box - 2 * pad
    size = inner / F.metrics('anybody')['cap']
    wd = F.fit_width(letter, inner, 'anybody', size, (78, 220), wght=700)
    body, _, adv = F.set_text(letter, 'anybody', size, 0, wdth=wd, wght=700)
    x0, y0, x1, y1 = bbox(body)
    bg = f'<rect width="{box}" height="{box}" rx="{radius:.2f}" fill="{ink}"/>' if tile else ''
    return svg(box, box, bg + f'<g transform="translate({pad - x0:.2f} {pad - y0:.2f})">'
                              f'<path d="{body}" fill="{fg}"/></g>')

# ══ 2 · ÉM — las iniciales del dominio, con la tilde ════════════════════════
def em(size=100, ink=INK, accent=LIME, wght=780, wdth=96, kern=-.055, boost=1.9):
    """E y M fundidas: el trazo vertical se comparte. El acento, encima de la E."""
    body, accs, adv = F.set_text('ÉM', 'anybody', size, kern, wdth=wdth, wght=wght)
    x0, y0, x1, y1 = bbox(body)
    top = min([y0] + [grown_top(a, boost) for a in accs])
    left = min([x0] + [bbox(a)[0] for a in accs])
    right = max([x1] + [bbox(a)[2] for a in accs])
    acc = ''.join(grow(a, boost) for a in accs)
    return svg(right - left, y1 - top,
               f'<g transform="translate({-left:.2f} {-top:.2f})">'
               f'<path d="{body}" fill="{ink}"/><g fill="{accent}">{acc}</g></g>')

def em_icono(box=64, tile=True, ink=INK, fg=PAPER, accent=LIME, radius=None):
    radius = box * .18 if radius is None else radius
    pad = box * .19
    inner = box - 2 * pad
    inner_svg = em(100, fg, accent)
    vb = inner_svg.split('viewBox="')[1].split('"')[0].split()
    w, h = float(vb[2]), float(vb[3])
    s = min(inner / w, inner / h)
    guts = inner_svg.split('>', 1)[1].rsplit('</svg>', 1)[0]
    bg = f'<rect width="{box}" height="{box}" rx="{radius:.2f}" fill="{ink}"/>' if tile else ''
    return svg(box, box, bg + f'<g transform="translate({(box - w * s) / 2:.2f} '
                              f'{(box - h * s) / 2:.2f}) scale({s:.4f})">{guts}</g>')

def em_lock(size=64, ink=INK, accent=OLIVE, mark_ink=None, sub=None, sub_color=MUTED):
    """El monograma y el nombre comparten línea base y altura de mayúscula:
    no es un icono pegado a un texto, es una sola composición."""
    mark = em(size, mark_ink or ink, accent)
    vb = mark.split('viewBox="')[1].split('"')[0].split()
    mw, mh = float(vb[2]), float(vb[3])
    guts = mark.split('>', 1)[1].rsplit('</svg>', 1)[0]
    ts = size * .40
    cap = F.metrics('anybody')['cap'] * ts
    body, accs, adv = F.set_text('David Estévez Martínez', 'anybody', ts, .01, wdth=92, wght=520)
    gap = size * .30
    base = mh - (size * .16 if sub else 0)
    name = (f'<g transform="translate({mw + gap:.2f} {base:.2f})"><path d="{body}" fill="{ink}"/>'
            + ''.join(grow(a, 1.0) for a in accs).replace('<g tr', f'<g fill="{accent}" tr') + '</g>')
    sub_el, w = '', mw + gap + adv
    if sub:
        sb, _, sadv = F.set_text(sub, 'anybody', size * .20, .045, wdth=92, wght=420)
        sub_el = (f'<g transform="translate({mw + gap:.2f} {base + size * .21:.2f})">'
                  f'<path d="{sb}" fill="{sub_color}"/></g>')
        w = mw + gap + max(adv, sadv)
    h = mh + (size * .40 if sub else 0)
    return svg(w, h, f'<g>{guts}</g>' + name + sub_el)

# ══ 3 · ACENTO — la tilde crecida dentro del propio nombre ══════════════════
# Cada corte lleva su propia tilde: la de un serif es una gota y se emborrona
# al ampliarla; la de un grotesco es un paralelogramo y aguanta.
FACE_AX = {'bricolage': dict(wght=700, opsz=96, wdth=100),
           'anybody':   dict(wght=560, wdth=100),
           'serif':     {}, 'archivo': dict(wght=600)}
FACE_BOOST = {'bricolage': 1.55, 'anybody': 1.7, 'serif': 1.12, 'archivo': 1.6}

def acento(size=100, ink=INK, accent=OLIVE, boost=None, face='bricolage',
           text='Estévez', kicker='DAVID', tail=None, tail_color=None):
    """Sin icono aparte: el logotipo es el nombre, y la tilde es lo que lo marca.
    El viewBox sale de la mancha real, no del avance: con la tilde ampliada y los
    voladizos del corte, el avance se queda corto y recortaría el dibujo."""
    ax = FACE_AX.get(face, {})
    boost = FACE_BOOST.get(face, 1.5) if boost is None else boost
    body, accs, adv = F.set_text(text, face, size, -.005, **ax)
    bb = list(bbox(body))
    for a in accs:                                   # tilde ampliada sobre su base
        ax0, ay0, ax1, ay1 = bbox(a)
        bb = [min(bb[0], ax0 - (ax1 - ax0) * (boost - 1) / 2), min(bb[1], grown_top(a, boost)),
              max(bb[2], ax1 + (ax1 - ax0) * (boost - 1) / 2), max(bb[3], ay1)]
    acc = ''.join(grow(a, boost) for a in accs)

    gap, tail_el = size * .20, ''
    if tail:
        tb, tacc, tadv = F.set_text(tail, face, size, -.005, **ax)
        tx0, ty0, tx1, ty1 = bbox(tb)
        bb = [bb[0], min(bb[1], ty0), max(bb[2], adv + gap + tx1), max(bb[3], ty1)]
        tail_el = (f'<g transform="translate({adv + gap:.2f} 0)"><path d="{tb}" '
                   f'fill="{tail_color or ink}" opacity="{1 if tail_color else .42}"/>'
                   + (''.join(f'<path d="{a}" fill="{accent}"/>' for a in tacc)
                      if tail_color else '') + '</g>')

    k, khead = '', 0.0
    if kicker:
        ks = size * .165
        kb, _, _ = F.set_text(kicker, 'anybody', ks, .22, wdth=100, wght=580)
        kx0, ky0, kx1, ky1 = bbox(kb)
        khead = (bb[1] - ky1) - ks * .95            # la línea base del kicker
        k = f'<g transform="translate({bb[0] - kx0:.2f} {khead:.2f})"><path d="{kb}" fill="{accent}"/></g>'
        bb = [bb[0], min(bb[1], khead + ky0), max(bb[2], bb[0] - kx0 + kx1), bb[3]]

    g = f'<path d="{body}" fill="{ink}"/><g fill="{accent}">{acc}</g>{tail_el}'
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    return svg(w, h, k + g, f'{bb[0]:.2f} {bb[1]:.2f} {w:.2f} {h:.2f}')

def acento_icono(box=64, tile=True, ink=INK, accent=LIME, radius=None, face='bricolage'):
    """La tilde sola, con el corte de la fuente elegida."""
    radius = box * .18 if radius is None else radius
    _, accs, _ = F.set_text('É', face, 100, **FACE_AX.get(face, {}))
    a = accs[0]
    x0, y0, x1, y1 = bbox(a)
    s = box * .46 / (y1 - y0)
    if (x1 - x0) * s > box * .62:
        s = box * .62 / (x1 - x0)
    bg = f'<rect width="{box}" height="{box}" rx="{radius:.2f}" fill="{ink}"/>' if tile else ''
    return svg(box, box, bg + f'<g transform="translate({(box - (x1 - x0) * s) / 2 - x0 * s:.2f} '
                              f'{(box - (y1 - y0) * s) / 2 - y0 * s:.2f}) scale({s:.4f})">'
                              f'<path d="{a}" fill="{accent}"/></g>')
