import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Upload, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[hsl(262_83%_58%)]/20 rounded-full blur-3xl animate-blob-delayed" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-primary/20 text-primary text-sm font-medium mb-8 shadow-lg shadow-primary/10">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Potenciado por Inteligencia Artificial</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 animate-fade-up-delay-1">
          Automatiza tus facturas{" "}
          <span className="text-gradient">con el poder de la IA</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up-delay-2">
          Sube una imagen de tu factura y deja que ContableBot extraiga todos
          los datos automáticamente. Organiza tu contabilidad sin esfuerzo.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay-3">
          <Link href="/register">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base px-8 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Comenzar Gratis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="#caracteristicas">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 border-border hover:border-primary/50 hover:scale-105 transition-all"
            >
              Ver Características
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12 animate-fade-up-delay-4">
          {[
            { value: "10,000+", label: "Facturas Procesadas" },
            { value: "90%", label: "Precisión IA" },
            { value: "< 1.25s", label: "Tiempo Promedio" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Demo Preview Card */}
        <div className="mt-16 sm:mt-20 relative animate-fade-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards', opacity: 0 }}>
          {/* Glow Effect Behind Card */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-[hsl(262_83%_58%)]/20 to-primary/20 blur-3xl scale-110 animate-pulse-glow" />

          {/* Main Card */}
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Window Controls */}
            <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-medium text-muted-foreground">ContableBot - Dashboard</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                {/* Upload Zone */}
                <div className="group relative bg-gradient-to-br from-primary/5 to-[hsl(262_83%_58%)]/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/10">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Arrastra tu factura aquí
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, PDF hasta 5MB
                    </p>
                  </div>

                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-all" />
                </div>

                {/* Extracted Data Preview */}
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { label: "Proveedor", value: "Empresa ABC, SRL", delay: "0.1s" },
                    { label: "RNC", value: "130-45678-9", delay: "0.2s" },
                    { label: "Fecha", value: "15/01/2026", delay: "0.3s" },
                    { label: "Subtotal", value: "RD$ 1,032.50", delay: "0.4s" },
                    { label: "ITBIS (18%)", value: "RD$ 217.50", delay: "0.5s" },
                    { label: "Total", value: "RD$ 1,250.00", highlight: true, delay: "0.6s" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${item.highlight
                        ? 'bg-gradient-to-r from-primary/10 to-[hsl(262_83%_58%)]/10 border border-primary/20'
                        : 'bg-slate-50/80 dark:bg-slate-800/50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${item.highlight ? 'text-primary' : 'text-green-500'}`} />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className={`text-sm font-medium ${item.highlight ? 'text-primary font-bold' : 'text-foreground'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}

                  {/* Processing Indicator */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">Procesado en 2.3 segundos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
