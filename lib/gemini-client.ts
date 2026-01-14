// Gemini Batch API Client
// Calls the existing gemini-batch server (same as n8n workflow)

const GEMINI_BATCH_URL = process.env.GEMINI_BATCH_URL || 'http://gemini-batch:4000/api/gemini-batch';

interface PendingInvoice {
  id: number;
  firm_id: number;
  user_id?: number;
  client_id?: number;
  client_name: string;
  rnc: string;
  raw_ocr_text: string;
  qa_feedback?: string; // Previous QA feedback for re-processing
}

export interface ExtractedInvoiceData {
  id_interna: number;
  RNC: string;
  RNC_CLIENTE: string;
  FECHA: string;
  "NOMBRE COMPAÑÍA": string;
  "NO. COMPROBANTE FISCAL": string;
  "TIPO NCF": string;
  "CATEGORIA NCF": string;
  MATERIALES: string;
  "MONTO EN SERVICIO EXENTO": number;
  "MONTO EN BIEN EXENTO": number;
  "TOTAL DE MONTOS EXENTO": number;
  "MONTO EN SERVICIO GRAVADO": number;
  "MONTO EN BIEN GRAVADO": number;
  "TOTAL DE MONTOS GRAVADO": number;
  "ITBIS SERVICIOS": number;
  "ITBIS COMPRAS BIENES": number;
  "TOTAL FACTURADO EN ITBIS": number;
  "ITBIS SERVICIOS RETENIDO": number;
  "RETENCION 30% ITBIS": number;
  "RETENCION 10%": number;
  "RETENCION 2%": number;
  PROPINA: number;
  "TOTAL FACTURADO": number;
  "TOTAL A COBRAR": number;
  CLASIFICACION_PREDOMINANTE: string;
  CONF_BIEN_SERVICIO: number;
  FLAG_DUDOSO: boolean;
  RAZON_DUDA: string;
}

/**
 * Result of processing a batch of invoices
 */
export interface ProcessBatchResult {
  extracted: ExtractedInvoiceData[];
  rawResponse: string;  // Original JSON string from Gemini for debugging
}

/**
 * Process a batch of invoices through the Gemini API server
 * This uses the same API endpoint that the n8n workflow uses
 * Returns both extracted data and raw response for storage
 */
