import { Star } from "lucide-react";

const reviews = [
  {
    name: "María García",
    role: "Contadora, García & Asociados",
    content:
      "Contable Bot ha transformado completamente mi forma de trabajar. Lo que antes me tomaba horas ahora lo hago en minutos.",
    rating: 5,
    avatar: "MG",
  },
  {
    name: "Carlos Rodríguez",
    role: "CEO, TechStart SL",
    content:
      "La precisión del reconocimiento de facturas es impresionante. Prácticamente no tenemos que hacer correcciones manuales.",
    rating: 5,
    avatar: "CR",
  },
  {
    name: "Ana Martínez",
    role: "Directora Financiera, Retail Plus",
    content:
      "El mejor ROI que hemos tenido en herramientas de gestión. El equipo de soporte es excepcional.",
    rating: 5,
    avatar: "AM",
  },
];

export function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de profesionales ya confían en Contable Bot para su gestión de
            facturas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-green-400 text-green-400"
                  />
                ))}
              </div>

              <p className="text-foreground mb-6 leading-relaxed">{`"${review.content}"`}</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {review.avatar}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
