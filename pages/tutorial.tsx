/**
 * Tutorial Page
 *
 * Shows tutorial video for ContableBot users
 */

import DashboardLayout from "@/components/DashboardLayout";
import { PlayCircle } from "lucide-react";

export default function TutorialPage() {
  // Tutorial video URL - replace with your actual video URL
  const tutorialVideoUrl = "https://www.youtube.com/embed/lNIL5DN3Qyo";

  return (
    <DashboardLayout
      title="Tutorial - ContableBot"
      description="Aprende a usar ContableBot"
      showUserStats={false}
    >
      {() => (
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <PlayCircle className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Tutorial</h1>
            </div>
            <p className="text-muted-foreground">
              Aprende a utilizar todas las funcionalidades de ContableBot
            </p>
          </div>

          {/* Video Container */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            <div className="aspect-video w-full bg-black">
              <iframe
                src={tutorialVideoUrl}
                title="Tutorial de ContableBot"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Info */}
            <div className="p-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Guía completa de ContableBot
              </h2>
              <p className="text-muted-foreground mb-4">
                En este tutorial aprenderás:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Cómo subir y procesar facturas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Gestión de clientes y organización de datos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Generación de reportes y formulario 606</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Control de calidad y revisión de facturas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Configuración de usuarios y permisos</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-muted/50 border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¿Necesitas ayuda adicional?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Si tienes preguntas o necesitas asistencia, no dudes en contactarnos.
            </p>
            <a
              href="mailto:support@contablebot.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
