/**
 * PageLoader Component
 *
 * A modern loading spinner with brand colors and animations.
 * Shows a centered animated logo while page data is being fetched.
 */

import Image from "next/image";

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = "Cargando..." }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(262_83%_58%)]/5 animate-pulse" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Animated spinner rings */}
        <div className="relative w-24 h-24">
          {/* Outer ring - Purple */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[hsl(262_83%_58%)] animate-spin"
               style={{ animationDuration: '1.5s' }} />

          {/* Middle ring - Blue */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-r-primary animate-spin"
               style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

          {/* Inner glow ring */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 animate-pulse" />

          {/* Logo container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] rounded-xl flex items-center justify-center shadow-lg animate-pulse"
                 style={{ animationDuration: '2s' }}>
              <Image
                src="/logo_icon.png"
                alt="ContableBot"
                width={32}
                height={32}
                className="object-contain opacity-90"
              />
            </div>
          </div>
        </div>

        {/* Loading text with gradient */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-semibold bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] bg-clip-text text-transparent animate-pulse">
            {message}
          </p>

          {/* Animated dots */}
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[hsl(262_83%_58%)] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
