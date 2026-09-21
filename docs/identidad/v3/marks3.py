"""DÉM en la paleta de David. La tilde es el signo; el bloque resuelve los 16 px."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fontlab as F
from pathutil import bbox
from marks2 import svg, grow, grown_top, INK, PAPER, LIME, OLIVE, MUTED

AX = {'anybody': dict(wght=760, wdth=100), 'bricolage': dict(wght=800, opsz=96, wdth=100),
      'serif': {}, 'archivo': dict(wght=650)}
BOOST = {'anybody': 1.85, 'bricolage': 1.7, 'serif': 1.1, 'archivo': 1.8}

def _rows(lines, width, size, face, wght_ax, lead):
    """Filas justificadas al mismo ancho. Si la fuente trae eje de anchura se usa
    ese; si no —Archivo—, se reparte la diferencia con tracking."""
    cap = F.metrics(face, **wght_ax)['cap'] * size
    has_wdth = 'wdth' in F.axes_of(face)
    out, y = [], 0.0
    for ln in lines:
        ax = dict(wght_ax)
        if has_wdth:
            ax['wdth'] = F.fit_width(ln, width, face, size, (70, 200),
                                     **{k: v for k, v in wght_ax.items() if k != 'wdth'})
        else:
            ax.pop('wdth', None)
        body, accs, adv = F.set_text(ln, face, size, 0, **ax)
        if abs(width - adv) > .5 and len(ln) > 1:
            body, accs, adv = F.set_text(ln, face, size, (width - adv) / (len(ln) - 1) / size, **ax)
        y += cap
        out.append((y, body, accs))
        y += cap * (lead - 1)
    return out, y - cap * (lead - 1), cap

# ══ 1 · BLOQUE — DÉ sobre M, ambas al mismo ancho: un cuadrado macizo ═══════
def dem_bloque(box=64, tile=True, ink=INK, fg=PAPER, accent=LIME, radius=None,
               face='anybody', pad_f=.155, lead=1.06, boost=None):
    """Las tres letras apiladas en dos filas de anchura idéntica. El resultado es
    un cuadrado, que es exactamente la forma que pide un favicon."""
    radius = box * .20 if radius is None else radius
    boost = BOOST[face] if boost is None else boost
    pad = box * pad_f
    inner = box - 2 * pad
    ax = AX[face]
    cap0 = F.metrics(face, **ax)['cap']
    size = inner / (cap0 * (1 + lead))
    rows, h, cap = _rows(('DÉ', 'M'), inner, size, face, ax, lead)
    # la tilde sube por encima de la caja de mayúsculas: se le deja aire arriba
    top_rise = 0.0
    for y, _, accs in rows:
        for a in accs:
            top_rise = min(top_rise, y + grown_top(a, boost) - (y - cap))
    scale = inner / (h - top_rise)
    g = []
    for y, body, accs in rows:
        g.append(f'<g transform="translate(0 {y:.2f})"><path d="{body}" fill="{fg}"/>'
                 + (f'<g fill="{accent}">' + ''.join(grow(a, boost) for a in accs) + '</g>'
                    if accs else '') + '</g>')
    bg = f'<rect width="{box}" height="{box}" rx="{radius:.2f}" fill="{ink}"/>' if tile else ''
    return svg(box, box, bg + f'<g transform="translate({pad:.2f} {pad - top_rise * scale:.2f}) '
                              f'scale({scale:.4f})">{"".join(g)}</g>')

# ══ 2 · LÍNEA — DÉM de corrido, la tilde como signo ═════════════════════════
def dem_linea(size=100, ink=INK, accent=OLIVE, face='serif', boost=None, kern=-.01):
    boost = BOOST[face] if boost is None else boost
    ax = AX[face]
    body, accs, adv = F.set_text('DÉM', face, size, kern, **ax)
    bb = list(bbox(body))
    for a in accs:
        a0, _, a1, _ = bbox(a)
        bb = [min(bb[0], a0 - (a1 - a0) * (boost - 1) / 2), min(bb[1], grown_top(a, boost)),
              max(bb[2], a1 + (a1 - a0) * (boost - 1) / 2), bb[3]]
    acc = ''.join(grow(a, boost) for a in accs)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    return svg(w, h, f'<path d="{body}" fill="{ink}"/><g fill="{accent}">{acc}</g>',
               f'{bb[0]:.2f} {bb[1]:.2f} {w:.2f} {h:.2f}')

# ══ 3 · LA TILDE SOLA — el nivel que de verdad aguanta 16 px ════════════════
def tilde_icono(box=64, tile=True, ink=INK, accent=LIME, radius=None,
                face='anybody', frac=.46):
    radius = box * .20 if radius is None else radius
    _, accs, _ = F.set_text('É', face, 100, **AX[face])
    a = accs[0]
    x0, y0, x1, y1 = bbox(a)
    s = min(box * frac / (y1 - y0), box * .60 / (x1 - x0))
    bg = f'<rect width="{box}" height="{box}" rx="{radius:.2f}" fill="{ink}"/>' if tile else ''
    return svg(box, box, bg + f'<g transform="translate({(box - (x1 - x0) * s) / 2 - x0 * s:.2f} '
                              f'{(box - (y1 - y0) * s) / 2 - y0 * s:.2f}) scale({s:.4f})">'
                              f'<path d="{a}" fill="{accent}"/></g>')

# ══ FIRMAS ══════════════════════════════════════════════════════════════════
def firma_bloque(size=64, ink=INK, accent=OLIVE, tile_ink=INK, fg=PAPER,
                 mark_accent=LIME, sub='Ingeniero de software', name_face='anybody'):
    """El bloque y el nombre, alineados por altura de mayúscula. Una composición."""
    mark = dem_bloque(size, ink=tile_ink, fg=fg, accent=mark_accent)
    guts = mark.split('>', 1)[1].rsplit('</svg>', 1)[0]
    ts = size * .30
    nax = dict(AX[name_face]); nax['wght'] = 520
    body, accs, adv = F.set_text('David Estévez Martínez', name_face, ts, .005, **nax)
    cap = F.metrics(name_face, **nax)['cap'] * ts
    gap, tx = size * .34, size + size * .34
    sb, sadv = '', 0
    if sub:
        sax = dict(nax); sax['wght'] = 430
        sb, _, sadv = F.set_text(sub, name_face, size * .175, .06, **sax)
    block = cap + (size * .26 if sub else 0)
    base = (size - block) / 2 + cap
    name = (f'<g transform="translate({tx:.2f} {base:.2f})"><path d="{body}" fill="{ink}"/>'
            + ''.join(f'<path d="{a}" fill="{accent}"/>' for a in accs) + '</g>')
    sube = (f'<g transform="translate({tx:.2f} {base + size * .26:.2f})">'
            f'<path d="{sb}" fill="{MUTED}"/></g>') if sub else ''
    return svg(tx + max(adv, sadv), size, guts + name + sube)
