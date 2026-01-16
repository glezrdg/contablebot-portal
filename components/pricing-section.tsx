"use client";

import { Button } from "@/components/ui/button";
import { Check, Sparkles, Gift, ArrowRight, Crown, Zap } from "lucide-react";
import { WHOP_PLANS, WHOP_CONFIG, type PlanKey } from "@/lib/whop";
import Link from "next/link";
import { useEffect, useRef } from "react";

const planOrder: PlanKey[] = [
  "starter",
  "business",
  "pro",
  "ultra",
  "enterprise",
];

const planGradients: Record<PlanKey, string> = {
  starter: "from-slate-500 to-slate-400",
  business: "from-blue-500 to-cyan-400",
  pro: "from-violet-500 to-purple-400",
  ultra: "from-amber-500 to-orange-400",
  enterprise: "from-rose-500 to-pink-400",
};

export function PricingSection() {
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

    const cards = sectionRef.current?.querySelectorAll('.pricing-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="precios"
      className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[hsl(262_83%_58%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            <span>Planes y Precios</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Elige el plan perfecto{" "}
            <span className="text-gradient">para tu negocio</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Automatiza tu 606 con IA desde fotos de facturas. Todos los planes
            incluyen prueba gratis.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 font-medium rounded-full border border-green-500/20">
            <Gift className="w-5 h-5" />
            <span>1 MES GRATIS en el plan Starter</span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5">
          {planOrder.map((planKey, index) => {
            const plan = WHOP_PLANS[planKey];
            const isPopular = planKey === "pro";
            const gradient = planGradients[planKey];

            return (
              <div
                key={planKey}
                className={`pricing-card scroll-animate group relative flex flex-col ${
                  isPopular ? "lg:scale-105 z-10" : ""
                }`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                {/* Card */}
                <div
                  className={`relative h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border rounded-2xl p-5 flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                    isPopular
                      ? "border-primary/50 shadow-xl shadow-primary/20"
                      : "border-white/20 dark:border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-lg shadow-primary/30">
                      <Sparkles className="w-3 h-3" />
                      Más Popular
                    </div>
                  )}

                  {/* Gradient Top Accent */}
                  <div className={`absolute top-0 left-4 right-4 h-1 bg-gradient-to-r ${gradient} rounded-b-full opacity-80`} />

                  {/* Plan Header */}
                  <div className="text-center pt-3 mb-5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient}`} />
                      <h3 className="text-lg font-bold text-foreground">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      {plan.subtitle}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline justify-center gap-1 mb-3">
                      <span className="text-sm text-muted-foreground">US$</span>
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground text-sm">/mes</span>
                    </div>

                    {/* Trial Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                      <Gift className="w-3.5 h-3.5" />
                      {plan.trialDays === 30
                        ? "1 mes gratis"
                        : `${plan.trialDays} días gratis`}
                    </div>
                  </div>

                  {/* Invoice Limit */}
                  <div className={`text-center mb-5 py-2 rounded-lg bg-gradient-to-r ${gradient} bg-opacity-10`}>
                    <p className="text-sm font-semibold text-foreground">
                      hasta {plan.invoices.toLocaleString()} facturas/mes
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-5 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={`/register?plan=${planKey}`} className="w-full">
                    <Button
                      className={`w-full group/btn ${
                        isPopular
                          ? "bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30"
                          : "bg-white/50 dark:bg-slate-800/50 hover:bg-primary hover:text-white border border-border hover:border-primary"
                      } transition-all`}
                      variant={isPopular ? "default" : "outline"}
                      size="sm"
                    >
                      <span>
                        {plan.trialDays === 30
                          ? "Probar 1 Mes Gratis"
                          : "Comenzar Prueba"}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 sm:mt-20">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  Pagos seguros con Whop
                </p>
                <p className="text-xs text-muted-foreground">
                  Cancela cuando quieras
                </p>
              </div>
            </div>

            <div className="w-px h-10 bg-border hidden sm:block" />

            <a
              href={WHOP_CONFIG.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Ver todos los planes en Whop
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
