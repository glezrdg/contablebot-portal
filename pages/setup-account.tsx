// /pages/setup-account.tsx - First-time account setup page
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import type { ErrorResponse } from "../types";

export default function SetupAccountPage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!licenseKey.trim()) {
      setError("La licencia es requerida");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Email inválido");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.error || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Setup error:", err);
      setError("Error de conexión. Intente nuevamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Crear Cuenta - ContableBot Portal</title>
        <meta
          name="description"
          content="Configure su cuenta de ContableBot Portal"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="bg-white p-8 sm:p-10 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            ContableBot Portal
          </h1>
          <p className="text-sm text-center text-gray-500 mb-8">
            Configure su cuenta por primera vez
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="licenseKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Licencia
              </label>
              <input
                type="text"
                id="licenseKey"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Ingrese su clave de licencia"
                disabled={loading}
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="su@email.com"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la contraseña"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-base font-semibold text-white bg-blue-600 rounded-lg transition-colors mt-2 ${
                loading ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              ¿Ya tiene una cuenta?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
