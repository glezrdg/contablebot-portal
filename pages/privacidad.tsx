import Head from "next/head";
import Link from "next/link";
import { FileText, ArrowLeft, Shield, Eye, Database, Lock, Share2, Globe, Bell, Trash2 } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <>
      <Head>
        <title>Política de Privacidad - ContableBot</title>
        <meta name="description" content="Política de privacidad y protección de datos de ContableBot" />
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Política de Privacidad
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
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  1. Introducción
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  En ContableBot, nos comprometemos a proteger su privacidad y sus datos personales.
                  Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y
                  protegemos su información cuando utiliza nuestro servicio de procesamiento de
                  facturas con inteligencia artificial.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Al utilizar ContableBot, usted acepta las prácticas descritas en esta política.
                  Le recomendamos leerla detenidamente.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                  2. Información que Recopilamos
                </h2>

                <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.1 Información de Cuenta</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Nombre completo y nombre de la empresa</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Contraseña (almacenada de forma encriptada)</li>
                  <li>Información de facturación y pago</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.2 Datos de Facturas</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Imágenes de facturas que usted carga</li>
                  <li>Datos extraídos: NCF, RNC, montos, fechas, ITBIS</li>
                  <li>Información de clientes y proveedores</li>
                  <li>Metadatos de archivos (fecha de carga, tamaño)</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.3 Datos de Uso</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Registros de acceso y actividad en la plataforma</li>
                  <li>Dirección IP y tipo de navegador</li>
                  <li>Páginas visitadas y funciones utilizadas</li>
                  <li>Información del dispositivo</li>
                </ul>
              </section>

              {/* How We Use Information */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  3. Cómo Usamos su Información
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos la información recopilada para:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Proporcionar el Servicio:</strong> Procesar facturas, extraer datos y generar reportes</li>
                  <li><strong className="text-foreground">Mejorar el Servicio:</strong> Entrenar y mejorar nuestros modelos de IA para mayor precisión</li>
                  <li><strong className="text-foreground">Gestionar su Cuenta:</strong> Autenticación, soporte al cliente y comunicaciones</li>
                  <li><strong className="text-foreground">Facturación:</strong> Procesar pagos y gestionar suscripciones</li>
                  <li><strong className="text-foreground">Seguridad:</strong> Detectar y prevenir fraudes y accesos no autorizados</li>
                  <li><strong className="text-foreground">Cumplimiento Legal:</strong> Cumplir con obligaciones legales y regulatorias</li>
                </ul>
              </section>

              {/* AI Processing */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                  4. Procesamiento con Inteligencia Artificial
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ContableBot utiliza servicios de inteligencia artificial de terceros para el
                  procesamiento de facturas:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Google Cloud Vision:</strong> Para reconocimiento óptico de caracteres (OCR)</li>
                  <li><strong className="text-foreground">Google Gemini:</strong> Para extracción inteligente de datos estructurados</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Estos servicios procesan las imágenes de facturas para extraer información.
                  Google tiene sus propias políticas de privacidad y prácticas de seguridad.
                  Las imágenes se transmiten de forma segura y no se retienen permanentemente
                  por estos servicios más allá del tiempo necesario para el procesamiento.
                </p>
              </section>

              {/* Data Sharing */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-primary" />
                  </div>
                  5. Compartir Información
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  No vendemos ni alquilamos su información personal. Compartimos datos solo en
                  las siguientes circunstancias:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Proveedores de Servicios:</strong> Google Cloud (procesamiento IA), Whop (pagos), proveedores de hosting</li>
                  <li><strong className="text-foreground">Requerimientos Legales:</strong> Cuando sea requerido por ley o autoridades competentes</li>
                  <li><strong className="text-foreground">Protección de Derechos:</strong> Para proteger nuestros derechos, propiedad o seguridad</li>
                  <li><strong className="text-foreground">Con su Consentimiento:</strong> Cuando usted autorice expresamente compartir información</li>
                </ul>
              </section>

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  6. Seguridad de Datos
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger
                  su información:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Encriptación de datos en tránsito (HTTPS/TLS)</li>
                  <li>Encriptación de datos en reposo</li>
                  <li>Contraseñas hasheadas con algoritmos seguros (bcrypt)</li>
                  <li>Autenticación mediante tokens JWT</li>
                  <li>Acceso restringido basado en roles</li>
                  <li>Monitoreo continuo de seguridad</li>
                  <li>Copias de seguridad regulares</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Sin embargo, ningún sistema es completamente seguro. No podemos garantizar
                  la seguridad absoluta de sus datos.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                  7. Retención de Datos
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Conservamos su información mientras su cuenta esté activa o según sea necesario
                  para proporcionar el Servicio. Específicamente:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Datos de cuenta:</strong> Mientras la cuenta esté activa</li>
                  <li><strong className="text-foreground">Facturas y datos extraídos:</strong> Según la configuración de su cuenta o requisitos legales</li>
                  <li><strong className="text-foreground">Registros de acceso:</strong> 90 días para propósitos de seguridad</li>
                  <li><strong className="text-foreground">Datos de facturación:</strong> Según requisitos fiscales y legales (hasta 10 años)</li>
                </ul>
              </section>

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  8. Sus Derechos
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Usted tiene los siguientes derechos sobre sus datos personales:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Acceso:</strong> Solicitar copia de sus datos personales</li>
                  <li><strong className="text-foreground">Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                  <li><strong className="text-foreground">Eliminación:</strong> Solicitar la eliminación de sus datos</li>
                  <li><strong className="text-foreground">Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                  <li><strong className="text-foreground">Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                  <li><strong className="text-foreground">Limitación:</strong> Restringir el procesamiento en ciertas circunstancias</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para ejercer estos derechos, contáctenos en{" "}
                  <a href="mailto:privacidad@contablebot.com" className="text-primary hover:underline">
                    privacidad@contablebot.com
                  </a>
                </p>
              </section>

              {/* Cookies */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  9. Cookies y Tecnologías Similares
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos cookies y tecnologías similares para:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Cookies esenciales:</strong> Necesarias para el funcionamiento del Servicio</li>
                  <li><strong className="text-foreground">Cookies de sesión:</strong> Mantener su sesión iniciada</li>
                  <li><strong className="text-foreground">Cookies de preferencias:</strong> Recordar sus configuraciones</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  No utilizamos cookies de publicidad o seguimiento de terceros.
                </p>
              </section>

              {/* Children */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  10. Menores de Edad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  El Servicio no está dirigido a menores de 18 años. No recopilamos
                  intencionalmente información de menores. Si descubrimos que hemos
                  recopilado datos de un menor, los eliminaremos inmediatamente.
                </p>
              </section>

              {/* Changes */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  11. Cambios a esta Política
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos actualizar esta Política de Privacidad periódicamente.
                  Le notificaremos sobre cambios significativos por correo electrónico
                  o mediante un aviso destacado en el Servicio. Le recomendamos revisar
                  esta política regularmente.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-primary" />
                  </div>
                  12. Contacto
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Si tiene preguntas sobre esta Política de Privacidad o sobre cómo
                  manejamos sus datos, contáctenos:
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li>
                    <strong className="text-foreground">Email:</strong>{" "}
                    <a href="mailto:privacidad@contablebot.com" className="text-primary hover:underline">
                      privacidad@contablebot.com
                    </a>
                  </li>
                  <li>
                    <strong className="text-foreground">Soporte:</strong>{" "}
                    <a href="mailto:soporte@contablebot.com" className="text-primary hover:underline">
                      soporte@contablebot.com
                    </a>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Ver también:{" "}
              <Link href="/terminos" className="text-primary hover:underline">
                Términos de Servicio
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
