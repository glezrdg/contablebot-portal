"use client"

import { Star, Quote, MessageSquare } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

const reviews = [
  {
    name: "María García",
    role: "Contadora",
    company: "García & Asociados",
    content:
      "ContableBot ha transformado completamente mi forma de trabajar. Lo que antes me tomaba horas ahora lo hago en minutos. La precisión de la IA es increíble.",
    rating: 5,
    avatar: "MG",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    name: "Carlos Rodríguez",
    role: "CEO",
    company: "TechStart SRL",
    content:
      "La precisión del reconocimiento de facturas es impresionante. Prácticamente no tenemos que hacer correcciones manuales. Un ahorro de tiempo invaluable.",
    rating: 5,
    avatar: "CR",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    name: "Ana Martínez",
    role: "Directora Financiera",
    company: "Retail Plus",
    content:
      "El mejor ROI que hemos tenido en herramientas de gestión. El equipo de soporte es excepcional y la plataforma mejora constantemente.",
    rating: 5,
    avatar: "AM",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    name: "José Pérez",
    role: "Contador Público",
    company: "Pérez Consulting",
    content:
      "Mis clientes están encantados con la rapidez en la entrega de sus reportes. ContableBot me ha ayudado a ser más eficiente y profesional.",
    rating: 5,
    avatar: "JP",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    name: "Laura Sánchez",
    role: "Gerente Administrativo",
    company: "Grupo Comercial RD",
    content:
      "La generación automática de reportes 606 es perfecta. Ya no me preocupo por errores de transcripción. Totalmente recomendado.",
    rating: 5,
    avatar: "LS",
    gradient: "from-rose-500 to-pink-400",
  },
  {
    name: "Roberto Díaz",
    role: "Propietario",
    company: "Farmacia Central",
    content:
      "Procesamos cientos de facturas al mes y ContableBot nos ha permitido reducir nuestro tiempo de contabilidad en un 80%.",
    rating: 5,
    avatar: "RD",
    gradient: "from-indigo-500 to-violet-400",
  },
];

export function ReviewsSection() {
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

    const cards = sectionRef.current?.querySelectorAll('.review-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="reviews"
      className="relative px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(262_83%_58%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        {/* <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" />
            <span>Testimonios</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Lo que dicen{" "}
            <span className="text-gradient">nuestros clientes</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Miles de profesionales en República Dominicana ya confían en ContableBot
            para su gestión de facturas.
          </p>
        </div> */}

        {/* Reviews Grid */}
        <div className="hidden md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="review-card scroll-animate group relative"
              style={{ transitionDelay: `${index * 75}ms` }}
            >
              <div className="relative h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                {/* Quote Icon */}
                <div className={`absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br ${review.gradient} rounded-xl flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                  <Quote className="w-5 h-5 text-white" />
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4 pt-2">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Review Content */}
                <p className="text-foreground mb-6 leading-relaxed">
                  &ldquo;{review.content}&rdquo;
                </p>

                {/* Reviewer Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${review.gradient} flex items-center justify-center shadow-md`}>
                    <span className="text-sm font-bold text-white">
                      {review.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {review.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {review.role}, {review.company}
                    </p>
                  </div>
                </div>

                {/* Decorative gradient corner */}
                <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br ${review.gradient} opacity-5 rounded-tl-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="my-12 text-center">
          <Image
            src="/contablebot-logo.png"
            alt="ContableBot"
            width={400}
            height={92}
            className="object-contain m-auto w-[200px] sm:w-[280px] md:w-[350px] lg:w-[400px]"
            priority
          />
        </div>
        <div className="hidden mt-16 sm:mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 sm:gap-10 p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">10+</div>
              <div className="text-sm text-muted-foreground">Clientes Activos</div>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">4.9/5</div>
              <div className="text-sm text-muted-foreground">Calificación Promedio</div>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">90%</div>
              <div className="text-sm text-muted-foreground">Tasa de Satisfacción</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
