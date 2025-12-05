import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import type { LoginResponse, ErrorResponse } from "../types";

export default function LoginPage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!licenseKey.trim()) {
      setError("Por favor ingrese su licencia");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ license_key: licenseKey.trim() }),
      });

      const data: LoginResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      const loginData = data as LoginResponse;

      // Store firm data in localStorage
      localStorage.setItem("firmId", String(loginData.firmId));
      localStorage.setItem("firmName", loginData.firmName);
      localStorage.setItem(
        "usageCurrentMonth",
        String(loginData.usageCurrentMonth)
      );
      localStorage.setItem("planLimit", String(loginData.planLimit));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Error de conexión. Intente nuevamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión - ContableBot Portal</title>
        <meta name="description" content="Portal de facturación ContableBot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.title}>ContableBot Portal</h1>
          <p style={styles.subtitle}>Ingrese su licencia para continuar</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="licenseKey" style={styles.label}>
                Licencia
              </label>
              <input
                type="text"
                id="licenseKey"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Ingrese su clave de licencia"
                style={styles.input}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Validando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  loginBox: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    margin: "0 0 30px 0",
    fontSize: "14px",
    textAlign: "center",
    color: "#666",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  error: {
    padding: "12px",
    backgroundColor: "#fee",
    border: "1px solid #fcc",
    borderRadius: "6px",
    color: "#c00",
    fontSize: "14px",
    textAlign: "center",
  },
  button: {
    padding: "14px 20px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#0070f3",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};
