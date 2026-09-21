# Despliegue en IONOS

El sitio es estático: se compila en local y se sube el contenido de `dist/`
a la raíz del espacio web. No hay servidor Node ni base de datos que mantener.

## Una sola vez

1. **Cuenta SFTP+SSH en IONOS.** Panel → *Administrar accesos de FTP seguro* →
   *Crear nueva cuenta de FTP*:
   - **Contraseña:** larga, guardada en el gestor de contraseñas.
   - **Nota personal:** `Despliegue estevezmartinez.com`.
   - **Type:** `SFTP + SSH`.
   - **Directorio:** la carpeta raíz del dominio (normalmente `/`). Si el
     dominio apunta a una subcarpeta, elígela con *Modificar*: así esta cuenta
     no puede tocar nada más.
   Anota el **usuario** (lo asigna IONOS) y el **host** SFTP.
2. **Dominio → espacio web.** Panel → *Dominios* → asignar el dominio a este
   contrato de hosting. Comprobar que apunta a la carpeta donde se sube `dist/`.
3. **SSL.** Panel → *SSL* → activar el certificado gratuito para el dominio
   **y** para el `www`. Sin esto, el `.htaccess` redirige a https y da error.

## Cada vez que se publica

```sh
npm run deploy      # compila y genera dist.zip
```

Después, con FileZilla (SFTP, puerto 22): subir **solo `dist.zip`** a la raíz.
Y por SSH:

```sh
unzip -o dist.zip -d .
rm dist.zip
```

Un `.zip` sube en segundos; arrastrar la carpeta suelta tarda minutos y a veces
deja archivos a medias.

> Si se prefiere no usar SSH: `npm run build` y arrastrar el **contenido** de
> `dist/` (no la carpeta) a la raíz, sobrescribiendo.

## Comprobaciones después del primer despliegue

- `https://estevezmartinez.com` carga y `http://` redirige a `https://`.
- `https://www.estevezmartinez.com` redirige al dominio sin `www`.
- `https://estevezmartinez.com/robots.txt` y `/sitemap-index.xml` responden.
- Una URL inventada muestra la página 404 propia.
- Compartir el enlace en WhatsApp muestra la imagen de `og-default.jpg`.

## Search Console

1. Alta en Google Search Console con el dominio.
2. Verificación por **registro DNS TXT** (se añade en el panel de IONOS).
3. *Sitemaps* → enviar `sitemap-index.xml`.
4. *Inspección de URL* → pedir indexación de la portada.

## Archivos que gobiernan el SEO

| Archivo | Qué controla |
|---|---|
| `src/config/site.ts` | Dominio, contacto, imagen social. Fuente única. |
| `astro.config.mjs` | `site:` (debe coincidir con el anterior) y sitemap. |
| `src/layouts/Shell.astro` | Título, descripción, canónica, redes sociales. |
| `src/lib/schema.ts` | Datos estructurados (JSON-LD). |
| `public/.htaccess` | HTTPS, `www`, caché, compresión, 404, seguridad. |
| `public/robots.txt` | Qué puede rastrear Google. |

**Si cambia el dominio:** editar `src/config/site.ts`, la línea `site:` de
`astro.config.mjs` y la línea `Sitemap:` de `public/robots.txt`.
