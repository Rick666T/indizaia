# QA de IndizaIA

## Comprobaciones realizadas

- Sintaxis validada con `node --check` en todos los módulos JavaScript.
- Verificación estática de que todos los selectores `#id` usados por `app.js` existen en `index.html`.
- Verificación de que no existen identificadores HTML duplicados.
- Verificación de imports locales de JavaScript.
- Prueba unitaria básica del extractor de términos en español.
- La generación MARC utiliza primero el MARCXML oficial de ID.LOC.GOV; sólo usa heurística si ese formato no está disponible y lo marca para revisión.

## Dependencias externas en tiempo de ejecución

La aplicación es estática, pero necesita Internet para:

- Crossref REST API.
- ID.LOC.GOV (sugerencias, JSON/MADS y MARCXML).
- UNESCO SPARQL.
- Descargar PDF.js y Tesseract.js cuando se usan esas funciones.

Si alguno de esos servicios cambia su política CORS o su endpoint, la aplicación mostrará el error y la parte local seguirá disponible.

## Límites profesionales deliberados

- No se afirma que una asignación automática sea infalible.
- Los encabezamientos se verifican contra autoridades LC.
- Las cadenas complejas se prefieren desde MARCXML autorizado.
- La construcción automática de subdivisión geográfica sólo se propone cuando LC indica que el encabezamiento puede subdividirse geográficamente y existe autoridad para el lugar; aun así se pide revisión de SHM.
- Subdivisiones generales o cronológicas que no provengan de una autoridad/cadena establecida no se fabrican automáticamente.
- Para español, el puente automático hacia LCSH usa equivalencias inglesas del Tesauro UNESCO cuando existen; no es una concordancia completa entre ambos vocabularios.
- Para libros escaneados extensos, el OCR integrado es de apoyo. Se recomienda OCR previo de buena calidad o PDF digital.
