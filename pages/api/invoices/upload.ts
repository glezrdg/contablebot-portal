// POST /api/invoices/upload - Upload multiple invoice images/PDFs with OCR processing
import type { NextApiRequest, NextApiResponse } from "next"
import { IncomingForm, Fields, Files, File as FormidableFile } from "formidable"
import { readFileSync } from "fs"
import { requireAuth } from "@/lib/auth"
import { extractTextFromImage } from "@/lib/google-vision"
import type { ErrorResponse } from "@/types"
import PDFParser from "pdf2json"
import { fromPath } from "pdf2pic"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

// Disable Next.js body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
}

interface UploadedInvoice {
  id: number
  filename: string
  success: boolean
  error?: string
}

interface UploadResponse {
  invoices: UploadedInvoice[]
  totalUploaded: number
  totalFailed: number
}

/**
 * Parse multipart form data
 */
function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10, // Max 10 files per upload
      keepExtensions: true,
    })

    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

/**
 * Convert file to base64
 */
function fileToBase64(file: FormidableFile): string {
  const buffer = readFileSync(file.filepath)
  return buffer.toString("base64")
}

/**
 * Validate file (images and PDFs)
 */
function validateFile(file: FormidableFile): { valid: boolean; error?: string } {
  const validMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ]

  if (!file.mimetype || !validMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Tipo de archivo inválido. Solo se aceptan imágenes (JPG, PNG, WEBP, GIF) y PDFs",
    }
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Archivo muy grande. El tamaño máximo es 10MB",
    }
  }

  return { valid: true }
}

/**
 * Try to extract text from PDF using pdf2json (for searchable PDFs)
 */
function tryExtractTextFromPDF(file: FormidableFile): Promise<{ success: boolean; text?: string; isScanned?: boolean }> {
  return new Promise((resolve) => {
    console.log("[PDF] Trying pdf2json extraction for:", file.originalFilename)

    const pdfParser = new PDFParser()

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log("[PDF] pdf2json timeout reached")
      resolve({ success: false, isScanned: true })
    }, 15000)

    pdfParser.on("pdfParser_dataError", () => {
      clearTimeout(timeout)
      console.log("[PDF] pdf2json error, will try OCR")
      resolve({ success: false, isScanned: true })
    })

    pdfParser.on("pdfParser_dataReady", (pdfData: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
      clearTimeout(timeout)
      try {
        console.log("[PDF] Document loaded, pages:", pdfData.Pages?.length || 0)

        // Extract text from all pages
        let fullText = ""
        for (let i = 0; i < (pdfData.Pages?.length || 0); i++) {
          const page = pdfData.Pages[i]
          const pageText = page.Texts?.map((textItem) => {
            return textItem.R?.map((r) => decodeURIComponent(r.T)).join("") || ""
          }).join(" ") || ""
          fullText += pageText + "\n"
        }

        const trimmedText = fullText.trim()
        console.log("[PDF] pdf2json extracted text length:", trimmedText.length)

        if (!trimmedText || trimmedText.length < 50) {
          // Less than 50 chars likely means scanned PDF
          console.log("[PDF] Insufficient text, treating as scanned PDF - will fallback to OCR")
          resolve({ success: false, isScanned: true })
          return
        }

        console.log("[PDF] pdf2json success, extracted", trimmedText.length, "characters")
        resolve({ success: true, text: trimmedText })
      } catch (err) {
        console.log("[PDF] pdf2json processing error:", err, "- will try OCR")
        resolve({ success: false, isScanned: true })
      }
    })

    pdfParser.loadPDF(file.filepath)
  })
}

/**
 * Extract text from PDF file - tries pdf2json first, falls back to image conversion + OCR
 */
