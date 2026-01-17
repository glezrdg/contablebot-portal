"use client"

import { Camera, Database, FileSpreadsheet, Zap, Shield, Clock, BarChart3, Globe } from "lucide-react";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: Camera,
    title: "Reconocimiento de Imágenes",
    description:
      "Sube fotos o escaneos de facturas. Nuestra IA extrae los datos automáticamente con alta precisión.",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Zap,
    title: "Procesamiento Instantáneo",
    description:
      "Obtén los datos de tu factura en segundos. Sin esperas, sin trabajo manual.",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    icon: FileSpreadsheet,
    title: "Formato Estructurado",
    description:
      "Los datos se organizan automáticamente en tablas con el formato contable adecuado.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    icon: Database,
    title: "Almacenamiento Seguro",
    description:
      "Todas tus facturas guardadas de forma segura en la nube, accesibles cuando las necesites.",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: Shield,
    title: "Cumplimiento DGII",
    description:
      "Genera reportes 606 listos para la DGII. Cumple con todas las regulaciones fiscales.",
    gradient: "from-rose-500 to-pink-400",
  },
  {
    icon: Clock,
    title: "Ahorra Tiempo",
    description:
      "Reduce hasta un 90% el tiempo de captura de facturas. Más tiempo para lo que importa.",
    gradient: "from-sky-500 to-blue-400",
  },
  {
    icon: BarChart3,
    title: "Reportes Detallados",
    description:
      "Visualiza tus gastos con gráficos claros. Toma decisiones informadas sobre tu negocio.",
    gradient: "from-indigo-500 to-violet-400",
  },
  {
    icon: Globe,
    title: "Acceso Desde Cualquier Lugar",
    description:
      "Plataforma 100% web. Accede a tus facturas desde cualquier dispositivo, en cualquier momento.",
    gradient: "from-teal-500 to-emerald-400",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="caracteristicas"
      className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[hsl(262_83%_58%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Características Poderosas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Todo lo que necesitas para{" "}
            <span className="text-gradient">tu contabilidad</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            ContableBot simplifica tu gestión de facturas con herramientas
            potentes e intuitivas diseñadas para contadores dominicanos.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card scroll-animate group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Gradient Border on Hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              {/* Icon */}
              <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="relative text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="relative text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative Corner */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-full`} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 sm:mt-20 text-center">
          <p className="text-muted-foreground mb-4">
            ¿Listo para transformar tu contabilidad?
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
          >
            Comienza tu prueba gratis
            <Zap className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
