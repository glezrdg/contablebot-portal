import { Camera, Database, FileSpreadsheet, Zap } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Reconocimiento de Imágenes",
    description:
      "Sube fotos o escaneos de facturas. Nuestra IA extrae los datos automáticamente con alta precisión.",
  },
  {
    icon: Zap,
    title: "Procesamiento Instantáneo",
    description:
      "Obtén los datos de tu factura en segundos. Sin esperas, sin trabajo manual.",
  },
  {
    icon: FileSpreadsheet,
    title: "Formato Estructurado",
    description:
      "Los datos se organizan automáticamente en tablas con el formato contable adecuado.",
  },
  {
    icon: Database,
    title: "Almacenamiento Seguro",
    description:
      "Todas tus facturas guardadas de forma segura en la nube, accesibles cuando las necesites.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="caracteristicas"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Todo lo que necesitas para tu contabilidad
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Contable Bot simplifica tu gestión de facturas con herramientas
            potentes e intuitivas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
