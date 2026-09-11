import json, sys, os; sys.path.insert(0, os.getcwd())
import marks3 as M, fontlab as F
from marks3 import INK, PAPER, LIME, OLIVE, svg
from pathutil import bbox
A = {}
A['bloque']       = M.dem_bloque(96)
A['bloque_lima']  = M.dem_bloque(96, ink=LIME, fg=INK, accent=INK)
A['bloque_plano'] = M.dem_bloque(96, tile=False, fg=INK, accent=OLIVE)
for f in ('anybody', 'bricolage', 'archivo'):
    A[f'bloque_{f}'] = M.dem_bloque(96, face=f)
A['linea_serif']  = M.dem_linea(80, face='serif')
A['linea_bric']   = M.dem_linea(80, face='bricolage')
A['linea_any']    = M.dem_linea(80, face='anybody')
A['linea_serif_d']= M.dem_linea(80, face='serif', ink=PAPER, accent=LIME)
A['linea_bric_d'] = M.dem_linea(80, face='bricolage', ink=PAPER, accent=LIME)
A['linea_any_d']  = M.dem_linea(80, face='anybody', ink=PAPER, accent=LIME)
A['tilde_icon']   = M.tilde_icono(96)
A['tilde_plano']  = M.tilde_icono(96, tile=False, accent=OLIVE)
A['firma']        = M.firma_bloque(72)
A['firma_dark']   = M.firma_bloque(72, ink=PAPER, accent=LIME, tile_ink=LIME, fg=INK, mark_accent=INK)
A['nav']          = M.firma_bloque(44, ink=PAPER, accent=LIME, sub=None)
_, accs, _ = F.set_text('É', 'anybody', 100, **M.AX['anybody'])
x0, y0, x1, y1 = bbox(accs[0])
A['tilde'] = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} '
              f'{x1-x0:.2f} {y1-y0:.2f}"><path d="{accs[0]}" fill="currentColor"/></svg>')
json.dump(A, open('assets3.json', 'w'), ensure_ascii=False)
print(len(A), 'recursos ·', sum(len(v) for v in A.values()) // 1024, 'KB')
