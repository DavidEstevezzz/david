"""Compositor tipográfico sobre cualquier fuente variable: curvas reales + kerning."""
import io, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.misc.transform import Transform
import uharfbuzz as hb

FONTS = {
    'archivo':    '/home/user/david/public/fonts/archivo-latin-wght-normal.woff2',
    'anybody':    'fonts/anybody.ttf',
    'serif':      'fonts/instrumentserif.ttf',
    'mono':       'fonts/martianmono.ttf',
    'bricolage':  'fonts/bricolagegrotesque.ttf',
}
_cache = {}

def load(name, **axes):
    key = (name, tuple(sorted(axes.items())))
    if key not in _cache:
        f = TTFont(FONTS[name])
        if axes and 'fvar' in f:
            f = instantiateVariableFont(f, axes, updateFontNames=False)
        buf = io.BytesIO(); f.flavor = None; f.save(buf)
        _cache[key] = (f, buf.getvalue())
    return _cache[key]

def _contours(glyphset, name):
    # Decomposing: en muchas fuentes É es un compuesto (E + tilde) y un pen
    # normal solo anota la referencia, sin los contornos.
    rec = DecomposingRecordingPen(glyphset); glyphset[name].draw(rec)
    out, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'):
            ys = [p[1] for o, a in cur for p in a if isinstance(p, tuple)]
            out.append((min(ys) if ys else 0, cur)); cur = []
    if cur:
        ys = [p[1] for o, a in cur for p in a if isinstance(p, tuple)]
        out.append((min(ys) if ys else 0, cur))
    return out

def set_text(text, name='archivo', size=100, tracking=0.0, split=True, **axes):
    """Devuelve (cuerpo, [acentos], ancho). Los acentos salen aparte para colorearlos."""
    font, raw = load(name, **axes)
    upem = font['head'].unitsPerEm
    gs, order = font.getGlyphSet(), font.getGlyphOrder()
    face = hb.Face(raw); hf = hb.Font(face); hf.scale = (upem, upem)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(hf, buf, None)
    scale, track = size / upem, tracking * upem
    body, marks, x = [], [], 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gname = order[info.codepoint]
        tx = Transform(scale, 0, 0, -scale, (x + pos.x_offset) * scale, -pos.y_offset * scale)
        cs = _contours(gs, gname)
        acc = split and 'acute' in gname.lower() and len(cs) > 1
        top = max(c[0] for c in cs) if acc else None
        for miny, cmds in cs:
            pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}')
            tp = TransformPen(pen, tx)
            for op, args in cmds:
                getattr(tp, op)(*args)
            d = pen.getCommands()
            if d:
                (marks if (acc and miny == top) else body).append(d)
        x += pos.x_advance + track
    return ' '.join(body), marks, (x - track if buf.glyph_infos else 0) * scale

def metrics(name='archivo', **axes):
    f, _ = load(name, **axes)
    u = f['head'].unitsPerEm
    return {'cap': f['OS/2'].sCapHeight / u, 'x': f['OS/2'].sxHeight / u,
            'asc': f['hhea'].ascender / u, 'desc': f['hhea'].descender / u}

def fit_width(text, target, name='anybody', size=100, wdth=(60, 150),
              tracking=0.0, **axes):
    """Busca el valor del eje de anchura que hace que la línea mida exactamente
    `target`. Estirar un eje diseñado no es deformar: es para lo que está."""
    lo, hi = wdth
    for _ in range(28):
        mid = (lo + hi) / 2
        _, _, w = set_text(text, name, size, tracking, wdth=mid, **axes)
        if w < target: lo = mid
        else: hi = mid
    return (lo + hi) / 2