export async function processInvoiceBatch(invoices: PendingInvoice[]): Promise<ProcessBatchResult> {
  console.log(`[Gemini Client] Processing batch of ${invoices.length} invoices`);

  // Build the exact prompt that n8n uses
  const prompt = buildBatchPrompt(invoices);

  // Call the existing Gemini API server
  const response = await fetch(GEMINI_BATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      invoices
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Parse the response (same as n8n Code node)
  const raw = data.text;
  if (!raw) {
    throw new Error('Gemini API returned empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[Gemini Client] Failed to parse JSON:', raw.substring(0, 500));
    throw new Error(`Failed to parse Gemini response: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Return array of extracted invoices and raw response
  const extracted = Array.isArray(parsed) ? parsed : [parsed];
  console.log(`[Gemini Client] Successfully extracted ${extracted.length} invoices`);

  return {
    extracted,
    rawResponse: raw  // Return raw for storage in raw_ai_dump
  };
}

/**
 * Build the exact prompt that n8n uses (from line 80 of workflow)
 * This is the COMPLETE prompt with all rules and instructions
 */
function buildBatchPrompt(invoices: PendingInvoice[]): string {
  // This is the EXACT header from n8n workflow
  const header = `
Eres un asistente experto en facturas dominicanas (DGII) y REPORTE 606.

Voy a enviarte varias facturas (máximo 5) en TEXTO OCR con ruido. Cada factura vendrá en un bloque separado con este formato:

FACTURA N
ID_INTERNA: <id interno de la factura>
FIRM_ID: <id de la firma> (puede venir vacío)
CLIENTE: <nombre del cliente> (puede venir vacío)
RNC: <RNC detectado previamente o vacío>
TEXTO_OCR:
<texto completo de la factura tal como lo devolvió el OCR>
FIN_FACTURA

Para CADA bloque de factura debes:
1) Usar el valor de ID_INTERNA de ese bloque para llenar el campo "id_interna" del JSON.
2) Ignorar FIRM_ID y CLIENTE como campos de salida (solo son contexto).
3) Tratar el TEXTO_OCR como si fuera el contenido completo de la factura para extraer todos los datos.

🧾 SALIDA ESPERADA (FORMATO MULTI-FACTURA)

Si recibes 1 o varias facturas en el mismo mensaje:
- Debes devolver UN SOLO JSON que sea un ARRAY.
- Cada elemento del array es un objeto que representa UNA factura.
- El orden de los objetos debe coincidir exactamente con el orden de los bloques FACTURA que recibes (FACTURA 1, FACTURA 2, etc.).
- NO debes mezclar información entre facturas.

Ejemplo de estructura (con 2 facturas):

[
  {
    "id_interna": "123",
    ...
  },
  {
    "id_interna": "124",
    ...
  }
]

🛑 REGLAS DE FORMATO CRÍTICAS (MÁXIMA PRIORIDAD):

1. Devuelve SOLO el JSON crudo. NO uses bloques de código markdown (no uses \`\`\`json ... \`\`\`).
2. NO agregues texto, comentarios ni explicaciones antes o después del JSON.
3. SIN SALTOS DE LÍNEA REALES dentro de los valores string.
   - Si en el OCR hay varias líneas en una descripción, únelas con espacios o usa el caracter literal "\\n".
4. ESCAPA LAS COMILLAS internas en strings.
   - Ejemplo: si el texto original tiene: Tuerca "Gigante"
     debes escribirlo como: "Tuerca \\"Gigante\\""
5. El JSON debe ser válido y parseable por JSON.parse().

Debes devolver EXACTAMENTE estas claves para CADA objeto de factura:

{
  "id_interna": "string o número (ID_INTERNA del bloque de factura)",
  "RNC": "string (9 dígitos del proveedor/emisor, solo números) o null",
  "RNC_CLIENTE": "string (9 dígitos del CLIENTE/COMPRADOR, si aparece; si no, null)",
  "FECHA": "string dd/mm/yyyy o null",
  "NOMBRE COMPAÑÍA": "string (proveedor) o null",
  "NO. COMPROBANTE FISCAL": "string (NCF/ECF que empieza con B o E) o null",
  "TIPO NCF": "string (ej: B01, B02, E31, E32, etc.) o null",
  "CATEGORIA NCF": "string (CONSUMO | CREDITO_FISCAL | GUBERNAMENTAL | ESPECIAL | EXPORTACION | OTRO) o null",
  "MATERIALES": "string (descripción abreviada de lo comprado/servicio) o null,

  "MONTO EN SERVICIO EXENTO": "number",
  "MONTO EN BIEN EXENTO": "number",
  "TOTAL DE MONTOS EXENTO": "number",

  "MONTO EN SERVICIO GRAVADO": "number",
  "MONTO EN BIEN GRAVADO": "number",
  "TOTAL DE MONTOS GRAVADO": "number",

  "ITBIS SERVICIOS": "number",
  "ITBIS COMPRAS BIENES": "number",
  "TOTAL FACTURADO EN ITBIS": "number",

  "ITBIS SERVICIOS RETENIDO": "number (poner 0.00)",
  "RETENCION 30% ITBIS": "number (poner 0.00)",
  "RETENCION 10%": "number (poner 0.00)",
  "RETENCION 2%": "number (poner 0.00)",

  "PROPINA": "number",
  "TOTAL FACTURADO": "number",
  "TOTAL A COBRAR": "number",

  "CLASIFICACION_PREDOMINANTE": "BIEN | SERVICIO | MIXTO",
  "CONF_BIEN_SERVICIO": "number entre 0 y 1 (confianza en tu clasificación)",
  "FLAG_DUDOSO": "true o false",
  "RAZON_DUDA": "string breve explicando por qué es dudoso o \\"\\" si no es dudoso"
}

REGLAS GENERALES:

NORMALIZACIÓN DE NÚMEROS

- Usa SIEMPRE punto como separador decimal (ej: 1234.56).
- Si el OCR muestra comas o puntos, interprétalos correctamente:
  - "1,234.56", "1.234,56", "1234,56" → debes inferir el valor numérico correcto.
- Todos los campos numéricos deben ser tipo number (sin comillas).
- Si estás inseguro del monto exacto, marca FLAG_DUDOSO = true y explica en RAZON_DUDA.

RNC

- "RNC" SIEMPRE es el RNC del PROVEEDOR o EMISOR de la factura.
- Busca un bloque de 9 dígitos que parezca RNC del proveedor. Ignora guiones, letras y otros caracteres.
  - Ejemplos válidos: 101234567, 131234567.
- "RNC_CLIENTE": solo si la factura muestra también el RNC del cliente/comprador (cerca de etiquetas como "RNC CLIENTE", "RNC COMPRADOR", "RNC DEL CLIENTE", etc.).
- Ambos deben ser 9 dígitos, sin guiones. Si no estás seguro, deja el campo en null y marca FLAG_DUDOSO = true.

FECHA (dd/mm/yyyy)

- Identifica la FECHA de emisión de la factura, NO la fecha de vencimiento.
- Acepta formatos del OCR como: dd-mm-yy, dd/mm/yy, dd-mm-yyyy, dd/mm/yyyy.
- Convierte SIEMPRE a formato dd/mm/yyyy.
- Si hay varias fechas, elige la que esté más cerca de la cabecera de la factura o junto a palabras como "Fecha", "Emisión".

NCF / ECF

- "NO. COMPROBANTE FISCAL": debe ser un código que empiece con B o E (ej: B0100000001, E3100000001).
- "TIPO NCF": extrae la subcategoría, por ejemplo B01, B02, B14, E31, etc.
- "CATEGORIA NCF":
  - B01, E31 ⇒ "CREDITO_FISCAL"
  - B02 ⇒ "CONSUMO"
  - B14 ⇒ "ESPECIAL"
  - Códigos del Estado ⇒ "GUBERNAMENTAL"
  - Exportaciones ⇒ "EXPORTACION"
  - Si no se puede inferir ⇒ "OTRO".

DETALLE / MATERIALES

- "MATERIALES": resume brevemente el concepto principal (ej: "Combustible gasolina premium", "Servicios de consultoría", "Materiales ferretería", "Almuerzo restaurante").
- Puedes usar nombre del proveedor + palabras clave del detalle cuando el OCR sea muy ruidoso.

TOTALES BÁSICOS

Debes identificar, a partir del texto de la factura:

- TOTAL A COBRAR (total final a pagar por el cliente, incluyendo ITBIS y propina si aplica).
- SUBTOTAL GRAVADO (base imponible sujeta a ITBIS).
- SUBTOTAL EXENTO (base exenta de ITBIS, si la hay).
- ITBIS TOTAL.
- PROPINA (si aparece como concepto separado).

Reglas:

A) Si el documento trae la estructura clara:
   - Usa los subtotales indicados (Sub-Total Gravado, Sub-Total Exento, etc.).

B) Si NO está clara la separación exento/gravado:
   - Asume que TODO lo gravable está en la base imponible principal.

C) Si NO aparece ITBIS pero NO dice EXENTO:
   - Asume ITBIS estándar 18%:
     - SUBTOTAL_GRAVADO_APROX = TOTAL_SIN_PROPINA / 1.18
     - ITBIS_TOTAL_APROX = TOTAL_SIN_PROPINA - SUBTOTAL_GRAVADO_APROX

D) Si el documento dice explícitamente EXENTO o ITBIS 0.00:
   - ITBIS_TOTAL = 0.00
   - Toda la base imponible se considera EXENTA (SUBTOTAL_EXENTO = TOTAL_SIN_PROPINA).

E) Tickets de supermercado/tienda con letras C, D, E e ITBIS por tasa (ejemplo):
   - "Items con C gravados con 16.00 % ITBIS"
   - "Items con D gravados con 18.00 % ITBIS"
   - "ITBIS 16.00 % 131.04"
   - "ITBIS 18.00 % 210.05"
   - "TOTAL ITBIS 341.09"

   Considera que:
   - C y D ⇒ ÍTEMS GRAVADOS (con diferentes tasas de ITBIS).
   - E ⇒ ÍTEMS EXENTOS de ITBIS.

   Si se muestran líneas como "ITBIS 16%" y "ITBIS 18%":
   - Suma todos esos valores para obtener "TOTAL FACTURADO EN ITBIS".

   Si no hay un SUBTOTAL GRAVADO explícito, puedes aproximarlo como:
   - BASE_16 ≈ ITBIS_16 / 0.16
   - BASE_18 ≈ ITBIS_18 / 0.18
   - SUBTOTAL_GRAVADO ≈ BASE_16 + BASE_18

   Los ítems marcados como E o indicados como exentos (por ejemplo, columna de valor 0.00 con letra E o leyenda "Items con E exentos de ITBIS") se consideran parte del SUBTOTAL_EXENTO.

   En supermercados/colmados/tiendas donde SOLO se venden productos (comida, artículos, etc.), asume que:
   - Todo ITBIS va en "ITBIS COMPRAS BIENES".
   - "ITBIS SERVICIOS" = 0.00.

   La PROPINA:
   - Si aparece "PROPINA", "10% ley", "cargo por servicio" como renglón aparte, extrae ese monto en "PROPINA".
   - Si no aparece, "PROPINA" = 0.00.

CLASIFICACIÓN BIEN vs SERVICIO (CASOS MIXTOS)

Tu objetivo es llenar los 4 campos de base imponible:

- "MONTO EN SERVICIO EXENTO"
- "MONTO EN BIEN EXENTO"
- "TOTAL DE MONTOS EXENTO"
- "MONTO EN SERVICIO GRAVADO"
- "MONTO EN BIEN GRAVADO"
- "TOTAL DE MONTOS GRAVADO"

A) Identifica primero si hay BIENES, SERVICIOS o ambos (MIXTO):

BIEN:
- combustible, gasolina, gasoil, diésel, diesel, GLP, gas, lubricantes, aceites, carburante
- mercancía, productos, artículos, insumos, piezas, repuestos
- materiales ferretería: cemento, varilla, arena, bloques, pintura, tubos, cables, tornillos, etc.
- alimentos, bebidas, abarrotes, comestibles de supermercados, colmados, tiendas de alimentos.

SERVICIO:
- mano de obra, instalación, mantenimiento, reparación, consultoría, honorarios
- alquiler, renta, arrendamiento
- transporte, flete, envío, delivery
- publicidad, marketing, diseño, seguridad, vigilancia, internet, telefonía, software, suscripción
- servicios de restaurantes, bares, hoteles, spa (aunque incluyan comida/bebida).

- Si hay SOLO términos de BIENES ⇒ "CLASIFICACION_PREDOMINANTE" = "BIEN".
- Si hay SOLO términos de SERVICIOS ⇒ "CLASIFICACION_PREDOMINANTE" = "SERVICIO".
- Si hay mezcla (por ejemplo, "mano de obra" + "piezas") ⇒ "CLASIFICACION_PREDOMINANTE" = "MIXTO".

B) Distribución de montos:

- Si el detalle trae montos claramente separados por línea (mano de obra vs materiales) y puedes asociar montos a BIEN/SERVICIO:
  - Suma montos de líneas de SERVICIOS EXENTOS ⇒ "MONTO EN SERVICIO EXENTO".
  - Suma montos de líneas de BIENES EXENTOS ⇒ "MONTO EN BIEN EXENTO".
  - Suma montos de líneas de SERVICIOS GRAVADOS ⇒ "MONTO EN SERVICIO GRAVADO".
  - Suma montos de líneas de BIENES GRAVADOS ⇒ "MONTO EN BIEN GRAVADO".

- Si NO puedes separar claramente los montos de BIEN y SERVICIO:
  - Usa "CLASIFICACION_PREDOMINANTE" para decidir.
  - Si predominan servicios/trabajos ⇒ trata TODA la base imponible como SERVICIO.
  - Si predominan materiales/productos ⇒ trata TODA la base imponible como BIEN.

  En ese caso:
  - Si la factura es gravada:
    - Llena SOLO "MONTO EN SERVICIO GRAVADO" o "MONTO EN BIEN GRAVADO" (según corresponda).
    - Los otros tres montos (EXENTO/otro tipo) = 0.00.
  - Si la factura es exenta:
    - Llena SOLO "MONTO EN SERVICIO EXENTO" o "MONTO EN BIEN EXENTO".

C) EXENTO vs GRAVADO:

- Si una línea o sección dice explícitamente "Exento" o "No grava ITBIS":
  - Su monto va a las columnas EXENTO (BIEN o SERVICIO según corresponda).
- Si una línea tiene ITBIS calculado:
  - Su base imponible va a las columnas GRAVADO (BIEN o SERVICIO).
- Si no puedes distinguir a nivel de líneas:
  - Decide a nivel global:
    - Si hay ITBIS > 0 ⇒ asume que la base principal es GRAVADA.
    - Si ITBIS = 0 y NO hay indicio de exención parcial ⇒ toda la base es EXENTA.

D) Cálculos internos:

- "TOTAL DE MONTOS EXENTO" = "MONTO EN SERVICIO EXENTO" + "MONTO EN BIEN EXENTO".
- "TOTAL DE MONTOS GRAVADO" = "MONTO EN SERVICIO GRAVADO" + "MONTO EN BIEN GRAVADO".
- "TOTAL FACTURADO EN ITBIS" = "ITBIS SERVICIOS" + "ITBIS COMPRAS BIENES".

E) REGLA DURA PARA COMBUSTIBLE (MUY IMPORTANTE):

- Todo lo relacionado con combustible (gasolina, gasoil, diésel, diesel, GLP, gas, lubricantes, aceites, carburante, fuel oil) SIEMPRE se considera BIEN, NUNCA SERVICIO.
- Aunque la factura diga "servicio de combustible", "consumo de combustible" u otra palabra similar:
  - La base imponible va SOLO en "MONTO EN BIEN GRAVADO" o "MONTO EN BIEN EXENTO" (según tenga ITBIS o no).
  - "MONTO EN SERVICIO EXENTO" y "MONTO EN SERVICIO GRAVADO" = 0.00.
  - "CLASIFICACION_PREDOMINANTE" = "BIEN".
  - "CONF_BIEN_SERVICIO" debe ser ≥ 0.9.
  - El ITBIS correspondiente debe ir en "ITBIS COMPRAS BIENES" (no en "ITBIS SERVICIOS").

F) ITBIS SERVICIOS vs ITBIS COMPRAS BIENES:

- Si la factura es principalmente de productos/mercancías (supermercados, colmados, ferreterías, farmacias, combustibles, etc.):
  - Todo el ITBIS debe ir en "ITBIS COMPRAS BIENES".
  - "ITBIS SERVICIOS" = 0.00.

- Si la factura es principalmente de servicios (restaurantes, hoteles, consultorías, publicidad, transporte, etc.):
  - Todo el ITBIS debe ir en "ITBIS SERVICIOS".
  - "ITBIS COMPRAS BIENES" = 0.00.

- Solo si hay evidencia muy clara de que se facturan bienes y servicios por separado con diferentes ITBIS:
  - Puedes dividir el ITBIS proporcionalmente entre "ITBIS SERVICIOS" y "ITBIS COMPRAS BIENES".

TOTAL FACTURADO y TOTAL A COBRAR

- "TOTAL FACTURADO" = "TOTAL DE MONTOS EXENTO" + "TOTAL DE MONTOS GRAVADO" + "TOTAL FACTURADO EN ITBIS".
- "TOTAL A COBRAR" = "TOTAL FACTURADO" + "PROPINA" - "RETENCION 30% ITBIS" - "RETENCION 10%" - "RETENCION 2%".

En esta implementación SIEMPRE debes poner:

- "ITBIS SERVICIOS RETENIDO" = 0.00
- "RETENCION 30% ITBIS" = 0.00
- "RETENCION 10%" = 0.00
- "RETENCION 2%" = 0.00

FLAGS DE CALIDAD

- "CONF_BIEN_SERVICIO":
  - 1.0 si estás totalmente seguro de la clasificación y separación de montos.
  - 0.5 si estás medianamente seguro.
  - <0.4 si la clasificación es muy incierta.

- "FLAG_DUDOSO":
  - true si:
    - No pudiste identificar claramente BIEN/SERVICIO.
    - No estás seguro de si hay partes exentas/gravadas.
    - Los totales no parecen consistentes.
  - false si todo cuadra razonablemente.

- "RAZON_DUDA":
  - Explica en 1–2 frases cortas por qué marcaste FLAG_DUDOSO = true.
  - Si FLAG_DUDOSO = false, deja "RAZON_DUDA": "".

RECUERDA:
- Para cada bloque FACTURA, genera un objeto de salida independiente y colócalo en el array final.
- Usa los nombres de claves EXACTAMENTE como se especifican.
- No incluyas ningún texto fuera del JSON del array.
`;

  // Build body parts (exact format from n8n)
  const bodyParts = invoices.map((inv, index) => {
    // Include QA feedback if present (for re-processing)
    const qaSection = inv.qa_feedback
      ? `\nQA_FEEDBACK (PRESTA ATENCION ESPECIAL A ESTOS PROBLEMAS DETECTADOS PREVIAMENTE):
${inv.qa_feedback}
`
      : '';

    return `
===== FACTURA ${index + 1} INICIO =====
ID_INTERNA: ${inv.id}
FIRM_ID: ${inv.firm_id}
CLIENTE: ${inv.client_name || ''}
RNC: ${inv.rnc || ''}${qaSection}
TEXTO_OCR:
${inv.raw_ocr_text}
===== FACTURA ${index + 1} FIN =====
`;
  });

  return header + "\n" + bodyParts.join("\n");
}
