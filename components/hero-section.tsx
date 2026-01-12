import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Potenciado por Inteligencia Artificial</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
          Automatiza tus facturas con el poder de la IA
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Sube una imagen de tu factura y deja que Contable Bot extraiga todos
          los datos automáticamente. Organiza tu contabilidad sin esfuerzo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto text-base px-8">
              Comenzar Gratis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-base px-8 bg-transparent"
          >
            Ver Demo
          </Button>
        </div>

        <div className="mt-16 relative">
          <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-chart-4/50" />
              <div className="w-3 h-3 rounded-full bg-chart-2/50" />
            </div>
            <div className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-muted rounded-xl p-8 flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Arrastra tu factura aquí
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-chart-2 rounded-full" />
                    <span className="text-sm text-muted-foreground">
                      Proveedor:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Empresa ABC S.L.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-chart-2 rounded-full" />
                    <span className="text-sm text-muted-foreground">
                      Fecha:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      15/01/2026
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-chart-2 rounded-full" />
                    <span className="text-sm text-muted-foreground">
                      Total:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      €1,250.00
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-chart-2 rounded-full" />
                    <span className="text-sm text-muted-foreground">IVA:</span>
                    <span className="text-sm font-medium text-foreground">
                      €217.50
                    </span>
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
