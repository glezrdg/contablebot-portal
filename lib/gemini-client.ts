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
  // Enhanced prompt with OCR error correction, concrete examples, and validation rules
  const header = `
Eres un asistente experto en facturas dominicanas (DGII) y REPORTE 606.

══════════════════════════════════════════════════════════════════════════════
⚡ JERARQUÍA DE PRIORIDAD (LEE PRIMERO)
══════════════════════════════════════════════════════════════════════════════

Cuando haya conflicto entre reglas, aplica este orden de prioridad:

1. REGLAS DE FORMATO JSON (máxima prioridad) - Si el JSON es inválido, nada funciona
2. VALIDACIÓN MATEMÁTICA - Los números deben sumar correctamente
3. RNC/NCF OBLIGATORIOS - Sin estos campos, la factura es inutilizable para DGII
4. CLASIFICACIÓN BIEN/SERVICIO - Afecta columnas del 606
5. OTROS CAMPOS - Fecha, materiales, etc.

🔴 SIEMPRE:
- Antes de devolver el JSON, VERIFICA que total_facturado = total_exento + total_gravado + total_itbis (tolerancia: $1.00)
- Si un campo crítico (RNC, NCF) es ilegible después de corrección OCR, FLAG_DUDOSO = true
- Todos los campos numéricos deben tener valor (usa 0.00 si no aplica, NUNCA null para números)

🔴 NUNCA:
- NUNCA inventes números que no están en el OCR
- NUNCA dejes campos numéricos como null o string (usa 0.00)
- NUNCA marques FLAG_DUDOSO = true solo porque el OCR es ruidoso (si puedes extraer los datos, no es dudoso)
- NUNCA uses bloques de código markdown (\`\`\`json)

══════════════════════════════════════════════════════════════════════════════
🔧 CORRECCIÓN DE ERRORES OCR
══════════════════════════════════════════════════════════════════════════════

El texto OCR frecuentemente confunde caracteres similares. APLICA ESTAS CORRECCIONES:

NÚMEROS vs LETRAS (tabla de confusiones):
┌─────────────┬─────────────┬──────────────────────────────────────┐
│ OCR muestra │ Correcto    │ Contexto                             │
├─────────────┼─────────────┼──────────────────────────────────────┤
│ O (letra)   │ 0 (cero)    │ En RNC, NCF, montos                  │
│ l (ele min) │ 1 (uno)     │ En RNC, NCF, montos                  │
│ I (i may)   │ 1 (uno)     │ En RNC, NCF, montos                  │
│ S (ese)     │ 5 (cinco)   │ En montos numéricos                  │
│ B (be)      │ 8 (ocho)    │ En RNC, montos (NO en NCF que usa B) │
│ G (ge)      │ 6 (seis)    │ En montos numéricos                  │
│ Z (zeta)    │ 2 (dos)     │ En montos numéricos                  │
│ | (pipe)    │ 1 (uno)     │ En cualquier contexto numérico       │
└─────────────┴─────────────┴──────────────────────────────────────┘

EJEMPLOS DE CORRECCIÓN:
| OCR Original       | Corregido       | Razón                               |
|--------------------|-----------------|-------------------------------------|
| RNC: 1O2318131     | 102318131       | O → 0 (RNC son solo dígitos)        |
| NCF: B01OOOOO123   | B0100000123     | O → 0 después de B01                |
| Total: l,234.S6    | 1,234.56        | l→1, S→5 en contexto numérico       |
| RNC: I30I23456     | 130123456       | I→1 (RNC de 9 dígitos)              |
| ITBIS: $2O5.OO     | 205.00          | O→0 en monto con símbolo $          |
| NCF: BO100000123   | B0100000123     | O→0 (el tipo es B01, no BO1)        |
| RNC: lOl895744     | 101895744       | l→1, O→0 alternados                 |

CONTEXTO CRÍTICO:
- Si aparece "RNC:" o "R.N.C." seguido de caracteres, asume que son 9 DÍGITOS
- Si aparece "NCF:" o "e-NCF" seguido de B/E + caracteres, asume patrón de NCF
- Si aparece "$" o "RD$" seguido de caracteres, asume que es un MONTO NUMÉRICO
- Los NCF SIEMPRE empiezan con B o E real (no confundir con 8)

══════════════════════════════════════════════════════════════════════════════
📋 FORMATO DE ENTRADA
══════════════════════════════════════════════════════════════════════════════

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
  "MATERIALES": "string (descripción abreviada de lo comprado/servicio) o null",

  "MONTO EN SERVICIO EXENTO": number,
  "MONTO EN BIEN EXENTO": number,
  "TOTAL DE MONTOS EXENTO": number,

  "MONTO EN SERVICIO GRAVADO": number,
  "MONTO EN BIEN GRAVADO": number,
  "TOTAL DE MONTOS GRAVADO": number,

  "ITBIS SERVICIOS": number,
  "ITBIS COMPRAS BIENES": number,
  "TOTAL FACTURADO EN ITBIS": number,

  "ITBIS SERVICIOS RETENIDO": number (siempre 0.00),
  "RETENCION 30% ITBIS": number (siempre 0.00),
  "RETENCION 10%": number (siempre 0.00),
  "RETENCION 2%": number (siempre 0.00),

  "PROPINA": number,
  "TOTAL FACTURADO": number,
  "TOTAL A COBRAR": number,

  "CLASIFICACION_PREDOMINANTE": "BIEN" | "SERVICIO" | "MIXTO",
  "CONF_BIEN_SERVICIO": number (0 a 1),
  "FLAG_DUDOSO": boolean,
  "RAZON_DUDA": string (vacío "" si no es dudoso)
}

══════════════════════════════════════════════════════════════════════════════
📝 REGLAS DE EXTRACCIÓN POR CAMPO
══════════════════════════════════════════════════════════════════════════════

NORMALIZACIÓN DE NÚMEROS

- Usa SIEMPRE punto como separador decimal (ej: 1234.56).
- Si el OCR muestra comas o puntos, interprétalos según contexto dominicano:
  - "1,234.56" → 1234.56 (coma es separador de miles)
  - "1.234,56" → 1234.56 (punto es separador de miles, coma decimal - formato europeo)
  - "1234,56" → 1234.56 (sin separador de miles, coma decimal)
  - "1,234" → puede ser 1234 o 1.234, usa el contexto (si hay ITBIS de $222, entonces probablemente 1234)
- Todos los campos numéricos deben ser tipo number (SIN comillas).
- Si estás inseguro del monto exacto, marca FLAG_DUDOSO = true y explica en RAZON_DUDA.

RNC (9 DÍGITOS - OBLIGATORIO)

- "RNC" SIEMPRE es el RNC del PROVEEDOR o EMISOR de la factura (quien emite la factura).
- Busca un bloque de 9 dígitos que parezca RNC del proveedor. Ignora guiones, letras y otros caracteres.
- APLICA CORRECCIÓN OCR: Si ves "RNC: 1O1895744", corrige a "101895744" (O→0).
- Ejemplos válidos: 101234567, 131234567, 401234567.
- Prefijos comunes: 1XX (empresas antiguas), 4XX (empresas nuevas), 130 (personas físicas negocio).
- "RNC_CLIENTE": solo si la factura muestra TAMBIÉN el RNC del cliente/comprador (cerca de etiquetas como "RNC CLIENTE", "RNC COMPRADOR", "RNC DEL CLIENTE", "ADQUIRIENTE", etc.).
- Ambos deben ser 9 dígitos, sin guiones.
- Si después de corrección OCR no puedes obtener 9 dígitos válidos, deja null y FLAG_DUDOSO = true.

FECHA (dd/mm/yyyy)

- Identifica la FECHA de emisión de la factura, NO la fecha de vencimiento.
- Acepta formatos del OCR como: dd-mm-yy, dd/mm/yy, dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd.
- Convierte SIEMPRE a formato dd/mm/yyyy.
- Si hay varias fechas, elige la que esté más cerca de:
  - Palabras: "Fecha", "Emisión", "Fecha de emisión", "Emitido", "Date"
  - La cabecera de la factura (primeras líneas)
- Si el año es de 2 dígitos (ej: 25), asume 20XX (2025, no 1925).

NCF / ECF (COMPROBANTE FISCAL - OBLIGATORIO)

Formato estricto:
- NCF tradicional: B + 2 dígitos tipo + 8 dígitos secuencia = 11 caracteres (ej: B0100000001)
- e-NCF electrónico: E + 2 dígitos tipo + 10 dígitos secuencia = 13 caracteres (ej: E310000000001)

APLICA CORRECCIÓN OCR:
- "NCF: BO100000123" → "B0100000123" (O→0 después de B)
- "NCF: B01OOOOO123" → "B0100000123" (múltiples O→0)
- "NCF: BOl00000123" → "B0100000123" (O→0, l→1)

Tabla de tipos y categorías:
┌──────┬─────────────────────────────┬────────────────────┐
│ Tipo │ Descripción                 │ CATEGORIA NCF      │
├──────┼─────────────────────────────┼────────────────────┤
│ B01  │ Crédito Fiscal              │ CREDITO_FISCAL     │
│ B02  │ Consumidor Final            │ CONSUMO            │
│ B04  │ Notas de Crédito            │ OTRO               │
│ B14  │ Régimen Especial Tributario │ ESPECIAL           │
│ B15  │ Gubernamental               │ GUBERNAMENTAL      │
│ B16  │ Exportaciones               │ EXPORTACION        │
│ E31  │ e-CF Crédito Fiscal         │ CREDITO_FISCAL     │
│ E32  │ e-CF Consumidor Final       │ CONSUMO            │
│ E33  │ e-Notas de Débito           │ OTRO               │
│ E34  │ e-Notas de Crédito          │ OTRO               │
│ E41  │ e-Compras                   │ OTRO               │
│ E43  │ e-Gastos Menores            │ OTRO               │
│ E44  │ e-Régimen Especial          │ ESPECIAL           │
│ E45  │ e-Gubernamental             │ GUBERNAMENTAL      │
└──────┴─────────────────────────────┴────────────────────┘

Si el tipo no está en la tabla, usa "OTRO".

DETALLE / MATERIALES

- "MATERIALES": resume brevemente el concepto principal (máx 50 caracteres).
- Ejemplos: "Combustible gasolina premium", "Servicios de consultoría", "Materiales ferretería", "Almuerzo restaurante".
- Puedes usar nombre del proveedor + palabras clave del detalle cuando el OCR sea muy ruidoso.

══════════════════════════════════════════════════════════════════════════════
📊 EJEMPLOS CONCRETOS DE EXTRACCIÓN
══════════════════════════════════════════════════════════════════════════════

EJEMPLO 1: FACTURA DE COMBUSTIBLE (⚠️ SIEMPRE BIEN EXENTO - Art. 343)
─────────────────────────────────────────────────────────────────────────────
TEXTO OCR:
"ISLA DOMINICANA DE PETROLEO S A
RNC: lOl89S744
NCF: BO1OO4S9823
Fecha: lS/Ol/2O2S
Gasolina Premium 9S: lO.S galones x $267.SO = $2,8O8.7S
TOTAL: $2,8O8.7S"

NOTA: El OCR mostraba "ITBIS 18%: $505.58" pero fue un ERROR del cajero.
      El combustible está EXENTO de ITBIS según Artículo 343 de DGII.

EXTRACCIÓN CORRECTA (con correcciones OCR aplicadas):
{
  "id_interna": 123,
  "RNC": "101895744",           ← l→1, O→0, S→5
  "FECHA": "15/01/2025",        ← l→1, O→0, S→5
  "NO. COMPROBANTE FISCAL": "B0100459823",  ← O→0, S→5
  "TIPO NCF": "B01",
  "CATEGORIA NCF": "CREDITO_FISCAL",
  "MATERIALES": "Combustible gasolina premium",
  "MONTO EN BIEN EXENTO": 2808.75,     ← TODO en BIEN EXENTO (combustible = EXENTO Art. 343)
  "MONTO EN SERVICIO EXENTO": 0,
  "MONTO EN BIEN GRAVADO": 0,          ← CERO (combustible NO es gravado)
  "MONTO EN SERVICIO GRAVADO": 0,
  "TOTAL DE MONTOS EXENTO": 2808.75,
  "TOTAL DE MONTOS GRAVADO": 0,
  "ITBIS COMPRAS BIENES": 0,           ← CERO (combustible EXENTO, sin ITBIS)
  "ITBIS SERVICIOS": 0,
  "TOTAL FACTURADO EN ITBIS": 0,
  "PROPINA": 0,
  "TOTAL FACTURADO": 2808.75,          ← 2808.75 + 0 + 0 = 2808.75 ✓
  "TOTAL A COBRAR": 2808.75,
  "CLASIFICACION_PREDOMINANTE": "BIEN",
  "CONF_BIEN_SERVICIO": 0.99,          ← Alta confianza (combustible siempre BIEN)
  "FLAG_DUDOSO": false,
  "RAZON_DUDA": ""
}

⚠️ REGLA CRÍTICA PARA COMBUSTIBLE:
- Combustible, gasolina, gasoil, diesel, GLP, gas, fuel oil → SIEMPRE BIEN EXENTO
- Aunque el cajero haya cobrado ITBIS por error, debes clasificarlo como EXENTO
- Si ves ITBIS en factura de combustible → ignorar, usar MONTO EN BIEN EXENTO con ITBIS = 0

EJEMPLO 2: RESTAURANTE CON PROPINA (SERVICIO)
─────────────────────────────────────────────────────────────────────────────
TEXTO OCR:
"RESTAURANTE EL MESON SRL
RNC: 130012345
NCF: B0200001234
Fecha: 20/01/2025
Almuerzo Ejecutivo x2         $890.00
ITBIS 18%                     $160.20
Subtotal                      $1,050.20
Propina 10% ley               $105.02
TOTAL A PAGAR                 $1,155.22"

EXTRACCIÓN CORRECTA:
{
  "RNC": "130012345",
  "MONTO EN SERVICIO GRAVADO": 890.00,  ← TODO en SERVICIO (restaurante)
  "MONTO EN BIEN GRAVADO": 0,
  "ITBIS SERVICIOS": 160.20,            ← ITBIS en SERVICIOS
  "ITBIS COMPRAS BIENES": 0,
  "TOTAL FACTURADO EN ITBIS": 160.20,
  "PROPINA": 105.02,                    ← Propina separada
  "TOTAL FACTURADO": 1050.20,           ← 890 + 160.20 = 1050.20 (sin propina)
  "TOTAL A COBRAR": 1155.22,            ← 1050.20 + 105.02 = 1155.22 ✓
  "CLASIFICACION_PREDOMINANTE": "SERVICIO",
  "CONF_BIEN_SERVICIO": 0.95
}

EJEMPLO 3: SUPERMERCADO CON MÚLTIPLES TASAS ITBIS (C, D, E)
─────────────────────────────────────────────────────────────────────────────
TEXTO OCR:
"SUPERMERCADO NACIONAL
RNC: 101012345
NCF: B0200098765
Items C (16%): $500.00    ITBIS: $80.00
Items D (18%): $300.00    ITBIS: $54.00
Items E (Exentos): $200.00
ITBIS TOTAL: $134.00
TOTAL: $1,134.00"

EXTRACCIÓN CORRECTA:
{
  "RNC": "101012345",
  "MONTO EN BIEN GRAVADO": 800.00,      ← $500 + $300 (C + D son gravados)
  "MONTO EN BIEN EXENTO": 200.00,       ← Items E son exentos
  "MONTO EN SERVICIO GRAVADO": 0,       ← Supermercado = solo BIENES
  "MONTO EN SERVICIO EXENTO": 0,
  "TOTAL DE MONTOS GRAVADO": 800.00,
  "TOTAL DE MONTOS EXENTO": 200.00,
  "ITBIS COMPRAS BIENES": 134.00,       ← Todo ITBIS en BIENES (supermercado)
  "ITBIS SERVICIOS": 0,
  "TOTAL FACTURADO EN ITBIS": 134.00,
  "TOTAL FACTURADO": 1134.00,           ← 800 + 200 + 134 = 1134 ✓
  "CLASIFICACION_PREDOMINANTE": "BIEN",
  "CONF_BIEN_SERVICIO": 0.98
}

EJEMPLO 4: TALLER MECÁNICO MIXTO (MANO DE OBRA + PIEZAS)
─────────────────────────────────────────────────────────────────────────────
TEXTO OCR:
"TALLER AUTOMOTRIZ PEREZ
RNC: 131234567
NCF: B0100012345
Mano de obra reparación       $1,500.00
Filtro de aceite              $350.00
Aceite sintético 4L           $650.00
Subtotal                      $2,500.00
ITBIS 18%                     $450.00
TOTAL                         $2,950.00"

EXTRACCIÓN CORRECTA (montos separables):
{
  "RNC": "131234567",
  "MONTO EN SERVICIO GRAVADO": 1500.00,  ← Mano de obra = SERVICIO
  "MONTO EN BIEN GRAVADO": 1000.00,      ← Filtro + Aceite = BIENES
  "TOTAL DE MONTOS GRAVADO": 2500.00,
  "ITBIS SERVICIOS": 270.00,             ← 1500 * 0.18 = 270
  "ITBIS COMPRAS BIENES": 180.00,        ← 1000 * 0.18 = 180
  "TOTAL FACTURADO EN ITBIS": 450.00,    ← 270 + 180 = 450 ✓
  "TOTAL FACTURADO": 2950.00,            ← 2500 + 450 = 2950 ✓
  "CLASIFICACION_PREDOMINANTE": "MIXTO",
  "CONF_BIEN_SERVICIO": 0.85             ← Menor confianza por ser mixto
}

══════════════════════════════════════════════════════════════════════════════
🏢 PATRONES DE PROVEEDORES CONOCIDOS
══════════════════════════════════════════════════════════════════════════════

Usa estos patrones para clasificación automática con alta confianza:

⛽ SIEMPRE BIEN EXENTO (combustible - Art. 343) - CONF >= 0.99:
- Palabras clave: gasolina, gasoil, diesel, diésel, GLP, combustible, lubricante, petróleo, fuel, carburante, gas
- Proveedores: ISLA, SHELL, TOTAL, TEXACO, SUNIX, TROPIGAS, PROPAGAS, DELTA, ESSO
- ⚠️ CRÍTICO: Combustible SIEMPRE es BIEN EXENTO (Art. 343 DGII)
- Incluso si dice "servicio de combustible" → es BIEN (no servicio)
- Incluso si factura muestra ITBIS → ignorar, es EXENTO (error del cajero)
- Clasificación: MONTO EN BIEN EXENTO, ITBIS = 0.00

🛒 SIEMPRE BIEN (comercios) - CONF >= 0.90:
- Palabras clave: supermercado, colmado, farmacia, ferretería, tienda, almacén, distribuidora
- Proveedores: NACIONAL, LA SIRENA, JUMBO, CARREFOUR, PRICEMART, BRAVO, OLE, CCN
- Items con códigos C, D, E (tasas ITBIS) → típico de supermercados
- NOTA: Pueden tener items EXENTOS (alimentos básicos) y GRAVADOS (procesados) mixtos

🍽️ SIEMPRE SERVICIO GRAVADO (restaurantes/hoteles) - CONF >= 0.90:
- Palabras clave: restaurante, hotel, bar, cafetería, comedor, buffet, catering, banquete
- Si tiene PROPINA o "10% ley" o "cargo por servicio" → probablemente restaurante/bar
- Aunque incluyan comida/bebida, es SERVICIO de alimentación (no bien)
- Clasificación: MONTO EN SERVICIO GRAVADO + ITBIS SERVICIOS

💼 SIEMPRE SERVICIO GRAVADO (profesionales) - CONF >= 0.92:
- Palabras clave: consultoría, asesoría, legal, abogado, contador, arquitecto, ingeniero, auditoría
- Honorarios profesionales, servicios técnicos
- Clasificación: MONTO EN SERVICIO GRAVADO + ITBIS SERVICIOS

📱 SIEMPRE SERVICIO GRAVADO (telecomunicaciones) - CONF >= 0.95:
- Proveedores: CLARO, ALTICE, WIND TELECOM, TRILOGY
- Palabras: telefonía, internet, cable, datos móviles, plan, fibra óptica
- Clasificación: MONTO EN SERVICIO GRAVADO + ITBIS SERVICIOS

🏥 SIEMPRE SERVICIO EXENTO (salud/educación) - CONF >= 0.92:
- Salud: médico, doctor, clínica, hospital, dentista, laboratorio, rayos X, ecografía
- Educación: escuela, colegio, universidad, academia, matrícula, curso
- Clasificación: MONTO EN SERVICIO EXENTO, ITBIS = 0.00

🔧 POSIBLEMENTE MIXTO:
- Talleres mecánicos (mano de obra SERVICIO + piezas BIEN)
- Construcción (materiales BIEN + instalación SERVICIO)
- Si hay líneas separadas, intenta distribuir montos
- Si no puedes separar, usa el monto mayor para decidir predominante

══════════════════════════════════════════════════════════════════════════════
🔍 DETECCIÓN DE BIENES Y SERVICIOS EXENTOS (Artículos 343 y 344 DGII)
══════════════════════════════════════════════════════════════════════════════

Esta sección es CRÍTICA para clasificar correctamente entre EXENTO y GRAVADO.
Basada en regulaciones oficiales de DGII (Ley 11-92, modificada por Ley 253-12).

TASAS OFICIALES DE ITBIS:
- 18% → Tasa general para bienes y servicios gravados
- 16% → Tasa reducida para: productos lácteos, café, grasas comestibles, azúcares, cacao, chocolate
- 0% → Bienes y servicios EXENTOS (listados abajo)

═══════════════════════════════════════════════════════════════════════════════
BIENES EXENTOS (Art. 343) - deben ir en "MONTO EN BIEN EXENTO" con ITBIS = 0
═══════════════════════════════════════════════════════════════════════════════

🥖 ALIMENTOS BÁSICOS (fresh/sin procesar):
- Carnes frescas: pollo, res, cerdo, cordero, conejo
- Pescados y mariscos comunes (no importados/exóticos)
- Embutidos básicos: salchichas, jamón, mortadela
- Leche fresca, miel, huevos
- Legumbres: habichuelas, lentejas, guandules, garbanzos
- Vegetales frescos: lechuga, tomate, cebolla, ají, yuca, etc.
- Tubérculos: papa, yautía, batata, ñame
- Frutas frescas sin procesar: plátano, guineo, mango, naranja, etc.
- Cereales: arroz, avena, maíz
- Harinas en general, pan, pasta
- Salsa de tomate
- Comida para bebés
- Productos de molinería

Palabras clave de EXENCIÓN:
- "fresco", "natural", "sin procesar", "crudo", "básico"
- "habichuelas", "arroz", "harina", "pan", "leche", "huevos"

⚠️ NO son exentos (GRAVADOS 18%):
- Alimentos procesados/empacados: snacks, galletas, jugos embotellados
- Comidas preparadas/congeladas
- Refrescos, sodas, bebidas azucaradas
- Productos importados gourmet

💊 MEDICINAS Y EQUIPO MÉDICO:
- Todos los medicamentos (antibióticos, analgésicos, antiinflamatorios, etc.)
- Prótesis articulares
- Sillas de ruedas
- Equipo médico especializado
- Material de curación

Palabras clave: "medicina", "medicamento", "farmacia", "antibiótico", "analgésico", "tabletas", "cápsulas", "jarabe", "prótesis", "silla de ruedas"

⛽ COMBUSTIBLES (CRÍTICO - Art. 343):
- Gasolina (regular, premium, super)
- Gasoil, diesel, diésel
- GLP (gas licuado de petróleo)
- Gas natural
- Fuel oil, carburante
- Lubricantes, aceites de motor

⚠️ REGLA ABSOLUTA:
- TODOS los combustibles son EXENTOS de ITBIS
- Si ves ITBIS en factura de combustible → es ERROR del cajero, ignorar
- Clasificación: "MONTO EN BIEN EXENTO" + "ITBIS COMPRAS BIENES" = 0.00
- NUNCA clasificar combustible como GRAVADO, aunque muestre ITBIS

🌱 PRODUCTOS AGRÍCOLAS E INSUMOS:
- Plantas para siembra
- Semillas
- Fertilizantes, abonos
- Insecticidas, fungicidas, herbicidas
- Insumos para ganado
- Productos de finca/rancho sin procesar

Palabras clave: "semilla", "fertilizante", "abono", "insecticida", "finca", "cosecha", "siembra"

═══════════════════════════════════════════════════════════════════════════════
SERVICIOS EXENTOS (Art. 344) - deben ir en "MONTO EN SERVICIO EXENTO" con ITBIS = 0
═══════════════════════════════════════════════════════════════════════════════

🏥 SERVICIOS DE SALUD:
- Consultas médicas (general, especializada)
- Servicios dentales
- Laboratorios clínicos
- Rayos X, ecografías, tomografías
- Hospitalización
- Cirugías
- Terapias (física, respiratoria, etc.)
- Servicios de gimnasio (salud preventiva)

Palabras clave: "médico", "doctor", "clínica", "hospital", "dentista", "odontólogo", "laboratorio", "análisis", "radiografía", "ecografía", "consulta", "terapia", "gimnasio", "rehabilitación"

🎓 SERVICIOS EDUCATIVOS Y CULTURALES:
- Matrícula escolar
- Colegiaturas
- Cursos universitarios
- Academia, capacitación
- Servicios culturales (museos, teatro, conciertos educativos)

Palabras clave: "escuela", "colegio", "universidad", "academia", "matrícula", "curso", "educación", "capacitación", "formación", "cultural"

💰 SERVICIOS FINANCIEROS:
- Servicios bancarios
- Seguros (vida, salud, vehículo, propiedad)
- Pensiones, AFP
- Préstamos, financiamiento
- Inversiones

Palabras clave: "banco", "seguro", "pensión", "AFP", "préstamo", "financiamiento", "crédito", "inversión", "fondo"

🚌 TRANSPORTE TERRESTRE:
- Autobús, guagua
- Taxi, Uber, Cabify
- Carga terrestre, flete terrestre
- Transporte de pasajeros

Palabras clave: "autobús", "guagua", "taxi", "Uber", "transporte", "flete terrestre", "carga terrestre", "pasajeros"

⚠️ NO incluye transporte aéreo ni marítimo (esos son GRAVADOS)

⚡ SERVICIOS PÚBLICOS:
- Electricidad (EDEESTE, EDENORTE, EDESUR)
- Agua potable (CAASD, CORAASAN, etc.)
- Recolección de basura
- Alcantarillado

Palabras clave: "electricidad", "luz", "agua", "basura", "recolección", "alcantarillado", "EDEESTE", "EDENORTE", "EDESUR"

🏠 ALQUILER RESIDENCIAL:
- Alquiler de casa
- Alquiler de apartamento
- Alquiler de vivienda

Palabras clave: "alquiler vivienda", "alquiler casa", "alquiler apartamento", "renta residencial"

⚠️ NO incluye alquiler comercial (oficinas, locales) → esos son GRAVADOS

💇 SERVICIOS DE CUIDADO PERSONAL:
- Peluquería, salón de belleza
- Barbería
- Servicios funerarios

Palabras clave: "peluquería", "salón", "belleza", "barbería", "barbero", "corte de pelo", "funeral", "funeraria"

═══════════════════════════════════════════════════════════════════════════════
BIENES Y SERVICIOS GRAVADOS (lo que NO está en listas de exentos)
═══════════════════════════════════════════════════════════════════════════════

BIENES GRAVADOS 18% (general):
- Alimentos procesados, empacados, importados
- Bebidas alcohólicas, refrescos
- Electrónica, electrodomésticos
- Ropa, calzado
- Muebles, decoración
- Materiales de construcción (cemento, varillas, bloques, etc.)
- Productos manufacturados
- Tabaco, cigarrillos

BIENES GRAVADOS 16% (tasa reducida):
- Productos lácteos (quesos, yogurt, etc. - procesados)
- Café procesado
- Grasas comestibles
- Azúcares
- Cacao y productos de chocolate

SERVICIOS GRAVADOS 18%:
- Restaurantes, bares, hoteles (comida/bebida como servicio)
- Profesionales: abogados, contadores, arquitectos, ingenieros
- Telecomunicaciones: teléfono, internet, cable, datos móviles
- Publicidad, marketing
- Servicios de construcción
- Reparaciones técnicas
- Alquiler de equipos (no residencial)
- Entretenimiento (cine, parques, eventos no culturales)

═══════════════════════════════════════════════════════════════════════════════
LÓGICA DE DECISIÓN EXENTO vs GRAVADO
═══════════════════════════════════════════════════════════════════════════════

PASO 1: Identifica el tipo de bien o servicio
- Lee el "NOMBRE COMPAÑÍA" y "MATERIALES"
- Busca palabras clave en las listas de EXENTOS

PASO 2: Verifica el ITBIS en la factura
- Si ITBIS = 0 Y el producto/servicio está en lista de EXENTOS → usar columnas EXENTO
- Si ITBIS > 0 Y el producto NO está en lista de EXENTOS → usar columnas GRAVADO
- Si ITBIS > 0 PERO el producto SÍ está en lista de EXENTOS (ej: combustible) → IGNORAR el ITBIS, usar EXENTO

PASO 3: Casos especiales
- Supermercados: pueden tener mezcla de EXENTOS (alimentos básicos) y GRAVADOS (procesados)
- Farmacias: medicinas EXENTAS, pero también venden cosméticos/snacks GRAVADOS
- Combustible: SIEMPRE EXENTO, sin excepción

PASO 4: Aplicar tasa correcta si es GRAVADO
- Verificar si aplica 16% (dairy, coffee, fats, sugars, cocoa, chocolate)
- Si no aplica 16%, usar 18% (tasa general)

═══════════════════════════════════════════════════════════════════════════════
EJEMPLOS DE CLASIFICACIÓN
═══════════════════════════════════════════════════════════════════════════════

✅ BIEN EXENTO:
- "Arroz blanco 5 lb" → EXENTO (alimento básico)
- "Gasolina premium 10 galones" → EXENTO (combustible Art. 343)
- "Paracetamol 500mg" → EXENTO (medicina)
- "Semillas de tomate" → EXENTO (insumo agrícola)

✅ BIEN GRAVADO 18%:
- "Coca-Cola 2L" → GRAVADO (bebida procesada)
- "Laptop HP" → GRAVADO (electrónica)
- "Cemento gris" → GRAVADO (construcción)
- "Galletas Oreo" → GRAVADO (alimento procesado)

✅ BIEN GRAVADO 16%:
- "Queso cheddar procesado" → GRAVADO 16% (producto lácteo)
- "Café molido Café Santo Domingo" → GRAVADO 16% (café procesado)
- "Chocolate Hershey's" → GRAVADO 16% (chocolate)

✅ SERVICIO EXENTO:
- "Consulta médica general" → EXENTO (salud)
- "Matrícula escolar" → EXENTO (educación)
- "Seguro de vehículo" → EXENTO (financiero)
- "Pasaje guagua Santo Domingo-Santiago" → EXENTO (transporte terrestre)

✅ SERVICIO GRAVADO 18%:
- "Almuerzo en restaurante" → GRAVADO (alimentación como servicio)
- "Plan de internet Altice Fibra" → GRAVADO (telecomunicaciones)
- "Honorarios abogado" → GRAVADO (profesional)
- "Mantenimiento aire acondicionado" → GRAVADO (técnico)

══════════════════════════════════════════════════════════════════════════════
💰 CÁLCULO DE TOTALES
══════════════════════════════════════════════════════════════════════════════

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

⚠️ IMPORTANTE: Antes de clasificar, consulta la sección "DETECCIÓN DE EXENTOS" arriba para determinar si el bien/servicio es EXENTO o GRAVADO según Artículos 343-344 DGII.

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

E) REGLA ABSOLUTA PARA COMBUSTIBLE (CRÍTICA - Art. 343 DGII):

- Todo lo relacionado con combustible (gasolina, gasoil, diésel, diesel, GLP, gas, lubricantes, aceites, carburante, fuel oil) SIEMPRE se considera BIEN EXENTO, NUNCA SERVICIO, NUNCA GRAVADO.
- Combustible está EXENTO de ITBIS por Artículo 343 de DGII (0% tasa).
- Aunque la factura diga "servicio de combustible" → es BIEN (no servicio).
- Aunque la factura muestre ITBIS cobrado → IGNORAR (error del cajero), clasificar como EXENTO.
- Clasificación OBLIGATORIA:
  - La base imponible va SOLO en "MONTO EN BIEN EXENTO".
  - "MONTO EN BIEN GRAVADO" = 0.00 (combustible NO es gravado).
  - "MONTO EN SERVICIO EXENTO" y "MONTO EN SERVICIO GRAVADO" = 0.00.
  - "ITBIS COMPRAS BIENES" = 0.00 (combustible exento, sin ITBIS).
  - "ITBIS SERVICIOS" = 0.00.
  - "CLASIFICACION_PREDOMINANTE" = "BIEN".
  - "CONF_BIEN_SERVICIO" debe ser ≥ 0.99.

⚠️ ATENCIÓN: Si ves una factura de combustible con ITBIS, es un ERROR. Debes corregirlo clasificando como EXENTO.

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

══════════════════════════════════════════════════════════════════════════════
✅ AUTO-VERIFICACIÓN MATEMÁTICA (EJECUTA ANTES DE DEVOLVER)
══════════════════════════════════════════════════════════════════════════════

ANTES de devolver el JSON, ejecuta estas verificaciones mentalmente:

VERIFICACIÓN 1: Totales Exentos
TOTAL DE MONTOS EXENTO = MONTO EN SERVICIO EXENTO + MONTO EN BIEN EXENTO
→ Si no cuadra: corrige los valores individuales

VERIFICACIÓN 2: Totales Gravados
TOTAL DE MONTOS GRAVADO = MONTO EN SERVICIO GRAVADO + MONTO EN BIEN GRAVADO
→ Si no cuadra: corrige los valores individuales

VERIFICACIÓN 3: Total ITBIS
TOTAL FACTURADO EN ITBIS = ITBIS SERVICIOS + ITBIS COMPRAS BIENES
→ Si no cuadra: corrige los valores individuales

VERIFICACIÓN 4: Total Facturado (CRÍTICO - tolerancia $1.00)
TOTAL FACTURADO = TOTAL DE MONTOS EXENTO + TOTAL DE MONTOS GRAVADO + TOTAL FACTURADO EN ITBIS
→ Si la diferencia es > $1.00: revisa todos los componentes
→ Si la diferencia es <= $1.00: acepta (redondeo normal)

VERIFICACIÓN 5: Total A Cobrar
TOTAL A COBRAR = TOTAL FACTURADO + PROPINA - (todas las retenciones)
→ En esta implementación, retenciones = 0, así que:
→ TOTAL A COBRAR = TOTAL FACTURADO + PROPINA

VERIFICACIÓN 6: ITBIS vs Base Gravada (consistencia lógica)
- Si ITBIS > 0, entonces TOTAL DE MONTOS GRAVADO debe ser > 0
- Si TOTAL DE MONTOS GRAVADO > 0 y ITBIS = 0, probablemente debería ser exento → mover a EXENTO
- ITBIS típico 18%: verifica que ITBIS ≈ GRAVADO × 0.18 (tolerancia 5%)

SI ALGO NO CUADRA:
1. Revisa si hay errores de OCR en los montos
2. Verifica que no hayas mezclado exento con gravado
3. Si no puedes reconciliar después de revisar, FLAG_DUDOSO = true y explica en RAZON_DUDA

══════════════════════════════════════════════════════════════════════════════
📄 MANEJO DE FACTURAS INCOMPLETAS O TRUNCADAS
══════════════════════════════════════════════════════════════════════════════

Si el OCR parece estar truncado o incompleto, sigue estas reglas:

SEÑALES DE FACTURA INCOMPLETA:
- Falta RNC del proveedor pero hay otros datos
- Falta NCF pero hay totales
- Hay "..." o texto cortado al final
- Los totales no aparecen
- Falta la fecha completamente
- El texto termina abruptamente en medio de una línea

ESTRATEGIA PARA FACTURAS INCOMPLETAS:

1. Extrae todo lo que puedas con confianza
2. Para campos faltantes:
   - Campos críticos (RNC, NCF): deja como null, FLAG_DUDOSO = true
   - Campos numéricos: si no hay indicio del valor, usa 0.00
   - RAZON_DUDA = "Factura incompleta: [especifica qué falta]"

3. NUNCA:
   - No inventes un RNC o NCF que no está en el documento
   - No estimes totales que no están en el documento
   - No asumas que los campos faltantes son 0 si deberían tener valor

EJEMPLO DE FACTURA INCOMPLETA:
Si solo ves "Total: $1,500.00" sin desglose de ITBIS:
- Puedes estimar: GRAVADO = $1,271.19, ITBIS = $228.81 (usando 18%)
- PERO marca FLAG_DUDOSO = true
- RAZON_DUDA = "ITBIS estimado al 18%, no aparece desglose en factura"

══════════════════════════════════════════════════════════════════════════════
🚩 REGLAS MEJORADAS PARA FLAG_DUDOSO
══════════════════════════════════════════════════════════════════════════════

MARCA FLAG_DUDOSO = true SOLO en estos casos específicos:

CASOS OBLIGATORIOS (siempre marcar):
1. RNC no encontrado o ilegible (después de corrección OCR)
2. NCF no encontrado o formato inválido (después de corrección OCR)
3. Fecha no encontrada
4. Totales matemáticos no cuadran (diferencia > $1.00)
5. Factura claramente incompleta/truncada
6. Múltiples RNC en la misma factura (¿cuál es el proveedor?)
7. El documento NO parece ser una factura fiscal (es un recibo, cotización, etc.)
8. ITBIS estimado porque no aparece en documento

NO MARQUES FLAG_DUDOSO por:
- OCR ruidoso pero datos extraíbles después de corrección
- Pequeñas variaciones de redondeo (<= $1.00)
- Falta de detalle de líneas (si hay totales claros)
- Formato de fecha diferente (si pudiste parsearlo)
- Nombre de compañía parcial o ruidoso
- Clasificación BIEN/SERVICIO clara pero no 100% segura

ESCALA DE CONF_BIEN_SERVICIO:

| Rango     | Significado                                    | Ejemplo                                    |
|-----------|------------------------------------------------|--------------------------------------------|
| 0.95-1.00 | Totalmente seguro                              | Combustible, restaurante obvio             |
| 0.85-0.94 | Alta confianza                                 | Supermercado, consultoría clara            |
| 0.70-0.84 | Confianza moderada                             | Mixto con líneas separadas                 |
| 0.50-0.69 | Adivinanza educada                             | Texto ambiguo, podría ser cualquiera       |
| < 0.50    | Muy incierto → considera FLAG_DUDOSO = true    | No hay contexto suficiente                 |

RAZON_DUDA - EJEMPLOS:

❌ MAL (demasiado vago):
- "Datos confusos"
- "No estoy seguro"
- "OCR ruidoso"

✅ BIEN (específico y accionable):
- "RNC 13O123456 no tiene 9 dígitos después de corrección OCR (8 dígitos)"
- "NCF B0l00000123 contiene caracteres no numéricos después de B01"
- "Total $1,500 no coincide con suma de componentes ($1,480), diferencia $20"
- "Factura truncada: no aparece total ni ITBIS"
- "No se puede determinar si es BIEN o SERVICIO, texto solo dice 'Varios'"
- "ITBIS estimado 18% porque no aparece línea de impuesto"

══════════════════════════════════════════════════════════════════════════════
📌 RESUMEN FINAL
══════════════════════════════════════════════════════════════════════════════

RECUERDA:
1. Para cada bloque FACTURA, genera un objeto de salida independiente y colócalo en el array final.
2. Usa los nombres de claves EXACTAMENTE como se especifican.
3. No incluyas ningún texto fuera del JSON del array.
4. Aplica corrección OCR ANTES de extraer valores (O→0, l→1, etc.).
5. Verifica matemáticas ANTES de devolver (tolerancia $1.00).
6. FLAG_DUDOSO solo para problemas reales, no por ruido cosmético.
7. RAZON_DUDA debe ser específica y útil para revisión humana.
8. Combustible SIEMPRE es BIEN, aunque diga "servicio de combustible".
9. Restaurantes/hoteles SIEMPRE son SERVICIO, aunque incluyan comida.

Si sigues estas reglas, producirás extracciones precisas y consistentes para el Reporte 606.
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