async function extractTextFromPDF(file: FormidableFile): Promise<{ success: boolean; text?: string; error?: string }> {
  console.log("[PDF] Starting extraction for:", file.originalFilename)

  // First try pdf2json for searchable PDFs
  const pdfResult = await tryExtractTextFromPDF(file)

  if (pdfResult.success && pdfResult.text) {
    return { success: true, text: pdfResult.text }
  }

  // For scanned PDFs: Convert to images and OCR each page
  console.log("[PDF] Falling back to image conversion + OCR for scanned PDF")

  try {
    // Configure pdf2pic converter (uses Ghostscript backend)
    const converter = fromPath(file.filepath, {
      density: 200,          // DPI for OCR quality
      saveFilename: "page",
      savePath: "./",        // Not used since we use base64
      format: "png",
      width: 1600,
      height: 2400,
    })

    // Convert all pages to base64
    console.log("[PDF] Converting PDF to images...")
    const pages = await converter.bulk(-1, { responseType: "base64" })

    console.log("[PDF] Converted to", pages.length, "images")

    if (pages.length === 0) {
      return {
        success: false,
        error: "No se pudieron extraer páginas del PDF.",
      }
    }

    let fullText = ""
    for (let i = 0; i < pages.length; i++) {
      console.log(`[PDF] OCR processing page ${i + 1}/${pages.length}`)
      const base64 = pages[i].base64
      if (!base64) continue

      const ocrResult = await extractTextFromImage(base64)
      if (ocrResult.success) {
        fullText += ocrResult.text + "\n"
      }
    }

    if (!fullText.trim()) {
      return {
        success: false,
        error: "No se pudo extraer texto del PDF escaneado.",
      }
    }

    console.log("[PDF] OCR complete, extracted", fullText.length, "characters")
    return { success: true, text: fullText.trim() }
  } catch (error) {
    console.error("[PDF] Image conversion error:", error)

    // Check if the error is due to Ghostscript not being installed
    const errorMsg = error instanceof Error ? error.message : "Unknown"
    if (errorMsg.includes("EOF") || errorMsg.includes("ENOENT") || errorMsg.includes("spawn")) {
      return {
        success: false,
        error: "El servidor no puede procesar PDFs escaneados. Ghostscript no está instalado. Por favor, sube la factura como imagen (JPG, PNG).",
      }
    }

    return {
      success: false,
      error: "Error al procesar el PDF escaneado: " + errorMsg,
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>
) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Método no permitido" })
  }

  // Validate environment
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined")
    return res.status(500).json({ error: "Error de configuración del servidor" })
  }

  // Require authentication
  const session = requireAuth(req, res)
  if (!session) return

  try {
    // Parse multipart form data
    const { files } = await parseForm(req)

    // Get uploaded files
    const uploadedFiles = files.images
    if (!uploadedFiles) {
      return res.status(400).json({ error: "No se recibieron archivos" })
    }

    // Ensure files is an array
    const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]

    if (fileArray.length === 0) {
      return res.status(400).json({ error: "No se recibieron archivos" })
    }

    if (fileArray.length > 10) {
      return res.status(400).json({ error: "Máximo 10 archivos por carga" })
    }

    // Get user's active client from portal_users table
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}&select=active_client_id`
    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    if (!userResponse.ok) {
      return res.status(500).json({ error: "Error al obtener información del usuario" })
    }

    const users = await userResponse.json()
    if (!users || users.length === 0 || !users[0].active_client_id) {
      return res.status(400).json({
        error: "Debes seleccionar un cliente activo antes de subir facturas",
      })
    }

    const activeClientId = users[0].active_client_id

    // Get client details by ID
    const clientUrl = `${POSTGREST_BASE_URL}/clients?id=eq.${activeClientId}&firm_id=eq.${session.firmId}&select=id,name,rnc`
    const clientResponse = await fetch(clientUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    if (!clientResponse.ok) {
      return res.status(500).json({ error: "Error al obtener información del cliente" })
    }

    const clients = await clientResponse.json()
    if (!clients || clients.length === 0) {
      return res.status(400).json({
        error: "Cliente activo no encontrado. Por favor selecciona un cliente válido.",
      })
    }

    const client = clients[0]
    const activeClientRnc = client.rnc

    // Process each file
    const results: UploadedInvoice[] = []
    let totalFailed = 0

    for (const file of fileArray) {
      const filename = file.originalFilename || "unknown"

      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          results.push({
            id: 0,
            filename,
            success: false,
            error: validation.error,
          })
          totalFailed++
          continue
        }

        // Extract text based on file type
        let extractedText: string
        const isPDF = file.mimetype === "application/pdf"

        if (isPDF) {
          // Extract text from PDF
          const pdfResult = await extractTextFromPDF(file)
          if (!pdfResult.success) {
            results.push({
              id: 0,
              filename,
              success: false,
              error: pdfResult.error || "Error al procesar el PDF",
            })
            totalFailed++
            continue
          }
          extractedText = pdfResult.text!
        } else {
          // Extract text from image using Google Vision
          const base64 = fileToBase64(file)
          const ocrResult = await extractTextFromImage(base64)

          if (!ocrResult.success) {
            results.push({
              id: 0,
              filename,
              success: false,
              error: ocrResult.error || "Error al procesar la imagen",
            })
            totalFailed++
            continue
          }
          extractedText = ocrResult.text!
        }

        // Create invoice record
        const invoiceUrl = `${POSTGREST_BASE_URL}/invoices`
        const invoiceResponse = await fetch(invoiceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            firm_id: session.firmId,
            client_id: client.id,
            client_name: client.name,
            rnc: activeClientRnc,
            raw_ocr_text: extractedText,
            status: "pending",
            fecha: new Date().toISOString().split("T")[0], // Today's date as placeholder
            ncf: "", // Empty for now, will be extracted by AI
            total_facturado: 0, // Placeholder, will be extracted by AI
          }),
        })

        if (!invoiceResponse.ok) {
          const errorText = await invoiceResponse.text()
          console.error("Error creating invoice:", invoiceResponse.status, errorText)
          results.push({
            id: 0,
            filename,
            success: false,
            error: "Error al crear el registro de factura",
          })
          totalFailed++
          continue
        }

        const invoices = await invoiceResponse.json()
        const invoice = invoices[0]

        results.push({
          id: invoice.id,
          filename,
          success: true,
        })
      } catch (error) {
        console.error("Error processing file:", filename, error)
        results.push({
          id: 0,
          filename,
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
        totalFailed++
      }
    }

    // Usage counter is updated by the worker when invoices are processed
    const successCount = results.length - totalFailed

    return res.status(200).json({
      invoices: results,
      totalUploaded: successCount,
      totalFailed,
    })
  } catch (error) {
    console.error("Error in /api/invoices/upload:", error)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}
