import json, sys, os
sys.path.insert(0, os.getcwd())
import marks2 as M, fontlab as F
from marks2 import INK, PAPER, LIME, OLIVE, MUTED, svg
from pathutil import bbox

A = {}
# 1 · Placa
A['placa']        = M.placa(60)
A['placa_dark']   = M.placa(60, ink=PAPER, accent=LIME)
A['placa_rules']  = M.placa(60, rules=True)
A['placa_2']      = M.placa(60, lines=('ESTÉVEZ', 'MARTÍNEZ'))
A['placa_icon']   = M.placa_icono(64)
A['placa_icon_f'] = M.placa_icono(64, tile=False, fg=INK)
A['placa_nav']    = M.placa(30, ink=PAPER, accent=LIME, lines=('ESTÉVEZ', 'MARTÍNEZ'))
# 2 · ÉM
A['em']           = M.em(90, INK, OLIVE)
A['em_dark']      = M.em(90, PAPER, LIME)
A['em_lock']      = M.em_lock(62, sub='Ingeniería digital independiente')
A['em_lock_dark'] = M.em_lock(62, ink=PAPER, accent=LIME, sub='Ingeniería digital independiente')
A['em_icon']      = M.em_icono(64)
A['em_icon_f']    = M.em_icono(64, tile=False, fg=INK, accent=OLIVE)
A['em_nav']       = M.em_lock(40, ink=PAPER, accent=LIME)
# 3 · Acento
A['acento']       = M.acento(80)
A['acento_dark']  = M.acento(80, ink=PAPER, accent=LIME)
A['acento_tail']  = M.acento(62, tail='Martínez')
A['acento_one']   = M.acento(62, kicker=None, text='David Estévez')
A['acento_serif'] = M.acento(70, face='serif')
A['acento_icon']  = M.acento_icono(64)
A['acento_icon_f']= M.acento_icono(64, tile=False, accent=OLIVE)
A['acento_nav']   = M.acento(34, ink=PAPER, accent=LIME)

# la tilde suelta, para marcar secciones
_, accs, _ = F.set_text('É', 'bricolage', 100, **M.FACE_AX['bricolage'])
x0, y0, x1, y1 = bbox(accs[0])
A['tilde'] = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} '
              f'{x1-x0:.2f} {y1-y0:.2f}"><path d="{accs[0]}" fill="currentColor"/></svg>')

# muestrarios: la misma línea en las tres tipografías
for key, face, ax in (('sp_anybody', 'anybody', dict(wdth=100, wght=600)),
                      ('sp_bricolage', 'bricolage', dict(wght=700, opsz=96, wdth=100)),
                      ('sp_serif', 'serif', {}),
                      ('sp_archivo', 'archivo', dict(wght=500))):
    b, ac, adv = F.set_text('Estévez Martínez 0123', face, 100, 0, **ax)
    bx = bbox(b)
    acs = ''.join(f'<path d="{a}" fill="{OLIVE}"/>' for a in ac)
    A[key] = svg(bx[2] - bx[0], bx[3] - bx[1],
                 f'<path d="{b}" fill="{INK}"/>{acs}',
                 f'{bx[0]:.2f} {bx[1]:.2f} {bx[2]-bx[0]:.2f} {bx[3]-bx[1]:.2f}')

json.dump(A, open('assets2.json', 'w'), ensure_ascii=False)
print(len(A), 'recursos ·', sum(len(v) for v in A.values()) // 1024, 'KB')
