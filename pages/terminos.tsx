import Head from "next/head";
import Link from "next/link";
import { FileText, ArrowLeft, Shield, Scale, AlertTriangle, FileCheck, Users, CreditCard } from "lucide-react";

export default function TerminosPage() {
  return (
    <>
      <Head>
        <title>Términos de Servicio - ContableBot</title>
        <meta name="description" content="Términos y condiciones de uso de ContableBot" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--glass-white)] backdrop-blur-xl border-b border-[var(--glass-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all group-hover:scale-105">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-foreground">ContableBot</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Términos de Servicio
            </h1>
            <p className="text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-primary" />
                  </div>
                  1. Aceptación de los Términos
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Al acceder y utilizar ContableBot (&quot;el Servicio&quot;), usted acepta estar sujeto a estos
                  Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no
                  podrá acceder al Servicio. Estos términos se aplican a todos los usuarios, visitantes
                  y otras personas que acceden o utilizan el Servicio.
                </p>
              </section>

              {/* Service Description */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  2. Descripción del Servicio
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ContableBot es una plataforma de procesamiento de facturas que utiliza inteligencia
                  artificial para extraer datos de documentos fiscales. El Servicio está diseñado para
                  facilitar la gestión contable y el cumplimiento de obligaciones tributarias en la
                  República Dominicana, incluyendo la generación de formatos 606 y 607 para la DGII.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  El Servicio incluye:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                  <li>Procesamiento automático de facturas mediante OCR e IA</li>
                  <li>Extracción de datos fiscales (NCF, RNC, montos, ITBIS)</li>
                  <li>Gestión de clientes y proveedores</li>
                  <li>Exportación de datos en formatos compatibles con la DGII</li>
                  <li>Almacenamiento seguro de documentos</li>
                </ul>
              </section>

              {/* User Accounts */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  3. Cuentas de Usuario
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa
                  y completa. Usted es responsable de:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Mantener la confidencialidad de su contraseña</li>
                  <li>Restringir el acceso a su cuenta</li>
                  <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
                  <li>Toda actividad que ocurra bajo su cuenta</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos
                  o que muestren actividad sospechosa.
                </p>
              </section>

              {/* Payments */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  4. Pagos y Suscripciones
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  El Servicio opera bajo un modelo de suscripción mensual. Al suscribirse:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Autoriza cargos recurrentes a su método de pago</li>
                  <li>Los pagos se procesan a través de Whop, nuestro procesador de pagos</li>
                  <li>Los precios pueden cambiar con 30 días de aviso previo</li>
                  <li>Puede cancelar en cualquier momento desde su panel de control</li>
                  <li>Al cancelar, mantendrá acceso hasta el fin del período pagado</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  No ofrecemos reembolsos por períodos parciales de suscripción, excepto en casos
                  específicos a nuestra discreción.
                </p>
              </section>

              {/* Usage Limits */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                  </div>
                  5. Límites de Uso
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Cada plan tiene límites específicos de facturas procesables por mes. Al exceder
                  estos límites:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>No podrá procesar facturas adicionales hasta el siguiente ciclo</li>
                  <li>Puede actualizar a un plan superior en cualquier momento</li>
                  <li>Los límites se reinician el primer día de cada mes calendario</li>
                </ul>
              </section>

              {/* Prohibited Uses */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                  </div>
                  6. Uso Prohibido
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Está prohibido utilizar el Servicio para:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Procesar documentos fraudulentos o falsificados</li>
                  <li>Evadir obligaciones fiscales o cometer fraude tributario</li>
                  <li>Violar leyes o regulaciones aplicables</li>
                  <li>Interferir con la seguridad o funcionamiento del Servicio</li>
                  <li>Acceder a datos de otros usuarios sin autorización</li>
                  <li>Revender o redistribuir el Servicio sin autorización</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  7. Propiedad Intelectual
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  El Servicio y su contenido original, características y funcionalidad son propiedad
                  exclusiva de ContableBot y están protegidos por leyes de propiedad intelectual.
                  Usted mantiene todos los derechos sobre los documentos y datos que carga al Servicio.
                </p>
              </section>

              {/* Disclaimer */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                  </div>
                  8. Limitación de Responsabilidad
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  El Servicio se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. No garantizamos que:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>El Servicio funcionará sin interrupciones</li>
                  <li>Los resultados de la extracción serán 100% precisos</li>
                  <li>El Servicio cumplirá con todos sus requisitos específicos</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong className="text-foreground">Importante:</strong> ContableBot es una herramienta de
                  asistencia contable. Los usuarios son responsables de verificar la exactitud de los
                  datos extraídos antes de presentarlos ante la DGII u otras entidades. No somos
                  responsables de errores en declaraciones fiscales derivados del uso del Servicio.
                </p>
              </section>

              {/* Modifications */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-primary" />
                  </div>
                  9. Modificaciones
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios entrarán en vigor inmediatamente después de su publicación.
                  El uso continuado del Servicio después de cambios constituye aceptación de
                  los términos modificados.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  10. Contacto
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para preguntas sobre estos Términos de Servicio, contáctenos en:{" "}
                  <a href="mailto:soporte@contablebot.com" className="text-primary hover:underline">
                    soporte@contablebot.com
                  </a>
                </p>
              </section>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Ver también:{" "}
              <Link href="/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
