/**
 * Google Vision API Wrapper
 *
 * Provides OCR (Optical Character Recognition) functionality using Google Cloud Vision API.
 * Extracts text from invoice images for processing.
 */

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate'

export interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string
      boundingPoly?: {
        vertices: Array<{ x: number; y: number }>
      }
    }>
    fullTextAnnotation?: {
      text: string
    }
    error?: {
      code: number
      message: string
      status: string
    }
  }>
}

export interface OcrResult {
  success: boolean
  text: string
  error?: string
}

/**
 * Extract text from an image using Google Vision API
 *
 * @param base64Image - Base64-encoded image data (without data:image prefix)
 * @returns Extracted text or error message
 *
 * @example
 * const base64 = 'iVBORw0KGgoAAAANSUhEUgAA...' // base64 image data
 * const result = await extractTextFromImage(base64)
 * if (result.success) {
 *   console.log('Extracted text:', result.text)
 * } else {
 *   console.error('OCR failed:', result.error)
 * }
 */
export async function extractTextFromImage(base64Image: string): Promise<OcrResult> {
  // Validate API key
  if (!GOOGLE_VISION_API_KEY) {
    return {
      success: false,
      text: '',
      error: 'Google Vision API key not configured'
    }
  }

  // Clean base64 string (remove data:image prefix if present)
  const cleanBase64 = base64Image
    .replace(/^data:.*;base64,/, '')
    .replace(/\s/g, '')

  try {
    // Call Google Vision API
    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: cleanBase64 },
            features: [{ type: 'TEXT_DETECTION' }],
            imageContext: { languageHints: ['es', 'en'] } // Spanish and English for Dominican invoices
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        text: '',
        error: `Google Vision API error (${response.status}): ${errorText}`
      }
    }

    const data: VisionApiResponse = await response.json()

    // Check for API-level errors
    const apiResponse = data.responses[0]
    if (apiResponse?.error) {
      return {
        success: false,
        text: '',
        error: `Vision API error: ${apiResponse.error.message} (${apiResponse.error.status})`
      }
    }

    // Extract text from response
    // Use fullTextAnnotation.text for complete text, or first textAnnotation description
    const extractedText =
      apiResponse?.fullTextAnnotation?.text ||
      apiResponse?.textAnnotations?.[0]?.description ||
      ''

    if (!extractedText) {
      return {
        success: false,
        text: '',
        error: 'No text found in image'
      }
    }

    return {
      success: true,
      text: extractedText
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      text: '',
      error: `Failed to process image: ${errorMessage}`
    }
  }
}

/**
 * Convert File/Blob to base64 string
 * Utility function for client-side usage
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const result = reader.result as string
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate if an image is suitable for OCR
 * Checks file size and type
 */
export function validateImageForOcr(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo inválido. Solo se aceptan imágenes (JPG, PNG, WEBP, GIF)'
    }
  }

  // Check file size (max 10MB for Google Vision API)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Archivo muy grande. El tamaño máximo es 10MB'
    }
  }

  return { valid: true }
}
