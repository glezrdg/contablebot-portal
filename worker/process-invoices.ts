#!/usr/bin/env tsx
/**
 * Invoice Processing Worker
 *
 * Polls the database for pending invoices and processes them in batches
 * using the Gemini API server. Runs as a separate container from the
 * Next.js portal.
 *
 * Features:
 * - Atomic claiming (no double-processing)
 * - Exponential backoff retries
 * - Graceful shutdown on SIGTERM
 * - No crash loops on transient errors
 */

import { processInvoiceBatch } from '../lib/gemini-client';
import {
  claimPendingInvoices,
  updateInvoices,
  updateFirmUsage,
  markInvoicesAsError,
  type PendingInvoice
} from '../lib/invoice-updater';

const BATCH_SIZE = 5;
const POLL_INTERVAL_MS = 60000; // 1 minute
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

let isShuttingDown = false;

/**
 * Process a batch of pending invoices
 */
async function processPendingInvoices() {
  if (isShuttingDown) {
    console.log('[Worker] Shutdown in progress, skipping new batch');
    return;
  }

  try {
    // 1. Atomically claim invoices (prevents double-processing)
    console.log('[Worker] Claiming pending invoices...');
    const invoices = await claimPendingInvoices(BATCH_SIZE);

    if (invoices.length === 0) {
      console.log('[Worker] No pending invoices');
      return;
    }

    console.log(`[Worker] Claimed ${invoices.length} invoices:`, invoices.map(i => i.id));

    // 2. Process with Gemini (with retries)
    let extracted;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      try {
        extracted = await processInvoiceBatch(invoices);
        break; // Success
      } catch (error) {
        attempts++;
        if (attempts >= MAX_RETRIES) {
          console.error(`[Worker] Failed after ${MAX_RETRIES} attempts:`, error);
          // Mark invoices as error
          await markInvoicesAsError(invoices, error as Error);
          return;
        }

        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempts - 1);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[Worker] Retry ${attempts}/${MAX_RETRIES} after ${delay}ms:`, errorMessage);
        await sleep(delay);
      }
    }

    if (!extracted) {
      console.error('[Worker] No data extracted from Gemini');
      await markInvoicesAsError(invoices, new Error('No data extracted'));
      return;
    }

    // 3. Update database
    console.log('[Worker] Updating invoices in database...');
    await updateInvoices(extracted);

    // 4. Update firm usage counters
    console.log('[Worker] Updating firm usage counters...');
    await updateFirmUsage(invoices);

    console.log(`[Worker] Successfully processed ${invoices.length} invoices`);
  } catch (error) {
    // Non-retryable error - log and continue (don't crash the worker)
    console.error('[Worker] Unexpected error in processing loop:', error);
  }
}

/**
 * Main worker loop
 */
async function main() {
  console.log('[Worker] ====================================');
  console.log('[Worker] Invoice processing worker started');
  console.log('[Worker] ====================================');
  console.log(`[Worker] Polling interval: ${POLL_INTERVAL_MS}ms (${POLL_INTERVAL_MS / 1000}s)`);
  console.log(`[Worker] Batch size: ${BATCH_SIZE}`);
  console.log(`[Worker] Max retries: ${MAX_RETRIES}`);
  console.log(`[Worker] PostgREST URL: ${process.env.POSTGREST_BASE_URL || 'NOT SET'}`);
  console.log(`[Worker] Gemini Batch URL: ${process.env.GEMINI_BATCH_URL || 'NOT SET'}`);
  console.log('[Worker] ====================================\n');

  // Validate environment
  if (!process.env.POSTGREST_BASE_URL) {
    console.error('[Worker] FATAL: POSTGREST_BASE_URL environment variable not set');
    process.exit(1);
  }

  // Graceful shutdown handler for SIGTERM (Docker stop)
  process.on('SIGTERM', () => {
    console.log('\n[Worker] SIGTERM received, gracefully shutting down...');
    isShuttingDown = true;

    // Give time for current batch to finish (max 30s)
    setTimeout(() => {
      console.log('[Worker] Shutdown complete');
      process.exit(0);
    }, 30000);
  });

  // Graceful shutdown handler for SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n[Worker] SIGINT received, gracefully shutting down...');
    isShuttingDown = true;

    setTimeout(() => {
      console.log('[Worker] Shutdown complete');
      process.exit(0);
    }, 30000);
  });

  // Handle uncaught errors without crashing
  process.on('uncaughtException', (error) => {
    console.error('[Worker] Uncaught exception:', error);
    console.error('[Worker] Worker will continue running...');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Worker] Unhandled rejection at:', promise, 'reason:', reason);
    console.error('[Worker] Worker will continue running...');
  });

  // Main polling loop
  const intervalId = setInterval(async () => {
    if (isShuttingDown) {
      clearInterval(intervalId);
      return;
    }

    await processPendingInvoices();
  }, POLL_INTERVAL_MS);

  // Process immediately on startup
  console.log('[Worker] Processing initial batch...\n');
  await processPendingInvoices();
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the worker
main().catch(error => {
  console.error('[Worker] Fatal error in main:', error);
  process.exit(1);
});
