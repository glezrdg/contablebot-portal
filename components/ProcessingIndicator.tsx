/**
 * ProcessingIndicator Component
 *
 * Global floating indicator that shows when invoices are being processed.
 * Persists across page navigation and checks for pending invoices on mount.
 * Shows success animation when processing completes.
 */

import { useEffect, useState } from "react";
import { FileText, X, CheckCircle2 } from "lucide-react";
import { useProcessing } from "@/contexts/ProcessingContext";

interface ProcessingIndicatorProps {
  onDismiss?: () => void;
}

export default function ProcessingIndicator({ onDismiss }: ProcessingIndicatorProps) {
  const { setPendingCount: setContextPendingCount, triggerProcessingComplete } = useProcessing();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [previousCount, setPreviousCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for pending invoices
  const checkPendingInvoices = async () => {
    try {
      const response = await fetch("/api/invoices/pending");
      if (response.ok) {
        const data = await response.json();
        const newCount = data.count || 0;

        // Detect processing completion
        if (previousCount > 0 && newCount === 0) {
          // Show success animation
          setShowSuccess(true);
          triggerProcessingComplete();

          // Hide success animation after 2 seconds, then hide component
          setTimeout(() => {
            setShowSuccess(false);
            setPendingCount(0);
            setContextPendingCount(0);
          }, 2000);
        } else {
          setPendingCount(newCount);
          setContextPendingCount(newCount);
        }

        setPreviousCount(newCount);
      }
    } catch (error) {
      console.error("Error checking pending invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkPendingInvoices();
  }, []);

  // Poll for updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(checkPendingInvoices, 15000);
    return () => clearInterval(interval);
  }, [previousCount]);

  // Don't show if no pending invoices and not showing success
  if (loading || (pendingCount === 0 && !showSuccess)) {
    return null;
  }

  // Success animation
  if (showSuccess) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-green-500/90 backdrop-blur-sm border border-green-400/30 rounded-xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">
                ¡Procesamiento completo!
              </h3>
              <p className="text-white/90 text-xs">
                Todas las facturas han sido procesadas exitosamente
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed state
  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
      >
        <div className="bg-primary/90 backdrop-blur-sm border border-primary/30 rounded-full p-3 shadow-lg hover:bg-primary transition-all animate-pulse">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-white font-medium text-sm">{pendingCount}</span>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-primary/90 backdrop-blur-sm border border-primary/30 rounded-xl shadow-2xl p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <h3 className="text-white font-semibold text-sm">
                Procesando facturas
              </h3>
            </div>
            <p className="text-white/90 text-xs">
              {pendingCount} factura{pendingCount !== 1 ? "s" : ""} en proceso
            </p>
            <p className="text-white/70 text-xs mt-1">
              Se actualizará automáticamente
            </p>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setCollapsed(true)}
              className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              title="Minimizar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
