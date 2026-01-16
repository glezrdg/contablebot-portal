import { useState } from "react"
import {
  User,
  CreditCard,
  Settings,
  Bell,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUp,
  Zap,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardLayout from "@/components/DashboardLayout"
import type { MeResponse } from "@/types"
import { WHOP_PLANS } from "@/lib/whop"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<"perfil" | "suscripcion" | "preferencias">("perfil")

  return (
    <DashboardLayout title="Configuración - ContableBot Portal" description="Ajusta tu perfil, integraciones y preferencias">
      {(userData, refreshUserData) => (
        <>
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
            <p className="text-muted-foreground">
              Ajusta tu perfil, integraciones y preferencias
            </p>
          </div>

          {/* Tab Navigation - Horizontal */}
          <nav className="flex items-center gap-2 mb-6 bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-2 shadow-[var(--glass-shadow)]">
            <button
              onClick={() => setActiveTab("perfil")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "perfil"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-[var(--glass-white)] hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab("suscripcion")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "suscripcion"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-[var(--glass-white)] hover:text-foreground"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Suscripción</span>
            </button>

            <button
              onClick={() => setActiveTab("preferencias")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "preferencias"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-[var(--glass-white)] hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Preferencias</span>
            </button>
          </nav>

          {/* Main Content */}
          <div>
            {activeTab === "perfil" && (
              <PerfilTab userData={userData} onUpdate={refreshUserData} />
            )}

            {activeTab === "suscripcion" && (
              <SuscripcionTab userData={userData} />
            )}

            {activeTab === "preferencias" && (
              <PreferenciasTab />
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

// Perfil Tab Component
function PerfilTab({ userData, onUpdate }: { userData: MeResponse | null; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate passwords
    if (!passwordData.currentPassword) {
      setMessage({ type: "error", text: "Ingresa tu contraseña actual" })
      return
    }

    if (!passwordData.newPassword) {
      setMessage({ type: "error", text: "Ingresa una nueva contraseña" })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 8 caracteres" })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al cambiar contraseña")
      }

      setMessage({ type: "success", text: "Contraseña actualizada exitosamente" })
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al cambiar contraseña",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
      <h2 className="text-xl font-semibold text-foreground mb-6">Información del perfil</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 backdrop-blur-md ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-500 shadow-[0_4px_16px_rgba(34,197,94,0.1)]"
              : "bg-destructive/10 border border-destructive/30 text-destructive shadow-[0_4px_16px_rgba(239,68,68,0.1)]"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Firm Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre de la empresa
          </label>
          <input
            type="text"
            value={userData?.firmName || ""}
            disabled
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Contacta soporte para cambiar el nombre de tu empresa
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            value={userData?.email || ""}
            disabled
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            El email no se puede cambiar
          </p>
        </div>

        {/* Change Password Section */}
        <div className="pt-6 border-t border-[var(--glass-border)]">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center shadow-sm">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            Cambiar contraseña
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, current: !showPassword.current })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword.current ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, new: !showPassword.new })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword.new ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Repite la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword.confirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={changingPassword}
              className="w-full"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar contraseña
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Suscripción Tab Component
function SuscripcionTab({ userData }: { userData: MeResponse | null }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradingToPlan, setUpgradingToPlan] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleCancelSubscription = async () => {
    setCancelling(true)
    setMessage(null)

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cancelar suscripción")
      }

      setMessage({ type: "success", text: data.message })
      setShowCancelConfirm(false)

      // Reload page to refresh user data
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al cancelar suscripción",
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleReactivate = async () => {
    setReactivating(true)
    setMessage(null)

    try {
      const response = await fetch("/api/subscription/reactivate", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al reactivar suscripción")
      }

      setMessage({ type: "success", text: data.message })

      // Reload page to refresh user data
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al reactivar suscripción",
      })
    } finally {
      setReactivating(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    setUpgradingToPlan(planId)
    setMessage(null)

    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar plan")
      }

      setMessage({
        type: "success",
        text: `Plan actualizado exitosamente a ${data.newPlan.name}`,
      })

      // Reload page to refresh user data
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al cambiar plan",
      })
    } finally {
      setUpgrading(false)
      setUpgradingToPlan(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-500"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Cancellation Banner */}
      {userData?.cancelAtPeriodEnd && userData?.cancellationEffectiveDate && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-500 font-medium mb-1">
                Suscripción programada para cancelarse
              </p>
              <p className="text-xs text-yellow-500/80 mb-3">
                Tu suscripción se cancelará el{" "}
                {new Date(userData.cancellationEffectiveDate).toLocaleDateString("es-DO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                . Seguirás teniendo acceso hasta esa fecha.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                onClick={handleReactivate}
                disabled={reactivating}
              >
                {reactivating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reactivando...
                  </>
                ) : (
                  "Reactivar suscripción"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
        <h2 className="text-xl font-semibold text-foreground mb-6">Plan actual</h2>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData?.isActive
                  ? "bg-green-500/10 text-green-500"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {userData?.isActive ? "Activa" : "Inactiva"}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Facturas este mes</span>
              <span className="text-2xl font-bold text-foreground">
                {userData?.usedThisMonth || 0} / {userData?.planLimit || 0}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((userData?.usedThisMonth || 0) / (userData?.planLimit || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {userData?.planLimit && userData.usedThisMonth
                ? `${userData.planLimit - userData.usedThisMonth} facturas restantes`
                : "Gestiona tu límite de facturas"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Manage Subscription Button - Always show */}
            <Button variant="default" className="w-full" asChild>
              <a
                href={userData?.manageUrl || "https://whop.com/hub"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Gestionar en Whop
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>

            {/* Cancel Subscription Button - Show if active and not already cancelled */}
            {userData?.isActive && !userData?.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelling}
              >
                Cancelar suscripción
              </Button>
            )}
          </div>

          {!userData?.isActive && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-destructive font-medium mb-1">
                    Suscripción inactiva
                  </p>
                  <p className="text-xs text-destructive/80">
                    Tu suscripción no está activa. Actualiza tu método de pago para continuar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--glass-white)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-6 max-w-md w-full shadow-[0_24px_48px_0_rgba(0,0,0,0.3)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              ¿Cancelar suscripción?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tu suscripción se cancelará al final del período actual. Seguirás teniendo acceso
              a todas las funciones hasta esa fecha.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                No cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  "Sí, cancelar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Features */}
      <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Funciones de tu plan
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Extracción con IA</p>
              <p className="text-xs text-muted-foreground">
                Procesamiento automático de facturas con Google Vision AI
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Exportación a CSV/Excel</p>
              <p className="text-xs text-muted-foreground">
                Descarga tus facturas en formato 606
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Dashboard de análisis</p>
              <p className="text-xs text-muted-foreground">
                Visualiza estadísticas de tus facturas
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Soporte por email</p>
              <p className="text-xs text-muted-foreground">
                Respuesta en menos de 24 horas
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Change Plans Section */}
      {userData?.isActive && !userData?.cancelAtPeriodEnd && (
        <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center shadow-sm">
              <ArrowUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Cambiar plan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(WHOP_PLANS).map(([key, plan]) => {
              const isCurrentPlan = plan.invoices === userData?.planLimit
              const isDifferentPlan = plan.invoices !== userData?.planLimit

              if (!isDifferentPlan) return null

              const isUpgrade = plan.invoices > (userData?.planLimit || 0)
              const isDowngrade = plan.invoices < (userData?.planLimit || 0)

              return (
                <div
                  key={key}
                  className="bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] rounded-xl p-4 transition-all duration-300 hover:shadow-[0_8px_24px_0_rgba(31,38,135,0.15)] dark:hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.3)] hover:translate-y-[-2px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{plan.name}</h4>
                      {isUpgrade && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">
                          Upgrade
                        </span>
                      )}
                      {isDowngrade && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-500">
                          Downgrade
                        </span>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${plan.color} text-white`}>
                      ${plan.price}/mes
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {plan.subtitle}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {plan.invoices} facturas/mes
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isUpgrade && `+${plan.invoices - (userData?.planLimit || 0)} facturas más`}
                      {isDowngrade && `${plan.invoices - (userData?.planLimit || 0)} facturas (menos)`}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading || userData?.cancelAtPeriodEnd}
                  >
                    {upgrading && upgradingToPlan === plan.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        Cambiar a {plan.name}
                        <ArrowUp className="w-3 h-3 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Los cambios de plan se aplican inmediatamente y Whop ajusta automáticamente el costo
          </p>
        </div>
      )}
    </div>
  )
}

// Preferencias Tab Component
function PreferenciasTab() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    monthlyReports: false,
    autoExport: false,
  })

  return (
    <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
      <h2 className="text-xl font-semibold text-foreground mb-6">Preferencias</h2>

      <div className="space-y-6">
        {/* Notifications Section */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center shadow-sm">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            Notificaciones
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Notificaciones por email
                </p>
                <p className="text-xs text-muted-foreground">
                  Recibe actualizaciones sobre tus facturas
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailNotifications: e.target.checked })
                }
                className="w-5 h-5 text-primary rounded border-border focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Reportes mensuales
                </p>
                <p className="text-xs text-muted-foreground">
                  Resumen automático de tus facturas cada mes
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.monthlyReports}
                onChange={(e) =>
                  setPreferences({ ...preferences, monthlyReports: e.target.checked })
                }
                className="w-5 h-5 text-primary rounded border-border focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </div>

        {/* Export Settings */}
        <div className="pt-6 border-t border-[var(--glass-border)]">
          <h3 className="text-lg font-medium text-foreground mb-4">
            Configuración de exportación
          </h3>
          <label className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer">
            <div>
              <p className="text-sm font-medium text-foreground">
                Auto-exportar al final del mes
              </p>
              <p className="text-xs text-muted-foreground">
                Genera automáticamente el archivo 606 el último día del mes
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoExport}
              onChange={(e) =>
                setPreferences({ ...preferences, autoExport: e.target.checked })
              }
              className="w-5 h-5 text-primary rounded border-border focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-[var(--glass-border)]">
          <Button className="w-full" variant="gradient">
            Guardar preferencias
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Próximamente: las preferencias se guardarán automáticamente
          </p>
        </div>
      </div>
    </div>
  )
}
