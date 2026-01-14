/**
 * ProcessingContext
 *
 * Global context for managing invoice processing state.
 * Allows pages to subscribe to processing completion events to refresh their data.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ProcessingContextValue {
  pendingCount: number;
  isProcessingComplete: boolean;
  setPendingCount: (count: number) => void;
  triggerProcessingComplete: () => void;
  onProcessingComplete: (callback: () => void) => () => void;
  checkPending: () => Promise<void>;
}

const ProcessingContext = createContext<ProcessingContextValue | null>(null);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [callbacks, setCallbacks] = useState<Set<() => void>>(new Set());

  // Register a callback to be called when processing completes
  const onProcessingComplete = useCallback((callback: () => void) => {
    setCallbacks((prev) => {
      const next = new Set(prev);
      next.add(callback);
      return next;
    });

    // Return cleanup function
    return () => {
      setCallbacks((prev) => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  // Trigger processing complete (called by ProcessingIndicator)
  const triggerProcessingComplete = useCallback(() => {
    setIsProcessingComplete(true);

    // Call all registered callbacks
    callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in processing complete callback:", error);
      }
    });

    // Reset after a delay
    setTimeout(() => {
      setIsProcessingComplete(false);
    }, 3000);
  }, [callbacks]);

  // Check pending invoices from API
  // Direct set allows count to decrease when invoices finish processing
  const checkPending = useCallback(async () => {
    try {
      const response = await fetch("/api/invoices/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error checking pending invoices:", error);
    }
  }, []);

  return (
    <ProcessingContext.Provider
      value={{
        pendingCount,
        isProcessingComplete,
        setPendingCount,
        triggerProcessingComplete,
        onProcessingComplete,
        checkPending,
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error("useProcessing must be used within ProcessingProvider");
  }
  return context;
}
