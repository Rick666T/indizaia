# IndizaIA

Asistente web académico para análisis documental, indización, autoridades de la Library of Congress y salida MARC. Diseñado para alojarse como sitio estático en **GitHub Pages**.

## Funciones principales

- Consulta de DOI e ISBN en **Crossref REST API**.
- Lectura local de PDF con **PDF.js**.
- OCR local opcional con **Tesseract.js** para escaneos sin capa de texto.
- Extracción explicable de términos candidatos.
- Consulta de **LCSH / LCNAF / LCGFT** mediante `ID.LOC.GOV`.
- Recuperación de forma autorizada, variantes, relaciones, notas de alcance y fuentes 670 cuando están disponibles.
- Uso prioritario del **MARCXML oficial de la autoridad** para conservar subcampos e indicadores al transformar el campo 1XX de autoridad en el acceso bibliográfico 6XX correspondiente.
- Propuesta del campo MARC 6XX correspondiente y señalización de los casos que requieren revisión.
- Palabras clave libres con salida MARC 653.
- Consulta del **Tesauro de la UNESCO** mediante SPARQL y salida con `$2 unescot`.
- El PDF no se guarda ni se envía a los servicios externos.

## Publicar en GitHub Pages (método sencillo)

1. Crea un repositorio nuevo en GitHub, por ejemplo `indizaia`.
2. Descarga/descomprime esta carpeta y sube **todo su contenido** al repositorio conservando la carpeta `js`.
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`.
6. Pulsa **Save**. GitHub mostrará la dirección pública del sitio cuando termine el despliegue.

No se necesita Node.js, base de datos ni servidor propio.

## Uso recomendado

Para análisis temático profesional, preferir PDF digital con capa de texto. Un escaneo con OCR deficiente puede alterar nombres, fechas y conceptos; por eso los casos con baja cobertura textual se marcan para revisión.

## Importante sobre la asignación profesional

IndizaIA **no sustituye el juicio del catalogador**. El Subject Headings Manual contiene reglas generales y numerosas instrucciones especiales. La aplicación automatiza la evidencia, el control de autoridad y parte de la codificación que puede verificarse con seguridad, pero marca como `Revisión MARC` cualquier caso en el que no pueda derivarse de forma inequívoca un indicador, una subdivisión o una regla especial.

## Privacidad

El PDF se procesa en memoria dentro del navegador. Las consultas a servicios externos envían únicamente:

- Crossref: DOI o ISBN.
- Library of Congress: términos candidatos o URI de autoridad.
- UNESCO: términos candidatos.

El texto completo del PDF no se envía a esos servicios.

## Fuentes normativas y servicios

- Library of Congress Subject Headings / Subject Headings Manual: https://www.loc.gov/aba/publications/FreeSHM/freeshm.html
- MARC 21 Bibliographic: https://www.loc.gov/marc/bibliographic/
- ID.LOC.GOV: https://id.loc.gov/
- Crossref REST API: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
- UNESCO Vocabulary Services: https://vocabularies.unesco.org/

## Créditos de datos

El Tesauro de la UNESCO se publica bajo **CC BY-SA 3.0 IGO**. La aplicación consulta sus servicios en línea y muestra su URI de concepto.
