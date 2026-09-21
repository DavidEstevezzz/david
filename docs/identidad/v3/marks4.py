"""DÉM, el bloque. Alineado y centrado por mancha real, no por avance tipográfico.

La versión anterior justificaba las filas por su avance, que incluye los espacios
laterales del glifo. Dos filas con el mismo avance tienen manchas distintas: de ahí
los 12 px de diferencia entre DÉ y M. Aquí todo se mide sobre la tinta.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fontlab as F
from pathutil import bbox

INK, PAPER, LIME, OLIVE, MUTED = '#17231c', '#edf0e7', '#dcf89c', '#526f3c', '#7d8c72'
REF = 100.0

AX = {'anybody':   dict(wght=760),
      'bricolage': dict(wght=800, opsz=96),
      'archivo':   dict(wght=650)}

# ── variantes de color: la marca vive en dos tejas ─────────────────────────
TEJA = {
    #                fondo   letras  tilde
    'tinta': dict(tile=INK,  fg=PAPER, accent=LIME),   # sobre cualquier fondo
    'lima':  dict(tile=LIME, fg=INK,   accent=OLIVE),  # sobre fondo claro
}

def _svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.3f} {h:.3f}" '
            f'width="{w:.3f}" height="{h:.3f}">{body}</svg>')

def _ink(text, face, size, ax, wdth=None, tracking=0.0):
    a = dict(ax)
    if wdth is not None:
        a['wdth'] = wdth
    body, accs, _ = F.set_text(text, face, size, tracking, **a)
    return body, accs, bbox(body)

def _rango_wdth(face):
    f, _ = F.load(face)
    for a in (f['fvar'].axes if 'fvar' in f else []):
        if a.axisTag == 'wdth':
            return a.minValue, a.maxValue
    return None

def fit_ink(text, target, face, size, ax, rng=None):
    """Valor del eje de anchura que hace que la MANCHA mida exactamente `target`.

    La anchura de mancha es monótona y casi lineal respecto al eje, así que
    bastan unos pocos pasos. Se redondea a una décima para que la instancia de
    la fuente se reutilice de la caché en vez de generar una nueva cada vez.
    """
    lo, hi = rng or _rango_wdth(face) or (50, 150)
    for _ in range(16):
        mid = round((lo + hi) / 2, 1)
        if mid in (round(lo, 1), round(hi, 1)):
            break
        _, _, b = _ink(text, face, size, ax, mid)
        if (b[2] - b[0]) < target:
            lo = mid
        else:
            hi = mid
    return round((lo + hi) / 2, 1)

def ratio_posible(rows, face, safety=.965):
    """Proporción ancho:alto que TODAS las filas pueden alcanzar.
    Una M sola no se estira tanto como 'DÉ': el tope lo pone la fila más corta."""
    has = 'wdth' in F.axes_of(face)
    topes = []
    for t in rows:
        if has:
            f, _ = F.load(face)
            wmax = max(a.maxValue for a in f['fvar'].axes if a.axisTag == 'wdth')
            _, _, b = _ink(t, face, REF, AX[face], wmax)
        else:
            _, _, b = _ink(t, face, REF, AX[face])
        topes.append((b[2] - b[0]) / (b[3] - b[1]))
    return min(topes) * safety

def dem_bloque(box=64, teja='tinta', face='anybody', margin_f=.1450, gap_f=.0600,
               boost=1.45, acc_gap_f=.070, radius_f=.2050, tile=True, guides=False,
               rows=('DÉ', 'M'), fg=None, accent=None, tile_color=None, ratio=None,
               optica=.34):
    """Las dos filas con idéntica mancha, a sangre sobre la misma caja, y el
    conjunto centrado al milímetro en el cuadro. El bloque no llega a los bordes
    laterales porque la M no da más de sí: forzarlo sería deformar la letra."""
    c = dict(TEJA[teja])
    if fg: c['fg'] = fg
    if accent: c['accent'] = accent
    if tile_color: c['tile'] = tile_color

    has_wdth = 'wdth' in F.axes_of(face)
    r = ratio_posible(rows, face) if ratio is None else ratio

    # presupuesto vertical en unidades de altura de mayúscula
    _, probe_acc, _ = _ink(rows[0], face, REF, AX[face], 100 if has_wdth else None)
    _, _, pb = _ink(rows[0], face, REF, AX[face], 100 if has_wdth else None)
    cap_ref = pb[3] - pb[1]
    acc_h_u = 0.0
    if probe_acc:
        ab = bbox(probe_acc[0])
        acc_h_u = (ab[3] - ab[1]) * boost / cap_ref          # alto de tilde, en caps

    alto_u = acc_h_u + acc_gap_f + 2 + gap_f                 # tilde + aire + 2 filas
    ancho_u = r                                             # ancho, en caps
    libre = box * (1 - 2 * margin_f)
    cap = min(libre / alto_u, libre / ancho_u)
    size = REF * cap / cap_ref
    W, gap = r * cap, cap * gap_f
    H = cap * alto_u
    x0 = (box - W) / 2                                      # centrado exacto en horizontal

    # En vertical manda la masa, que son las letras: se centran ellas y la tilde
    # vive en el aire de arriba. Un ajuste óptico baja el conjunto una fracción
    # del alto de la tilde, que es lo que el ojo compensa.
    letras_h = 2 * cap + gap
    y_letras = (box - letras_h) / 2 + cap * acc_h_u * optica
    y0 = y_letras - cap * (acc_h_u + acc_gap_f)
    placed = []
    for i, text in enumerate(rows):
        if has_wdth:
            wd = fit_ink(text, W, face, size, AX[face])
            body, accs, b = _ink(text, face, size, AX[face], wd)
        else:
            tr = 0.0
            for _ in range(30):
                body, accs, b = _ink(text, face, size, AX[face], None, tr)
                err = W - (b[2] - b[0])
                if abs(err) < .005 or len(text) < 2:
                    break
                tr += err / max(len(text) - 1, 1) / size
            body, accs, b = _ink(text, face, size, AX[face], None, tr)
            if len(text) < 2:                                # una letra sin eje: se centra
                b2 = b
                placed.append((x0 + (W - (b2[2]-b2[0]))/2 - b2[0],
                               y_letras + i * (cap + gap) - b2[1], body, accs))
                continue
        placed.append((x0 - b[0], y_letras + i * (cap + gap) - b[1], body, accs))

    g = ''.join(f'<g transform="translate({dx:.3f} {dy:.3f})"><path d="{body}" '
                f'fill="{c["fg"]}"/></g>' for dx, dy, body, accs in placed)

    accent_el = ''
    dx, dy, _, accs = placed[0]
    if accs:
        a = accs[0]
        ax0, ay0, ax1, ay1 = bbox(a)
        aw = (ax1 - ax0) * boost
        cx = dx + (ax0 + ax1) / 2
        left = min(max(cx - aw / 2, x0), x0 + W - aw)        # nunca sale del bloque
        bottom = y_letras - cap * acc_gap_f
        accent_el = (f'<g transform="translate({left - ax0 * boost:.3f} '
                     f'{bottom - ay1 * boost:.3f}) scale({boost:.4f})">'
                     f'<path d="{a}" fill="{c["accent"]}"/></g>')

    bg = (f'<rect width="{box}" height="{box}" rx="{box * radius_f:.3f}" '
          f'fill="{c["tile"]}"/>') if tile else ''
    gd = ''
    if guides:
        k = box * .0045
        gd = (f'<g fill="none" stroke="#e0522e" stroke-width="{k:.3f}" opacity=".9">'
              f'<rect x="{x0:.3f}" y="{y0:.3f}" width="{W:.3f}" height="{H:.3f}"/>'
              f'<rect x="{x0:.3f}" y="{y_letras:.3f}" width="{W:.3f}" height="{2*cap+gap:.3f}" opacity=".55"/>'
              f'<path d="M{box/2:.3f} 0V{box:.3f}M0 {box/2:.3f}H{box:.3f}" '
              f'stroke-dasharray="{box*.022:.2f} {box*.022:.2f}" opacity=".7"/></g>')
    return _svg(box, box, bg + g + accent_el + gd)

def medir(box=256, **kw):
    """Comprueba la simetría sobre el SVG generado: márgenes y anchos de fila."""
    import xml.etree.ElementTree as ET, re
    root = ET.fromstring(dem_bloque(box, **kw))
    NS = '{http://www.w3.org/2000/svg}'
    out = []
    def walk(n, tx=0., ty=0., s=1.):
        for ch in n:
            t = ch.get('transform', '')
            nx, ny, ns_ = tx, ty, s
            m = re.search(r'translate\(([-\d.]+) ([-\d.]+)\)', t)
            if m: nx, ny = tx + float(m.group(1)) * s, ty + float(m.group(2)) * s
            m2 = re.search(r'scale\(([-\d.]+)\)', t)
            if m2: ns_ = s * float(m2.group(1))
            if ch.tag == NS + 'path' and ch.get('fill') and ch.get('d', '').strip():
                b = bbox(ch.get('d'))
                out.append((ch.get('fill'),
                            [nx + b[0]*ns_, ny + b[1]*ns_, nx + b[2]*ns_, ny + b[3]*ns_]))
            walk(ch, nx, ny, ns_)
    walk(root)
    teja = TEJA[kw.get('teja', 'tinta')]
    letras = [b for f, b in out if f == teja['fg']]
    tilde = [b for f, b in out if f == teja['accent']]
    L = min(b[0] for b in letras); R = max(b[2] for b in letras)
    T = min(b[1] for b in letras); B = max(b[3] for b in letras)
    return {
        'izq': L, 'der': box - R, 'arr': T, 'abj': box - B,
        'anchos_fila': [round(b[2] - b[0], 4) for b in letras],
        'dif_ancho': round(abs((letras[0][2]-letras[0][0]) - (letras[1][2]-letras[1][0])), 4),
        'desv_h': round(L - (box - R), 4), 'desv_v': round(T - (box - B), 4),
        'tilde_arriba': round(tilde[0][1], 3) if tilde else None,
        'tilde_der': round(box - tilde[0][2], 3) if tilde else None,
    }


# ══ FIRMA · el bloque y el nombre, una sola composición ═════════════════════
NOMBRE_AX = dict(wght=560, wdth=94)

def firma(size=64, teja='tinta', ink=INK, accent=OLIVE, sub='Ingeniero de software',
          sub_color=MUTED, face='anybody', bloque=None):
    """El bloque y el nombre comparten eje óptico: la altura de mayúscula del
    nombre se alinea con la fila superior del bloque."""
    marca = bloque or dem_bloque(size, teja=teja, face=face)
    guts = marca.split('>', 1)[1].rsplit('</svg>', 1)[0]
    ts = size * .285
    body, accs, adv = F.set_text('David Estévez Martínez', face, ts, .004, **NOMBRE_AX)
    b = bbox(body)
    cap = b[3] - b[1]
    gap = size * .32
    tx = size + gap
    sb, sadv, sh = '', 0, 0
    if sub:
        sax = dict(NOMBRE_AX); sax['wght'] = 430
        sb, _, sadv = F.set_text(sub, face, size * .175, .05, **sax)
        sbb = bbox(sb)
        sh = size * .255
    alto = cap + sh
    base = (size - alto) / 2 + cap
    g = (f'<g transform="translate({tx - b[0]:.3f} {base:.3f})"><path d="{body}" fill="{ink}"/>'
         + ''.join(f'<path d="{a}" fill="{accent}"/>' for a in accs) + '</g>')
    sg = (f'<g transform="translate({tx - bbox(sb)[0]:.3f} {base + sh:.3f})">'
          f'<path d="{sb}" fill="{sub_color}"/></g>') if sub else ''
    return _svg(tx + max(adv, sadv), size, guts + g + sg)
