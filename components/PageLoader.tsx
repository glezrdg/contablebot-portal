/**
 * PageLoader Component
 *
 * A reusable loading spinner for page content areas.
 * Shows a centered spinner while page data is being fetched.
 */

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = "Cargando..." }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
