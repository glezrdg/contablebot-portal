# DGII-606 Prompt Changelog

This file documents the evolution of the extraction prompt. The main prompt (`PROMPT_v5.md`) is the consolidated, production-ready version.

---

## v5.3 (Current)
**Determinism fixes** — Removed contradictions.

| Change | Section | Description |
|--------|---------|-------------|
| Confidence Flag Fix | Phase 5 | Low confidence alone no longer triggers FLAG_DUDOSO |
| Retail Tasa Binding | Phase 3 (Retail) | Explicit 0.18/0.16 rate selection for ITBIS calculation |

---

## v5.2
**Retenciones disabled** — Simplified handling.

| Change | Section | Description |
|--------|---------|-------------|
| Retenciones Disabled | Phase 4 + Phase 6 | Always output retención fields as 0.00, flag when payable < facturado |
| New Flag Rule | Flagging Rules | Added "Net Payable Lower" as explicit flag condition |

---

## v5.1
**Edge case fixes** — Four new rules added.

| Addition | Section | Description |
|----------|---------|-------------|
| NCF Prefix Recovery | Phase 1 (OCR) | Recover B from "8" and E from "3" when OCR misreads NCF prefix |
| Payable < Facturado | Phase 4 (Validation) | Handle retenciones when TOTAL A COBRAR < TOTAL FACTURADO |
| Negative ITBIS Guard | Phase 4 (Equation C) | Flag instead of inferring negative ITBIS components |
| Retail Exemption Override | Phase 3 (Retail) | Don't assume EXENTO from food keywords in supermarkets |

---

## v5.0
**Consolidated release** — All patches merged into clean sections.

Changes from v4.5:
- Removed all `(PATCH N)` annotations
- Removed "deployment guardrail" meta-instruction
- Merged all rules into their logical phases
- Removed version history from prompt (moved here)
- Reduced token count by ~30%

---

## v4.5
Deploy-safe consistency fixes.

| Patch | Section | Fix |
|-------|---------|-----|
| PATCH 18 | Retail ITBIS | Added explicit OVERRIDE statement — only calculate ITBIS with tax-rate evidence |
| PATCH 17 | Header | Added deployment guardrail — highest PATCH number wins on conflicts |
| PATCH 16 | RNC Selection | Clarified: apply selection priority BEFORE flagging null |

---

## v4.4
Closed final edge cases for determinism.

| Patch | Section | Fix |
|-------|---------|-----|
| PATCH 15 | Phase 4 | Global base amount candidate priority (not just fuel) |
| PATCH 14 | RNC Extraction | RNC selection priority when multiple 9/11-digit candidates exist |

---

## v4.3
Resolved remaining contradictions and underspecified behaviors.

| Patch | Section | Fix |
|-------|---------|-----|
| PATCH 13 | Back-calculation | Support both 18% and 16% ITBIS rates |
| PATCH 12 | Retail ITBIS | Calculation requires explicit tax-rate evidence |
| PATCH 11 | Fuel | Explicit precedence — Mixed Fuel rules override Pure Fuel rules |

---

## v4.2
Closed remaining production gaps.

| Patch | Section | Fix |
|-------|---------|-----|
| PATCH 10 | Payable handling | Prevent invented propina — only set with explicit evidence |
| PATCH 9 | Mixed fuel | Deterministic allocation for inseparable amounts |
| PATCH 8 | ID rule | Deterministic `id_interna` generation |

Added test cases 6-8.

---

## v4.1
Fixed contradictions and underspecified behaviors.

| Patch | Section | Fix |
|-------|---------|-----|
| PATCH 7 | MATERIALES | Length enforcement with truncation (30-50 chars) |
| PATCH 6 | Flagging | FLAG/RAZON_DUDA consistency enforcement |
| PATCH 5 | Totals | Explicit derived totals rules |
| PATCH 4 | Totals | Total selection priority rules |
| PATCH 3 | Back-calc | Allow ITBIS calculation from computed base |
| PATCH 2 | Tax handling | Deterministic "tax undeterminable" allocation (GRAVADO bucket) |
| PATCH 1 | OCR | NCF prefix protection during sanitization |

Added test cases 1-5.

---

## v4.0
Major production stability release.

- Added ITBIS internal consistency equation (Equation C)
- Added default classification rules for all invoice types
- Fixed "no evidence" handling (don't assume EXENTO blindly)
- Enhanced mixed fuel detection
- Added extraction rules for NOMBRE COMPAÑÍA, MATERIALES, RNC_CLIENTE
- Added mandatory numeric defaults and rounding
- Added sub-total consistency equations

---

## v3.0
Core functionality.

- Batch processing support
- OCR sanitization pipeline
- Mathematical validation equations

---

## v2.0
Basic structure.

- Initial schema definition
- Basic field mapping

---

## v1.0
Initial version.

- Proof of concept
