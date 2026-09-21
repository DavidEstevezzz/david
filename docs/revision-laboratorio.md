# Laboratorio de movimiento

/lab/morph conserva el ensayo inicial. No determina la forma ni la identidad de la portada.

El vertex shader de src/scripts/visual/shaders.ts curva un plano mediante una onda multiplicada por una envolvente. El fragment shader calcula un SDF de rectángulo redondeado con radio animable y suavizado del borde. La secuencia de src/scripts/visual/morph.ts usa ScrollTrigger con pin y scrub para animar escala, curvatura y aplanado.

Al terminar, WebGL se retira y aparece el panel HTML. Flip mide el panel real; como ya está alineado, no tiene que interpolar una geometría distinta. No se afirma que Flip pueda deformar WebGL: el shader realiza esa parte.

La portada reutiliza el principio de superficies que se curvan, pero incorpora un portátil articulado, contenido HTML proyectado y una cámara independiente.
