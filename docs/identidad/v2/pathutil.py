"""Parser mínimo de paths SVG: caja envolvente y traslación correctas con H/V."""
import re
TOK = re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?')
ARGS = {'M':2,'L':2,'H':1,'V':1,'C':6,'S':4,'Q':4,'T':2,'A':7,'Z':0}

def _walk(d):
    """Genera (comando, args, punto_actual_antes) recorriendo el path."""
    toks = TOK.findall(d)
    i, cmd, x, y, sx, sy = 0, None, 0.0, 0.0, 0.0, 0.0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
        n = ARGS[cmd.upper()]
        rel = cmd.islower()
        a = [float(v) for v in toks[i:i + n]]; i += n
        yield cmd, a, (x, y)
        c = cmd.upper()
        if c == 'M': x, y = (x + a[0], y + a[1]) if rel else (a[0], a[1]); sx, sy = x, y
        elif c == 'L': x, y = (x + a[0], y + a[1]) if rel else (a[0], a[1])
        elif c == 'H': x = x + a[0] if rel else a[0]
        elif c == 'V': y = y + a[0] if rel else a[0]
        elif c in 'CSQT':
            x, y = (x + a[-2], y + a[-1]) if rel else (a[-2], a[-1])
        elif c == 'A': x, y = (x + a[-2], y + a[-1]) if rel else (a[-2], a[-1])
        elif c == 'Z': x, y = sx, sy

def bbox(d):
    xs, ys = [], []
    for cmd, a, (x, y) in _walk(d):
        c, rel = cmd.upper(), cmd.islower()
        if c == 'Z': continue
        if c == 'H':
            xs.append(x + a[0] if rel else a[0]); ys.append(y)
        elif c == 'V':
            ys.append(y + a[0] if rel else a[0]); xs.append(x)
        else:
            pts = list(zip(a[0::2], a[1::2])) if c != 'A' else [(a[-2], a[-1])]
            for px, py in pts:
                xs.append(x + px if rel else px); ys.append(y + py if rel else py)
    return min(xs), min(ys), max(xs), max(ys)
