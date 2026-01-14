# Changelog

All notable changes to ContableBot Portal are documented here.

---

## [2026-01-14] QA Dashboard & Upload Improvements

### QA Dashboard Enhancements

**New Features:**
1. **Invoice Detail Dialog** - Click any invoice in QA table to see full details
2. **Bulk Re-process** - Select multiple flagged invoices and re-process them at once
3. **Context-aware Re-processing** - When re-processing, previous validation issues are passed to Gemini so it pays special attention to previously detected problems

**Files Modified:**
- `pages/dashboard/qa.tsx` - Added detail dialog, bulk reprocess functionality, checkbox selection
- `lib/gemini-client.ts` - Added `qa_feedback` section to Gemini prompt
- `lib/invoice-updater.ts` - Added `qa_feedback` to `PendingInvoice` interface
- `types/index.ts` - Added `qa_feedback` field to Invoice type

**How QA Feedback Works:**
When an invoice is sent for re-processing from QA dashboard:
1. `buildQAFeedback()` creates a string from current validation issues (flag_dudoso, math errors, low confidence)
2. This feedback is stored in `qa_feedback` column
3. Invoice status is reset to `pending`
4. Worker picks it up and includes the feedback in Gemini prompt
5. Gemini sees: `QA_FEEDBACK (PRESTA ATENCION ESPECIAL A ESTOS PROBLEMAS DETECTADOS PREVIAMENTE): [issues]`

---

### Database Migration: qa_feedback Column

**File:** `migrations/003_add_qa_feedback.sql`

**Changes:**
1. Added `qa_feedback TEXT` column to invoices table
2. Updated `claim_pending_invoices` function to return `qa_feedback`

**Important:** The function uses specific column types that must match the actual database:
```sql
RETURNS TABLE (
  id BIGINT,           -- NOT INTEGER!
  firm_id INTEGER,
  user_id BIGINT,      -- NOT INTEGER!
  client_id BIGINT,    -- NOT INTEGER!
  client_name TEXT,
  rnc TEXT,
  raw_ocr_text TEXT,
  retry_count INTEGER,
  qa_feedback TEXT
)
```

**To apply migration:**
```bash
psql -U postgres -d contablebot -f migrations/003_add_qa_feedback.sql
docker restart postgrest-contablebot
```

---

### Upload Limits Optimization

**Rationale:**
- VPS: 2 vCPU, 8GB RAM, 100GB NVMe
- Need to support ~20 concurrent users uploading simultaneously
- Calculation: 20 users × 20 files × 5MB = 2GB (safe for 8GB RAM)

**Final Limits:**
| Setting | Value | Notes |
|---------|-------|-------|
| Max file size | 5MB | Enough for high-res invoice photos (typically 1-2MB) |
| Max files per upload | 20 | Users can do multiple batches if needed |
| Supported formats | JPG, PNG, WEBP, PDF | GIF removed (not useful for invoices) |

**Files Modified:**
- `components/InvoiceUploader.tsx`:
  - `MAX_FILE_SIZE = 5 * 1024 * 1024` (5MB)
  - `MAX_FILES = 20`
  - Frontend validation before upload (type + size)
  - Removed GIF from `validImageTypes`
  - Updated UI text to show new limits

- `pages/api/invoices/upload.ts`:
  - `maxFileSize: 5 * 1024 * 1024` (5MB)
  - `maxFiles: 20`
  - Removed GIF from `validMimeTypes`
  - Updated error messages

**Scaling Path:**
- 16GB RAM → Can increase to 40 files
- 32GB RAM → Can increase to 50+ files

---

### File Validation Flow

**Frontend (`InvoiceUploader.tsx`):**
1. Check file type (JPG, PNG, WEBP, PDF only)
2. Check file size (max 5MB)
3. Check total files (max 20)
4. Show errors for rejected files via alert
5. Create preview URLs for valid files

**Backend (`upload.ts`):**
1. Parse multipart form with formidable (maxFiles: 20, maxFileSize: 5MB)
2. Validate each file (type + size)
3. Extract text via Google Vision (images) or pdf2json/OCR (PDFs)
4. Create invoice records with status='pending'
5. Worker processes asynchronously

---

## Previous Migrations Reference

### Migration 002: increment_firm_usage
**File:** `migrations/002_add_increment_firm_usage.sql`

Atomically increments firm usage counter:
```sql
CREATE OR REPLACE FUNCTION increment_firm_usage(p_firm_id INTEGER, p_increment INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE firms SET used_this_month = COALESCE(used_this_month, 0) + p_increment WHERE id = p_firm_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Architecture Notes

### Invoice Processing Flow
```
User uploads files → Frontend validates → API creates invoice records (status=pending)
                                                    ↓
Worker claims invoices (claim_pending_invoices) → Gemini extracts data → Updates invoice (status=processed)
                                                    ↓
                                              If error: retry_count++ (max 3 retries, 10 min delay)
```

### QA Review Flow
```
Processed invoices → QA Dashboard filters (flag_dudoso, low confidence, math errors)
                          ↓
User reviews → Approve (status=processed) OR Re-process (status=pending + qa_feedback)
                          ↓
                    Worker re-processes with QA feedback context
```

---

## Environment Requirements

- Node.js 18+
- PostgreSQL with PostgREST
- Google Vision API credentials
- Gemini API key
- Ghostscript (optional, for scanned PDF OCR)

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Worker (separate process)
cd worker && npm run dev

# Apply migrations
psql -U postgres -d contablebot -f migrations/003_add_qa_feedback.sql
docker restart postgrest-contablebot
```
